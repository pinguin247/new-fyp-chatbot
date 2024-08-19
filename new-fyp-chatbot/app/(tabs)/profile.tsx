import { View, Text, Button, StyleSheet, ToastAndroid } from 'react-native';
import React from 'react';
import { router } from 'expo-router';
import { supabase } from '../../configs/SupabaseConfig';

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
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      console.log('User signed out successfully');
    } catch (error: any) {
      console.error('Error signing out: ', error.message);
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
