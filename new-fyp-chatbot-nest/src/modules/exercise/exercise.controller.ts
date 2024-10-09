import { Controller, Get, Query } from '@nestjs/common';
import { ExerciseService } from './exercise.service';
import { ExerciseSummaryService } from './exercise_summary.service';

@Controller('exercise')
export class ExerciseController {
  constructor(
    private readonly exerciseService: ExerciseService,
    private readonly exerciseSummaryService: ExerciseSummaryService,
  ) {}

  @Get('random')
  async getRandomExercise() {
    return this.exerciseService.getRandomExercise();
  }

  @Get()
  async getWeeklyReport(
    @Query('profileId') profileId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<string> {
    const report = await this.exerciseSummaryService.getWeeklyReport(
      profileId,
      startDate,
      endDate,
    );

    // Check if there are any exercise records
    if (report.exerciseCount === 0 && report.totalExerciseDuration === 0) {
      return ''; // Return an empty string if no records found
    }

    // If records are found, return the formatted report
    return `
Here is your Weekly Exercise Report: From ${startDate} to ${endDate}

Total Exercise Duration: ${report.totalExerciseDuration} minutes
Average Heart Rate: ${report.avgHeartRate.toFixed(1)} bpm
Number of Exercise Sessions: ${report.exerciseCount}
Total Time in Moderate Intensity: ${report.totalModerateIntensity.toFixed(1)} minutes
Total Time in Vigorous Intensity: ${report.totalVigorousIntensity.toFixed(1)} minutes

Keep up the good work!
    `.trim();
  }
}
