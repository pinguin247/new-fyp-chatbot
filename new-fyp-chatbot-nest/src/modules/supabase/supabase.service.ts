import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient;

  private supabaseUrl = process.env.SUPABASE_URL;
  private supabaseKey = process.env.SUPABASE_API_KEY;

  constructor() {
    console.log(`Supabase URL: ${this.supabaseUrl}`);
    console.log(
      `Supabase Key: ${this.supabaseKey ? 'Key is set' : 'Key is missing'}`,
    );
    this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
  }

  async getAllUsers() {
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
  }) {
    const { data, error } = await this.supabase.from('users').insert(user);

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }
}
