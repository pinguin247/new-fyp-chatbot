import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

interface UserSession {
  sessionID: string;
  y_c: number;
  y_p: number;
  strategyWeights: { central: number[]; peripheral: number[] };
  selectedStrategies: { central: number[]; peripheral: number[] };
  strategyIndexChosen: number;
  persuasionAttempt: number;
  current_exercise: string; // Track the current exercise
  failedPersuasionCount: number; // Track the number of failed attempts for the current exercise
}

@Injectable()
export class MapService {
  private users: Record<string, UserSession> = {};

  constructor(private readonly supabaseService: SupabaseService) {}

  async createNewSession(userId: string, exercise: string) {
    this.users[userId] = {
      sessionID: userId,
      y_c: 0,
      y_p: 1,
      strategyWeights: {
        central: [0.2, 0.2, 0.2, 0.2, 0.2],
        peripheral: [0.167, 0.167, 0.167, 0.167, 0.167, 0.167],
      },
      selectedStrategies: {
        central: [1, 1, 1, 1, 1],
        peripheral: [1, 1, 1, 1, 1, 1],
      },
      strategyIndexChosen: 0,
      persuasionAttempt: 0,
      current_exercise: exercise,
      failedPersuasionCount: 0,
    };

    console.log(
      `Created new session for userId: ${userId}`,
      this.users[userId],
    );

    // Store session in Supabase with user_id
    try {
      await this.supabaseService.insertSessionData({
        user_id: userId, // Insert the userId into the user_id field
        y_c: 0,
        y_p: 1,
        strategy_weights: this.users[userId].strategyWeights,
        selected_strategies: this.users[userId].selectedStrategies,
        strategy_index_chosen: 0,
        persuasion_attempt: 0,
        current_exercise: exercise,
        failed_persuasion_count: 0,
      });
    } catch (error) {
      console.error('Error creating session in Supabase:', error);
    }
  }

  getSession(userId: string): UserSession | null {
    return this.users[userId] || null;
  }

  async loadSessionFromSupabase(userId: string) {
    try {
      const data = await this.supabaseService.fetchSessionData(userId);

      if (data) {
        this.users[userId] = {
          sessionID: data.user_id, // Use user_id here
          y_c: data.y_c,
          y_p: data.y_p,
          strategyWeights: data.strategy_weights,
          selectedStrategies: data.selected_strategies,
          strategyIndexChosen: data.strategy_index_chosen || 0,
          persuasionAttempt: data.persuasion_attempt || 0,
          current_exercise: data.current_exercise || '',
          failedPersuasionCount: data.failed_persuasion_count || 0,
        };
        console.log(`Loaded session for userId: ${userId}`, this.users[userId]);
        return this.users[userId];
      }
      return null;
    } catch (error) {
      console.error('Error loading session from Supabase:', error);
      return null;
    }
  }

  async updateCurrentExercise(userId: string, newExercise: string) {
    const userSession = this.getSession(userId);

    if (!userSession) {
      console.error('No session found to update exercise');
      return;
    }

    userSession.current_exercise = newExercise;
    userSession.failedPersuasionCount = 0; // Reset failed attempts

    console.log(
      `Updated current exercise for user ${userId} to ${newExercise}`,
    );

    // Update the current exercise in Supabase
    try {
      await this.supabaseService.updateSessionData(userId, {
        current_exercise: newExercise,
        failed_persuasion_count: 0, // Reset the failed count in Supabase as well
      });
    } catch (error) {
      console.error('Error updating current exercise in Supabase:', error);
    }
  }

