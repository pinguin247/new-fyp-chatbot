import React from 'react';
import { Text } from 'react-native';

const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Text
    style={{ fontFamily: 'Poppins-Medium', fontSize: 20, marginVertical: 10 }}
  >
    {children}
  </Text>
);

export default Label;
