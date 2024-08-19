import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_API_KEY;

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async insertParsedRecords(records: any[]): Promise<any[]> {
    const { data, error } = await this.supabase.from('tracker').insert(records);

    if (error) {
      throw new Error(`Failed to insert records: ${error.message}`);
    }

    return data;
  }

  async getAllUsers(): Promise<any[]> {
    const { data, error } = await this.supabase.from('users').select('*');

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async insertUserData(user: {
    id: string;
    email: string;
    display_name: string;
  }): Promise<any> {
    const { data, error } = await this.supabase.from('users').insert(user);

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  // Add more methods for other CRUD operations as needed
}
