// components/SignOutButton.tsx

import React from 'react';
import { Button, StyleSheet, View } from 'react-native';
import { useLogin } from '../app/context/LoginContext';
import auth from '@react-native-firebase/auth';

const SignOutButton: React.FC = () => {
  const { logout } = useLogin();

  const handleSignOut = async () => {
    try {
      await auth().signOut();
      logout();
      console.log('User signed out!');
    } catch (error) {
      console.error('Sign-out error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Button title="Sign Out" onPress={handleSignOut} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 16,
  },
});

export default SignOutButton;
