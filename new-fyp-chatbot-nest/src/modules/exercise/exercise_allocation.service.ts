import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { UserAvailabilityService } from '../userAvailability/user_availability.service';
import { DateTime } from 'luxon';

@Injectable()
export class ExerciseAllocationService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly userAvailabilityService: UserAvailabilityService, // Inject UserAvailabilityService
  ) {}

  // Function to calculate the duration between start and end times
  calculateDuration(startTime: string, endTime: string): number {
    const start = DateTime.fromISO(startTime);
    const end = DateTime.fromISO(endTime);
    const durationInMinutes = end.diff(start, 'minutes').minutes;
    return Math.max(durationInMinutes, 0); // Ensure non-negative duration
  }

  // Function to allocate exercise to the earliest available slot, only up until Sunday
  async allocateExerciseSlot(
    userId: string,
    exerciseName: string,
    requestedDuration: number,
  ) {
    const today = DateTime.now();
    const currentDayIndex = today.weekday; // 1 = Monday, 7 = Sunday (luxon uses 1-7 for weekdays)
    const userAvailability =
      await this.userAvailabilityService.getUserAvailability(userId); // Fetch user availability

    // Step 1: Fetch user bookings for the current week (from today up to Sunday)
    const startOfWeek = today.startOf('week');
    const endOfWeek = today.endOf('week'); // End of Sunday

    const existingBookings = await this.supabaseService.fetchUserBookingsInWeek(
      userId,
      startOfWeek.toISODate(),
      endOfWeek.toISODate(),
    );

    // Step 2: Loop through the availability starting from the current day and only up to Sunday
    for (let dayOffset = 0; dayOffset <= 7 - currentDayIndex; dayOffset++) {
      const currentDay = today.plus({ days: dayOffset });
      const dayOfWeek = currentDay.weekdayLong; // Get the day of the week (e.g., 'Monday', 'Tuesday')

      // Step 3: Check if the user already has an exercise booked on this day
      const hasExistingBookingForDay = existingBookings.some((booking) =>
        DateTime.fromISO(booking.exercise_date).hasSame(currentDay, 'day'),
      );

      if (hasExistingBookingForDay) {
        console.log(
          `User already has an exercise booked on ${dayOfWeek}. Skipping to the next day.`,
        );
        continue; // Skip to the next day
      }

      // Find available slots for the current day
      const availableSlots = userAvailability.filter(
        (availability) => availability.day_of_week === dayOfWeek,
      );

      for (const slot of availableSlots) {
        // Step 4: Allocate the exercise if there is no booking for this day
        await this.supabaseService.allocateExercise({
          profile_id: userId, // Correct profile_id from userId
          exercise_name: exerciseName, // The name of the exercise
          exercise_date: currentDay.toISODate(), // Date of the exercise
          start_time: slot.start_time, // Start time
          end_time: DateTime.fromISO(slot.start_time)
            .plus({ minutes: requestedDuration })
            .toISOTime(), // End time calculated by adding the requested duration
          duration: requestedDuration, // Duration of the exercise
        });

        return {
          success: true,
          message: `Exercise allocated on ${dayOfWeek} at ${slot.start_time}`,
        };
      }
    }

    // Step 5: Return failure if no slots are available
    return {
      success: false,
      message: 'No available slots found for the week.',
    };
  }
}
