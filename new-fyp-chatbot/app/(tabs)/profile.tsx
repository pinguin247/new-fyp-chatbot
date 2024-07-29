import { View, Text, Button, StyleSheet, ToastAndroid } from 'react-native';
import React from 'react';
import { router } from 'expo-router';
import { auth } from '../../configs/FirebaseConfig';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

export default function Profile() {
  const handleLogout = async () => {
    try {
      await logout();
      ToastAndroid.show('Logged out successfully', ToastAndroid.SHORT);
      // Navigate to login screen or handle post-logout behavior
      router.replace('/'); // Adjust the route as necessary
    } catch (error) {
      ToastAndroid.show('Error logging out', ToastAndroid.LONG);
    }
  };

  async function logout() {
    try {
      // Sign out from Firebase
      await auth.signOut();

      // Sign out from Google
      await GoogleSignin.signOut();

      console.log('User signed out successfully');
    } catch (error) {
      console.error('Error signing out: ', error);
    }
  }

  return (
    <View style={styles.container}>
      <Text>Profile</Text>
      <Button title="Logout" onPress={handleLogout} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
