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

    const maxWeightIndex = strategyWeights.indexOf(
      Math.max(...strategyWeights),
    );
    userSession.strategyIndexChosen = maxWeightIndex;

    // Update eligibility
    selectedStrategies[maxWeightIndex] = 0;

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
      ? strategyWeights[index] + 0.1 * (1 - strategyWeights[index])
      : strategyWeights[index] * 0.9;

    // Adjust route activation values
    if (successful) {
      userSession.y_c += 0.2;
      userSession.y_p -= 0.2;
    } else {
      userSession.y_c -= 0.1;
      userSession.y_p += 0.1;
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
      });
    } catch (error) {
      console.error('Error updating session in Supabase:', error);
    }
  }
}
