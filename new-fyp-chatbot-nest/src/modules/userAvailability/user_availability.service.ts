import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class UserAvailabilityService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async getUserAvailability(profileId: string) {
    try {
      const { data, error } = await this.supabaseService
        .getClient()
        .from('user_availability')
        .select('*')
        .eq('profile_id', profileId);

      if (error) {
        throw new Error(`Error fetching user availability: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error(error);
      throw new Error('Failed to get user availability.');
    }
  }
}
