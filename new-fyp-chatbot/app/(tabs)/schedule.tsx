import React, { useState, useCallback, useEffect } from 'react';
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

interface ScheduleItem {
  id: string;
  name: string;
  description: string;
}

interface AgendaItems {
  [key: string]: ScheduleItem[];
}

const ScheduleItemComponent = React.memo(({ item }: { item: ScheduleItem }) => (
  <View style={styles.item}>
    <Text style={styles.itemText}>{item.name}</Text>
    <Text style={styles.itemText}>{item.description}</Text>
  </View>
));

ScheduleItemComponent.displayName = 'ScheduleItemComponent';

export default function Schedule() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date()); // Initialize with current date
  const [items] = useState<AgendaItems>({
    '2024-03-26': [
      { id: '1', name: 'Meeting 1', description: 'Description of Meeting 1' },
    ],
    '2024-03-28': [
      { id: '2', name: 'Meeting 2', description: 'Description of Meeting 2' },
    ],
    '2024-03-29': [
      { id: '3', name: 'Meeting 3', description: 'Description of Meeting 3' },
    ],
  });

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

  // // Effect to log the selected date (optional, for debugging)
  // useEffect(() => {
  //   console.log('Selected date:', selectedDate.toISOString().split('T')[0]);
  // }, [selectedDate]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.headerText}>My Schedule</Text>
        <CalendarPicker
          onDateChange={onDateChange}
          selectedStartDate={selectedDate as any}
          selectedDayColor="#7300e6"
          selectedDayTextColor="#FFFFFF"
          todayBackgroundColor="#f2e6ff"
          textStyle={styles.calendarText}
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
