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

  // Fetch session data by userId
  async fetchSessionDataByUserId(userId: string) {
    try {
      const { data, error } = await this.supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', userId)
        .limit(1); // Fetch only one session, even if multiple exist

      if (error) {
        console.error(
          `Error fetching session data by user_id: ${error.message}`,
        );
        return null; // Gracefully return null if there's an error
      }

      if (!data || data.length === 0) {
        return null; // Return null if no session data is found
      }

      return data[0]; // Return the first session if multiple are found
    } catch (err) {
      console.error('Fetch session data by user_id failed:', err.message);
      throw err;
    }
  }

  async updateSessionData(userId: string, sessionData: any) {
    try {
      console.log(
        `Updating session for userId: ${userId} with data:`,
        sessionData,
      );

      const { error } = await this.supabase
        .from('user_sessions')
        .update(sessionData)
        .eq('user_id', userId); // Correctly filter by 'user_id'

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

  async fetchExamplesByStrategy(strategyName: string): Promise<string[]> {
    try {
      const { data, error } = await this.supabase
        .from('strategies')
        .select('example')
        .eq('strategy_name', strategyName);

      if (error) {
        throw new Error(
          `Error fetching examples for strategy: ${error.message}`,
        );
      }

      return data.map((item) => item.example); // Return all examples as an array
    } catch (error) {
      console.error('Error fetching strategy examples:', error.message);
      return [];
    }
  }

  // Fetch patient input by patient_id
  async fetchUserInputsByPatientId(patientId: string) {
    try {
      const { data, error } = await this.supabase
        .from('patient_inputs')
        .select('*')
        .eq('patient_id', patientId)
        .single();

      if (error) {
        throw new Error(`Error fetching patient inputs: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error fetching patient inputs:', error.message);
      throw error;
    }
  }

  async addNewPatient(doctorInputData: any) {
    try {
      // Insert into doctor_inputs table
      const { error: insertError } = await this.supabase
        .from('doctor_inputs')
        .insert([doctorInputData]);

      if (insertError) {
        throw new Error(
          `Error inserting into doctor_inputs: ${insertError.message}`,
        );
      }

      return { success: true, message: 'Patient added successfully' };
    } catch (error) {
      throw new Error(`Failed to add new patient: ${error.message}`);
    }
  }

  async getPatientNames() {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'patient'); // Filter by patients only

      if (error) {
        throw new Error(`Error fetching patient names: ${error.message}`);
      }

      return data; // Return the array of patients
    } catch (error) {
      console.error('Error fetching patient names:', error.message);
      throw error;
    }
  }
}
