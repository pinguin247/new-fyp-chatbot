import React, { useState, useEffect, useCallback } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  ScrollView,
  Platform,
  StatusBar,
} from 'react-native';
import CalendarPicker from 'react-native-calendar-picker';
import { Colors } from '@/constants/Colors';
import { supabase } from '../../lib/supabase';
import { fetchUserProfile } from '../../lib/fetchUserProfile';
import { DateTime } from 'luxon';

interface ScheduleItem {
  id: string;
  exercise_name: string;
  exercise_date: string;
  start_time: string;
  end_time: string;
  duration: number;
}

interface AgendaItems {
  [key: string]: ScheduleItem[];
}

// Format time to 12-hour format with AM/PM
const formatTimeTo12Hour = (time: string) => {
  return DateTime.fromISO(time).toLocaleString(DateTime.TIME_SIMPLE); // e.g., 1:30 PM
};

const ScheduleItemComponent = React.memo(({ item }: { item: ScheduleItem }) => (
  <View style={styles.item}>
    <Text style={styles.itemText}>{item.exercise_name}</Text>
    <Text style={styles.itemText}>
      {formatTimeTo12Hour(item.start_time)} -{' '}
      {formatTimeTo12Hour(item.end_time)} ({item.duration} mins)
    </Text>
  </View>
));

ScheduleItemComponent.displayName = 'ScheduleItemComponent';

export default function Schedule() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [items, setItems] = useState<AgendaItems>({});
  const [profileId, setProfileId] = useState<string | null>(null);
  const [eventDates, setEventDates] = useState<any[]>([]);

  // Fetch user profile and get profileId
  useEffect(() => {
    const fetchProfileData = async () => {
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError) {
        console.error('Error fetching session:', sessionError);
        return;
      }

      if (sessionData?.session) {
        const userId = sessionData.session.user.id;
        const profile = await fetchUserProfile(userId);

        if (profile) {
          setProfileId(profile.id);
        }
      }
    };

    fetchProfileData();
  }, []);

  // Fetch and set the exercises for the current user
  useEffect(() => {
    const fetchExerciseAllocations = async () => {
      if (profileId) {
        const { data, error } = await supabase
          .from('exercise_allocations')
          .select('*')
          .eq('profile_id', profileId);

        if (error) {
          console.error('Error fetching exercise allocations:', error);
          return;
        }

        if (data) {
          const groupedItems: AgendaItems = {};
          const eventDays: any[] = [];

          data.forEach((exercise: ScheduleItem) => {
            const dateKey = exercise.exercise_date;
            if (!groupedItems[dateKey]) {
              groupedItems[dateKey] = [];
            }
            groupedItems[dateKey].push({
              id: exercise.id,
              exercise_name: exercise.exercise_name,
              exercise_date: exercise.exercise_date,
              start_time: exercise.start_time,
              end_time: exercise.end_time,
              duration: exercise.duration,
            });

            // Add the date to eventDays for custom styling
            eventDays.push(DateTime.fromISO(exercise.exercise_date).toJSDate());
          });

          setItems(groupedItems); // Set the exercises into state
          setEventDates(eventDays); // Set the event dates for the calendar
        }
      }
    };

    fetchExerciseAllocations();
  }, [profileId]);

  const onDateChange = useCallback((date: Date) => {
    setSelectedDate(date);
  }, []);

  const renderScheduleItems = useCallback(() => {
    const dateString = selectedDate.toISOString().split('T')[0];
    const dayItems = items[dateString];

    if (!dayItems || dayItems.length === 0) {
      return <Text style={styles.noItemsText}>No events for this day</Text>;
    }

    return dayItems.map((item) => (
      <ScheduleItemComponent key={item.id} item={item} />
    ));
  }, [selectedDate, items]);

  // Define custom styles for event dates
  const customDatesStyles = eventDates.map((date) => ({
    date: date,
    style: {
      backgroundColor: '#CBC3E3', // Highlight background color for event dates
    },
    textStyle: {
      color: '#000000', // Text color for event dates
    },
  }));

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.headerText}>My Schedule</Text>
        <CalendarPicker
          onDateChange={onDateChange}
          selectedStartDate={selectedDate as any}
          selectedDayColor={Colors.NAVY}
          selectedDayTextColor="#FFFFFF"
          todayBackgroundColor="#21355866"
          textStyle={styles.calendarText}
          customDatesStyles={customDatesStyles} // Apply custom date styles for event dates
        />
        <ScrollView style={styles.scheduleList}>
          {renderScheduleItems()}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    paddingTop: 20,
    paddingHorizontal: 10,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    padding: 10,
    textAlign: 'center',
    marginBottom: 10,
  },
  calendarText: {
    fontSize: 15,
    color: '#000000',
  },
  item: {
    backgroundColor: 'lightblue',
    borderRadius: 5,
    padding: 10,
    marginVertical: 5,
    marginHorizontal: 10,
  },
  itemText: {
    color: 'black',
    fontSize: 16,
  },
  scheduleList: {
    flex: 1,
    marginTop: 20,
  },
  noItemsText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: 'gray',
  },
});
