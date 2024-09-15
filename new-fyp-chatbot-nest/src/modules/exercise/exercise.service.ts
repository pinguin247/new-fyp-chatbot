import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class ExerciseService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async getRandomExercise() {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('exercises')
      .select('*'); // Fetch all exercises

    if (error) {
      console.error('Error fetching exercises:', error.message);
      throw new Error(`Error fetching exercises: ${error.message}`);
    }

    if (data && data.length > 0) {
      // Randomly select one exercise
      const randomIndex = Math.floor(Math.random() * data.length);
      return data[randomIndex];
    }

    throw new Error('No exercises found');
  }
}
