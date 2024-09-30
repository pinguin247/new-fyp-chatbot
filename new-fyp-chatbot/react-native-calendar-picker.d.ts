/* eslint-disable prettier/prettier */
import { ComponentType } from 'react';

declare module 'react-native-calendar-picker' {
  export interface CalendarPickerProps {
    onDateChange: (date: Date) => void;
    selectedStartDate?: Date;
    selectedDayColor?: string;
    selectedDayTextColor?: string;
    todayBackgroundColor?: string;
    textStyle?: {
      fontSize: number;
      color: string;
    };
    // Add other props as needed
  }

  const CalendarPicker: ComponentType<CalendarPickerProps>;
  export default CalendarPicker;
}
