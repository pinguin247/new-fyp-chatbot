import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_API_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL and API Key are required');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  getClient() {
    return this.supabase;
  }

  async getProfileIdByName(
    fullName: string,
  ): Promise<{ id: string | null; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('id')
        .eq('full_name', fullName)
        .eq('role', 'patient')
        .limit(2); // Fetch up to 2 rows

      if (error) {
        console.error('Error fetching profile ID:', error.message);
        return {
          id: null,
          error: 'An error occurred while fetching the profile ID',
        };
      }

      if (!data || data.length === 0) {
        // No matching patient
        return { id: null, error: 'No patient found with the given name' };
      }

      if (data.length > 1) {
        // Multiple matching patients
        return {
          id: null,
          error:
            'Multiple patients found with the given name. Please specify further.',
        };
      }

      return { id: data[0].id };
    } catch (error) {
      console.error('Error fetching profile ID:', error.message);
      return {
        id: null,
        error: 'An error occurred while fetching the profile ID',
      };
    }
  }

  async insertParsedRecords(records: any[]): Promise<any[]> {
    const { data, error } = await this.supabase.from('tracker').insert(records);

    if (error) {
      throw new Error(`Failed to insert records: ${error.message}`);
    }

    return data;
  }

  async insertChatHistory(
    userId: string,
    role: 'user' | 'system' | 'assistant',
    content: string,
  ) {
    try {
      // Check if the profile exists
      const { data: profile, error: profileError } = await this.supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();

      if (profileError || !profile) {
        throw new Error(`Profile with user ID ${userId} does not exist.`);
      }

      // Insert the chat history with the correct profile id
      const { error } = await this.supabase.from('chat_history').insert([
        {
          user_id: profile.id, // Assuming user_id is the foreign key in chat_history
          role: role,
          content: content,
          created_at: new Date(),
        },
      ]);

      if (error) {
        throw new Error(`Failed to insert chat history: ${error.message}`);
      }
    } catch (error) {
      console.error('Error inserting chat history:', error.message);
      throw error; // Re-throw the error to be caught in the controller
    }
  }

  async fetchChatHistory(userId: string): Promise<any[]> {
    try {
      // Check if the profile exists
      const { data: profile, error: profileError } = await this.supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();

      if (profileError || !profile) {
        throw new Error(`Profile with user ID ${userId} does not exist.`);
      }

      // Fetch chat history for the correct profile id
      const { data, error } = await this.supabase
        .from('chat_history')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: true });

      if (error) {
        throw new Error(`Failed to fetch chat history: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error fetching chat history:', error.message);
      throw error; // Re-throw the error to be caught in the controller
    }
  }

  async insertSessionData(sessionData: any) {
    try {
      const { data, error } = await this.supabase
        .from('user_sessions')
        .insert([sessionData]);

      if (error) {
        throw new Error(`Error inserting session data: ${error.message}`);
      }

      return data;
    } catch (err) {
      console.error('Insert session data failed:', err.message);
      throw err;
    }
  }

  async fetchSessionData(sessionId: string) {
    try {
      const { data, error } = await this.supabase
        .from('user_sessions')
        .select('*')
        .eq('session_id', sessionId)
        .single();

      if (error) {
        throw new Error(`Error fetching session data: ${error.message}`);
      }

      return data;
    } catch (err) {
      console.error('Fetch session data failed:', err.message);
      throw err;
    }
  }

  async updateSessionData(sessionId: string, sessionData: any) {
    try {
      console.log(
        `Updating session for sessionId: ${sessionId} with data:`,
        sessionData,
      );

      const { error } = await this.supabase
        .from('user_sessions')
        .update(sessionData)
        .eq('user_id', sessionId); // Assuming 'user_id' is used for filtering

      if (error) {
        console.error(`Error updating session in Supabase: ${error.message}`);
        return { success: false, message: error.message };
      }

      console.log('Session updated successfully in Supabase.');
      return { success: true };
    } catch (err) {
      console.error('Update session in Supabase failed:', err.message);
      throw err;
    }
  }

  async fetchRandomExercise() {
    try {
      const { data, error } = await this.supabase.from('exercises').select('*');

      if (error) {
        throw new Error(`Error fetching exercise: ${error.message}`);
      }

      if (!data || data.length === 0) {
        throw new Error('No exercises found.');
      }

      // Randomly select an exercise in JavaScript
      const randomIndex = Math.floor(Math.random() * data.length);
      return data[randomIndex];
    } catch (error) {
      console.error('Fetch random exercise failed:', error.message);
      throw error;
    }
  }

  // Method to fetch an exercise by its ID
  async getExerciseById(exerciseId: string) {
    try {
      if (!exerciseId) {
        throw new Error('Exercise ID is undefined');
      }

      console.log('Fetching exercise with ID:', exerciseId); // Log the exerciseId for debugging

      const { data, error } = await this.supabase
        .from('exercises')
        .select('*')
        .eq('id', exerciseId)
        .single();

      if (error) {
        throw new Error(`Error fetching exercise by id: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Fetch exercise by id failed:', error.message);
      throw error;
    }
  }
}
