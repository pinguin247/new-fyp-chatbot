import React from 'react';
import { View, Text } from 'react-native';
import styles from '../constants/styles'; // Make sure to adjust the path as necessary.

const HeaderTitle: React.FC = () => {
  return (
    <View style={styles.title}>
      <Text style={styles.bigTitle}>Hi, Jane</Text>
      <Text style={styles.smallTitle}>Aug 12, 2021</Text>
    </View>
  );
};

export default HeaderTitle;
