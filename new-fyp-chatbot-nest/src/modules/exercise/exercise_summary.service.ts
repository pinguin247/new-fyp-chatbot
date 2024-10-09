import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

interface WeeklyReport {
  totalExerciseDuration: number;
  avgHeartRate: number;
  exerciseCount: number;
  totalModerateIntensity: number;
  totalVigorousIntensity: number;
}

@Injectable()
export class ExerciseSummaryService {
  constructor(private supabaseService: SupabaseService) {}

  async getWeeklyReport(
    profileId: string,
    startOfWeek: string,
    endOfWeek: string,
  ): Promise<WeeklyReport> {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('tracker')
      .select('*')
      .eq('profileID', profileId)
      .gte('startDate', startOfWeek)
      .lte('startDate', endOfWeek);

    if (error) {
      throw new Error(`Error fetching exercise data: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return {
        totalExerciseDuration: 0,
        avgHeartRate: 0,
        exerciseCount: 0,
        totalModerateIntensity: 0,
        totalVigorousIntensity: 0,
      };
    }

    // Convert total duration from seconds to minutes
    const totalExerciseDuration =
      data.reduce((sum, session) => sum + (session.duration || 0), 0) / 60;
    const exerciseCount = data.length;
    // Keep moderate and vigorous intensity in minutes
    const totalModerateIntensity = data.reduce(
      (sum, session) => sum + (session.moderateIntensity || 0),
      0,
    );
    const totalVigorousIntensity = data.reduce(
      (sum, session) => sum + (session.vigorousIntensity || 0),
      0,
    );

    // Calculate average heart rate
    let totalHeartRateSum = 0;
    let totalHeartRateCount = 0;
    data.forEach((session) => {
      if (session.heartrate && Array.isArray(session.heartrate)) {
        session.heartrate.forEach((hr) => {
          if (hr.heartrate) {
            totalHeartRateSum += hr.heartrate;
            totalHeartRateCount++;
          }
        });
      }
    });
    const avgHeartRate =
      totalHeartRateCount > 0 ? totalHeartRateSum / totalHeartRateCount : 0;

    return {
      totalExerciseDuration: Math.round(totalExerciseDuration),
      avgHeartRate,
      exerciseCount,
      totalModerateIntensity,
      totalVigorousIntensity,
    };
  }
}
