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
}
