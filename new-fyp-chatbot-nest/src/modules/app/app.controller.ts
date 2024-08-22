import { Controller } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Controller('api/data')
export class AppController {
  constructor(private readonly supabaseService: SupabaseService) {}
}