  decidePersuasionRoute(
    sessionID: string,
    x_m: number,
  ): 'central' | 'peripheral' {
    const userSession = this.users[sessionID];

    // Use x_m directly to update motivation values
    userSession.y_c = x_m;
    userSession.y_p = 1 - x_m;

    console.log(
      `Updated motivation values: y_c = ${userSession.y_c}, y_p = ${userSession.y_p}`,
    );

    // Select strategy based on current route using activation vectors
    const isCentralRoute = userSession.y_c > 0.5;
    const candidateStrategiesWeights = isCentralRoute
      ? userSession.strategyWeights.central
      : userSession.strategyWeights.peripheral;

    const candidateSelectedStrategies = isCentralRoute
      ? userSession.selectedStrategies.central
      : userSession.selectedStrategies.peripheral;

    console.log(`Candidate strategy weights:`, candidateStrategiesWeights);
    console.log(`Candidate selected strategies:`, candidateSelectedStrategies);

    // Calculate activation vectors
    const activationVectors: number[] = [];
    for (let i = 0; i < candidateStrategiesWeights.length; i++) {
      activationVectors[i] =
        candidateStrategiesWeights[i] *
        Math.max(userSession.y_c, userSession.y_p) *
        candidateSelectedStrategies[i];
    }

    console.log(`Activation vectors:`, activationVectors);

    // Select strategy based on maximum activation vector
    const maxActivationVector = Math.max(...activationVectors);
    userSession.strategyIndexChosen = activationVectors.findIndex(
      (value) => value === maxActivationVector,
    );

    console.log(
      `Chosen strategy index: ${userSession.strategyIndexChosen}, Max activation vector: ${maxActivationVector}`,
    );

    // Update eligibility
    candidateSelectedStrategies[userSession.strategyIndexChosen] = 0;

    // Adjust strategyIndexChosen if peripheral route is selected
    if (!isCentralRoute) {
      userSession.strategyIndexChosen += 5;
    }

    console.log(
      `Final chosen strategy index: ${userSession.strategyIndexChosen}`,
    );

    return isCentralRoute ? 'central' : 'peripheral';
  }

  getCurrentStrategy(sessionID: string): string {
    const userSession = this.users[sessionID];
    const isCentralRoute = userSession.y_c > 0.5;
    const strategies = isCentralRoute
      ? ['Logic', 'Reasoning', 'Example', 'Evidence', 'Facts']
      : [
          'Reciprocity',
          'Liking',
          'Social Proof',
          'Consistency',
          'Authority',
          'Scarcity',
        ];

    const chosenStrategy =
      strategies[userSession.strategyIndexChosen % strategies.length];
    console.log(`Chosen strategy for session ${sessionID}: ${chosenStrategy}`);
    return chosenStrategy;
  }

  async updateStrategyWeights(sessionID: string, successful: boolean) {
    const userSession = this.users[sessionID];
    const isCentralRoute = userSession.y_c > 0.5;
    const strategyWeights = isCentralRoute
      ? userSession.strategyWeights.central
      : userSession.strategyWeights.peripheral;

    const index = userSession.strategyIndexChosen % strategyWeights.length;
    const oldWeight = strategyWeights[index];
    strategyWeights[index] = successful
      ? strategyWeights[index] + 0.15 * (1 - strategyWeights[index])
      : strategyWeights[index] * 0.85;

    console.log(
      `Updated strategy weight for index ${index} from ${oldWeight} to ${strategyWeights[index]}`,
    );

    // Adjust route activation values
    if (successful) {
      userSession.y_c += 0.3;
      userSession.y_p -= 0.3;
    } else {
      userSession.y_c -= 0.2;
      userSession.y_p += 0.2;
    }

    console.log(
      `Updated route activation values: y_c = ${userSession.y_c}, y_p = ${userSession.y_p}`,
    );

    // Update session data in Supabase
    try {
      await this.supabaseService.updateSessionData(sessionID, {
        y_c: userSession.y_c,
        y_p: userSession.y_p,
        strategy_weights: userSession.strategyWeights,
        selected_strategies: userSession.selectedStrategies,
        strategy_index_chosen: userSession.strategyIndexChosen,
        persuasion_attempt: userSession.persuasionAttempt,
        current_exercise: userSession.current_exercise,
        failed_persuasion_count: userSession.failedPersuasionCount,
      });
    } catch (error) {
      console.error('Error updating session in Supabase:', error);
    }
  }

  incrementFailedPersuasionCount(sessionID: string) {
    const userSession = this.users[sessionID];
    userSession.failedPersuasionCount++;
    userSession.persuasionAttempt++;

    console.log(
      `Incremented failed persuasion count: ${userSession.failedPersuasionCount}`,
    );
    console.log(
      `Incremented persuasion attempt count: ${userSession.persuasionAttempt}`,
    );

    // Update the session data in Supabase
    this.supabaseService.updateSessionData(sessionID, {
      failed_persuasion_count: userSession.failedPersuasionCount,
      persuasion_attempt: userSession.persuasionAttempt,
    });
  }
}
