// src/map.service.ts
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
  currentExercise: string; // Track the current exercise
  failedPersuasionCount: number; // Track the number of failed attempts for the current exercise
}

@Injectable()
export class MapService {
  private users: Record<string, UserSession> = {};

  constructor(private readonly supabaseService: SupabaseService) {}

  async createNewSession(sessionID: string) {
    this.users[sessionID] = {
      sessionID,
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
      currentExercise: '', // Initialize empty exercise
      failedPersuasionCount: 0, // Initialize failed attempts count
    };

    // Store session in Supabase
    try {
      await this.supabaseService.insertSessionData({
        session_id: sessionID,
        y_c: 0,
        y_p: 1,
        strategy_weights: this.users[sessionID].strategyWeights,
        selected_strategies: this.users[sessionID].selectedStrategies,
        strategy_index_chosen: 0,
        persuasion_attempt: 0,
        current_exercise: '',
        failed_persuasion_count: 0,
      });
    } catch (error) {
      console.error('Error creating session in Supabase:', error);
    }
  }

  getSession(sessionID: string): UserSession | null {
    return this.users[sessionID] || null;
  }

  async loadSessionFromSupabase(sessionID: string) {
    try {
      const data = await this.supabaseService.fetchSessionData(sessionID);

      if (data) {
        this.users[sessionID] = {
          sessionID: data.session_id,
          y_c: data.y_c,
          y_p: data.y_p,
          strategyWeights: data.strategy_weights,
          selectedStrategies: data.selected_strategies,
          strategyIndexChosen: data.strategy_index_chosen || 0,
          persuasionAttempt: data.persuasion_attempt || 0,
          currentExercise: data.current_exercise || '',
          failedPersuasionCount: data.failed_persuasion_count || 0,
        };
        return this.users[sessionID];
      }
      return null;
    } catch (error) {
      console.error('Error loading session from Supabase:', error);
      return null;
    }
  }

  decidePersuasionRoute(
    sessionID: string,
    userResponse: string,
  ): 'central' | 'peripheral' {
    const userSession = this.users[sessionID];

    // Check initial motivation level from userResponse
    if (userResponse.toLowerCase().includes('no')) {
      userSession.y_c = 0; // Low motivation
      userSession.y_p = 1;
    } else {
      userSession.y_c = 1; // High motivation
      userSession.y_p = 0;
    }

    // Select strategy based on current route
    const isCentralRoute = userSession.y_c > 0.5;
    const selectedStrategies = isCentralRoute
      ? userSession.selectedStrategies.central
      : userSession.selectedStrategies.peripheral;

    const strategyWeights = isCentralRoute
      ? userSession.strategyWeights.central
      : userSession.strategyWeights.peripheral;

    // Use randomness to diversify strategy selection
    const maxWeight = Math.max(...strategyWeights);
    const candidates = strategyWeights
      .map((weight, index) => (weight === maxWeight ? index : -1))
      .filter((index) => index !== -1);
    const randomIndex = Math.floor(Math.random() * candidates.length);
    userSession.strategyIndexChosen = candidates[randomIndex];

    // Update eligibility
    selectedStrategies[userSession.strategyIndexChosen] = 0;

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

    return strategies[userSession.strategyIndexChosen];
  }

  async updateStrategyWeights(sessionID: string, successful: boolean) {
    const userSession = this.users[sessionID];
    const isCentralRoute = userSession.y_c > 0.5;
    const strategyWeights = isCentralRoute
      ? userSession.strategyWeights.central
      : userSession.strategyWeights.peripheral;

    const index = userSession.strategyIndexChosen;
    strategyWeights[index] = successful
      ? strategyWeights[index] + 0.15 * (1 - strategyWeights[index])
      : strategyWeights[index] * 0.85;

    // Adjust route activation values
    if (successful) {
      userSession.y_c += 0.3;
      userSession.y_p -= 0.3;
    } else {
      userSession.y_c -= 0.2;
      userSession.y_p += 0.2;
    }

    // Update session data in Supabase
    try {
      await this.supabaseService.updateSessionData(sessionID, {
        y_c: userSession.y_c,
        y_p: userSession.y_p,
        strategy_weights: userSession.strategyWeights,
        selected_strategies: userSession.selectedStrategies,
        strategy_index_chosen: userSession.strategyIndexChosen,
        persuasion_attempt: userSession.persuasionAttempt,
        current_exercise: userSession.currentExercise,
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

    // Update the session data in Supabase
    this.supabaseService.updateSessionData(sessionID, {
      failed_persuasion_count: userSession.failedPersuasionCount,
      persuasion_attempt: userSession.persuasionAttempt,
    });
  }
}
