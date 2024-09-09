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

  async checkExistingSession(userId: string): Promise<boolean> {
    try {
      const session = await this.loadSessionFromSupabase(userId);
      if (session) {
        console.log(`Session found for user: ${userId}`);
        return true;
      }
      console.log(`No session found for user: ${userId}`);
      return false;
    } catch (error) {
      console.error('Error checking session from Supabase:', error);
      return false;
    }
  }

  async createNewSession(userId: string, exercise: string) {
    this.users[userId] = {
      sessionID: userId,
      y_c: 0,
      y_p: 1,
      strategyWeights: {
        central: Array(5).fill(0.2), // Simpler way to initialize identical values
        peripheral: Array(6).fill(0.167),
      },
      selectedStrategies: {
        central: Array(5).fill(1),
        peripheral: Array(6).fill(1),
      },
      strategyIndexChosen: 0,
      persuasionAttempt: 0,
      current_exercise: exercise,
      failedPersuasionCount: 0,
    };

    console.log(`Created new session for userId: ${userId}`);

    try {
      await this.supabaseService.insertSessionData({
        user_id: userId,
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
    if (this.users[userId]) return this.users[userId]; // Return from cache if available

    try {
      const data = await this.supabaseService.fetchSessionDataByUserId(userId);

      if (data) {
        this.users[userId] = {
          sessionID: data.user_id,
          y_c: data.y_c,
          y_p: data.y_p,
          strategyWeights: data.strategy_weights,
          selectedStrategies: data.selected_strategies,
          strategyIndexChosen: data.strategy_index_chosen || 0,
          persuasionAttempt: data.persuasion_attempt || 0,
          current_exercise: data.current_exercise || '',
          failedPersuasionCount: data.failed_persuasion_count || 0,
        };
        console.log(`Loaded session for userId: ${userId}`);
        return this.users[userId];
      }
      return null;
    } catch (error) {
      console.error('Error loading session from Supabase:', error);
      return null;
    }
  }

  async updateCurrentExercise(userId: string, newExercise: string) {
    let userSession = this.getSession(userId);

    // If session does not exist in memory, load it from Supabase
    if (!userSession) {
      console.log(
        `Session not found in memory for user: ${userId}, fetching from Supabase...`,
      );
      userSession = await this.loadSessionFromSupabase(userId);

      if (!userSession) {
        console.error(
          'No session found to update exercise, neither in memory nor in Supabase',
        );
        return;
      }
    }

    // Update current exercise and reset failed persuasion count
    userSession.current_exercise = newExercise;
    userSession.failedPersuasionCount = 0;

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

    // Update motivation levels
    userSession.y_c = x_m;
    userSession.y_p = 1 - x_m;

    console.log(
      `Updated motivation values: y_c = ${userSession.y_c}, y_p = ${userSession.y_p}`,
    );

    const isCentralRoute = userSession.y_c > 0.5;
    const candidateStrategiesWeights = isCentralRoute
      ? userSession.strategyWeights.central
      : userSession.strategyWeights.peripheral;
    const candidateSelectedStrategies = isCentralRoute
      ? userSession.selectedStrategies.central
      : userSession.selectedStrategies.peripheral;

    // Calculate activation vectors
    const activationVectors: number[] = candidateStrategiesWeights.map(
      (weight, i) =>
        weight *
        Math.max(userSession.y_c, userSession.y_p) *
        candidateSelectedStrategies[i],
    );

    // Select strategy based on maximum activation vector
    const maxActivationVector = Math.max(...activationVectors);
    userSession.strategyIndexChosen =
      activationVectors.indexOf(maxActivationVector);

    console.log(
      `Chosen strategy index: ${userSession.strategyIndexChosen}, Max activation vector: ${maxActivationVector}`,
    );

    candidateSelectedStrategies[userSession.strategyIndexChosen] = 0; // Update eligibility
    if (!isCentralRoute) userSession.strategyIndexChosen += 5;

    return isCentralRoute ? 'central' : 'peripheral';
  }

  getCurrentStrategy(sessionID: string): string {
    const userSession = this.users[sessionID];
    const isCentralRoute = userSession.y_c > 0.5;

    const centralStrategies = [
      'Logic',
      'Reasoning',
      'Example',
      'Evidence',
      'Facts',
    ];
    const peripheralStrategies = [
      'Reciprocity',
      'Liking',
      'Social Proof',
      'Consistency',
      'Authority',
      'Scarcity',
    ];

    const strategies = isCentralRoute
      ? centralStrategies
      : peripheralStrategies;
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
