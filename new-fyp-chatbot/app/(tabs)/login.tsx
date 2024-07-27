// components/LoginScreen.tsx

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, TextInput, Button, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useLogin } from '../context/LoginContext';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import auth from '@react-native-firebase/auth';

export default function LoginScreen() {
  const { login } = useLogin();
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    // Add your login logic here
    // After successful login, update the login state
    login();
  };

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '256328138389-k6qq5pjcrapmm5u0smkr0gf1tllvuemq.apps.googleusercontent.com',
    });

    // Preload Google Play Services
    const preloadGooglePlayServices = async () => {
      try {
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      } catch (error) {
        console.error('Google Play Services are not available:', error);
      }
    };

    preloadGooglePlayServices();
  }, []);

  const onGoogleButtonPress = async () => {
    setLoading(true);
    try {
      // Get the user's ID token
      const { idToken } = await GoogleSignin.signIn();
      console.log(idToken);

      // Create a Google credential with the token
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);

      // Sign-in the user with the credential
      await auth().signInWithCredential(googleCredential);
      console.log('Signed in with Google!');
      login();
    } catch (error) {
      console.error('Google Sign-In error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Login</ThemedText>
      <TextInput style={styles.input} placeholder="Email" />
      <TextInput style={styles.input} placeholder="Password" secureTextEntry />
      <Button title="Login" onPress={handleLogin} />
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <Button title="Google Sign-In" onPress={onGoogleButtonPress} />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 8,
  },
});
