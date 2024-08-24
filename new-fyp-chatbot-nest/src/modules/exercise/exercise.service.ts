// src/modules/exercise/exercise.service.ts
import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class ExerciseService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async getRandomExercise() {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('exercises')
      .select('*')
      .order('id', { ascending: false }) // Specify any column; this is required by Supabase, but we'll randomize with below.
      .limit(1)
      .single(); // Fetch a single exercise

    // Supabase does not directly support random ordering in .order().
    // To handle randomization, use JavaScript to shuffle or a different SQL approach.

    if (error) {
      console.error('Error fetching exercise:', error.message);
      throw new Error(`Error fetching exercise: ${error.message}`);
    }

    // Optionally shuffle the data in-memory if Supabase doesn't support `RANDOM()` directly.
    if (data && data.length > 0) {
      const randomIndex = Math.floor(Math.random() * data.length);
      return data[randomIndex];
    }

    return data; // Return the fetched exercise if no error.
  }
}
