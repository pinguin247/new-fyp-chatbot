import React from 'react';
import { View, Text } from 'react-native';
import styles from '../constants/styles'; // Make sure to adjust the path as necessary.

interface HeaderTitleProps {
  name: string;
}

const HeaderTitle: React.FC<HeaderTitleProps> = ({ name }) => {
  // Get the current date and format it as "MMM DD, YYYY"
  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <View style={styles.title}>
      <Text style={styles.bigTitle}>Hi, {name}</Text>
      <Text style={styles.smallTitle}>{formattedDate}</Text>
    </View>
  );
};

export default HeaderTitle;
