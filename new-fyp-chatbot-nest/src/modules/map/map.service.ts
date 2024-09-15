import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

interface UserSession {
  sessionID?: string;
  user_id: string;
  y_c: number;
  y_p: number;
  strategyWeights: { central: number[]; peripheral: number[] };
  selectedStrategies: { central: number[]; peripheral: number[] };
  strategyIndexChosen: number;
  specificStrategyIndex: number;
  persuasionAttempt: number;
  current_exercise: string;
  failedPersuasionCount: number;
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
      user_id: userId,
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
      specificStrategyIndex: 0, // Initialize specificStrategyIndex
      persuasionAttempt: 0,
      current_exercise: exercise,
      failedPersuasionCount: 0,
    };

    try {
      await this.supabaseService.insertSessionData({
        user_id: userId,
        y_c: 0,
        y_p: 1,
        strategy_weights: this.users[userId].strategyWeights,
        selected_strategies: this.users[userId].selectedStrategies,
        strategy_index_chosen: 0,
        specific_strategy_index: 0, // Add specificStrategyIndex to Supabase
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
    // Check if the session exists in the cache and has a session ID
    if (this.users[userId] && this.users[userId].sessionID) {
      console.log(`Session for userId ${userId} found in cache.`);
      return this.users[userId]; // Return from cache if available and sessionID exists
    }

    try {
      const data = await this.supabaseService.fetchSessionDataByUserId(userId);

      if (data) {
        this.users[userId] = {
          sessionID: data.session_id,
          user_id: data.user_id,
          y_c: data.y_c,
          y_p: data.y_p,
          strategyWeights: data.strategy_weights,
          selectedStrategies: data.selected_strategies,
          strategyIndexChosen: data.strategy_index_chosen || 0,
          specificStrategyIndex: data.specific_strategy_index || 0, // Load specificStrategyIndex
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
    userId: string,
    x_m: number,
  ): 'central' | 'peripheral' {
    const userSession = this.users[userId];

    console.log(`\n--- Deciding Persuasion Route ---`);
    console.log(`User ID: ${userId}`);
    console.log(`Initial motivation (x_m): ${x_m}`);
    console.log(`Persuasion Attempt: ${userSession.persuasionAttempt}`);

    // Only set y_c and y_p on the first attempt
    if (userSession.persuasionAttempt === 0) {
      console.log(`First attempt, setting initial y_c and y_p`);
      userSession.y_c = x_m;
      if (userSession.y_c < 0.5) {
        userSession.y_c = 0;
        userSession.y_p = 1;
      } else {
        userSession.y_c = 1;
        userSession.y_p = 0;
      }
    }

    console.log(
      `Current motivation values: y_c = ${userSession.y_c}, y_p = ${userSession.y_p}`,
    );

    const isCentralRoute = userSession.y_c >= 0.5;
    console.log(`Chosen route: ${isCentralRoute ? 'Central' : 'Peripheral'}`);

    const candidateStrategiesWeights = isCentralRoute
      ? userSession.strategyWeights.central
      : userSession.strategyWeights.peripheral;
    const candidateSelectedStrategies = isCentralRoute
      ? userSession.selectedStrategies.central
      : userSession.selectedStrategies.peripheral;

    console.log(
      `Candidate Strategy Weights: ${JSON.stringify(candidateStrategiesWeights)}`,
    );
    console.log(
      `Candidate Selected Strategies: ${JSON.stringify(candidateSelectedStrategies)}`,
    );

    // Calculate activation vectors
    const activationVectors: number[] = candidateStrategiesWeights.map(
      (weight, i) =>
        weight *
        Math.max(userSession.y_c, userSession.y_p) *
        candidateSelectedStrategies[i],
    );

    console.log(`Activation Vectors: ${JSON.stringify(activationVectors)}`);

    // Select strategy based on maximum activation vector
    const maxActivationVector = Math.max(...activationVectors);
    userSession.strategyIndexChosen =
      activationVectors.indexOf(maxActivationVector);

    console.log(`Chosen strategy index: ${userSession.strategyIndexChosen}`);
    console.log(`Max activation vector: ${maxActivationVector}`);

    candidateSelectedStrategies[userSession.strategyIndexChosen] = 0; // Update eligibility
    if (!isCentralRoute) userSession.strategyIndexChosen += 5;

    console.log(
      `Final strategy index chosen: ${userSession.strategyIndexChosen}`,
    );
    console.log(
      `Updated Selected Strategies: ${JSON.stringify(userSession.selectedStrategies)}`,
    );

    return isCentralRoute ? 'central' : 'peripheral';
  }

  getCurrentStrategy(userId: string): string {
    const userSession = this.users[userId];
    const isCentralRoute = userSession.y_c >= 0.5;

    console.log(`\n--- Getting Current Strategy ---`);
    console.log(`User ID: ${userId}`);
    console.log(`Current Route: ${isCentralRoute ? 'Central' : 'Peripheral'}`);

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
    const strategyIndex = isCentralRoute
      ? userSession.strategyIndexChosen
      : userSession.strategyIndexChosen - 5;

    console.log(`Strategy Index: ${strategyIndex}`);

    const chosenStrategy = strategies[strategyIndex];

    console.log(`Chosen strategy: ${chosenStrategy}`);

    // Alternate between specific sub-strategies using specificStrategyIndex
    userSession.specificStrategyIndex =
      (userSession.specificStrategyIndex + 1) % 2;
    console.log(
      `Updated specific strategy index: ${userSession.specificStrategyIndex}`,
    );

    return chosenStrategy;
  }

  async updateStrategyWeights(userId: string, successful: boolean) {
    const userSession = this.users[userId];
    const isCentralRoute = userSession.y_c >= 0.5;

    console.log(`\n--- Updating Strategy Weights ---`);
    console.log(`User ID: ${userId}`);
    console.log(`Persuasion Successful: ${successful}`);
    console.log(`Current Route: ${isCentralRoute ? 'Central' : 'Peripheral'}`);

    const strategyWeights = isCentralRoute
      ? userSession.strategyWeights.central
      : userSession.strategyWeights.peripheral;

    const index = isCentralRoute
      ? userSession.strategyIndexChosen
      : userSession.strategyIndexChosen - 5;

    console.log(`Updating weight for strategy index: ${index}`);
    console.log(`Current Strategy Weights: ${JSON.stringify(strategyWeights)}`);

    const oldWeight = strategyWeights[index];
    strategyWeights[index] =
      0.1 * (1 - strategyWeights[index]) * (successful ? 1 : 0) -
      0.9 * strategyWeights[index];

    console.log(
      `Updated strategy weight for index ${index}: ${oldWeight} -> ${strategyWeights[index]}`,
    );

    // Adjust route activation values
    console.log(
      `Before adjustment: y_c = ${userSession.y_c}, y_p = ${userSession.y_p}`,
    );

    if (isCentralRoute) {
      if (successful) {
        userSession.y_c += 0.2;
        userSession.y_p -= 0.2;
      } else {
        userSession.y_c -= 0.1;
        userSession.y_p += 0.1;
      }
    } else {
      if (successful) {
        userSession.y_c -= 0.2;
        userSession.y_p += 0.2;
      } else {
        userSession.y_c += 0.2;
        userSession.y_p -= 0.2;
      }
    }

    userSession.y_c = Math.max(0, Math.min(1, userSession.y_c));
    userSession.y_p = Math.max(0, Math.min(1, userSession.y_p));

    console.log(
      `After adjustment: y_c = ${userSession.y_c}, y_p = ${userSession.y_p}`,
    );

    // Update session data in Supabase
    try {
      await this.supabaseService.updateSessionData(userId, {
        y_c: userSession.y_c,
        y_p: userSession.y_p,
        strategy_weights: userSession.strategyWeights,
        selected_strategies: userSession.selectedStrategies,
        strategy_index_chosen: userSession.strategyIndexChosen,
        specific_strategy_index: userSession.specificStrategyIndex,
        persuasion_attempt: userSession.persuasionAttempt,
        current_exercise: userSession.current_exercise,
        failed_persuasion_count: userSession.failedPersuasionCount,
      });
      console.log(`Successfully updated session data in Supabase`);
    } catch (error) {
      console.error('Error updating session in Supabase:', error);
    }
  }

  async incrementFailedPersuasionCount(userId: string) {
    let userSession = this.getSession(userId);

    // If session does not exist in memory, load it from Supabase
    if (!userSession) {
      console.log(
        `Session not found in memory for user: ${userId}, fetching from Supabase...`,
      );
      userSession = await this.loadSessionFromSupabase(userId);

      if (!userSession) {
        console.error(
          'No session found to increment failed persuasion count, neither in memory nor in Supabase',
        );
        return;
      }
    }

    // Increment failed persuasion count and persuasion attempt
    userSession.failedPersuasionCount++;
    userSession.persuasionAttempt++;

    console.log(
      `Incremented failed persuasion count: ${userSession.failedPersuasionCount}`,
    );
    console.log(
      `Incremented persuasion attempt count: ${userSession.persuasionAttempt}`,
    );

    // Update the failed persuasion count and attempt in Supabase
    try {
      await this.supabaseService.updateSessionData(userId, {
        failed_persuasion_count: userSession.failedPersuasionCount,
        persuasion_attempt: userSession.persuasionAttempt,
      });
    } catch (error) {
      console.error(
        'Error updating failed persuasion count in Supabase:',
        error,
      );
    }
  }
}
