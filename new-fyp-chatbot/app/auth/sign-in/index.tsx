import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ToastAndroid,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import { useNavigation, Link, router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import Icon from 'react-native-vector-icons/Ionicons';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { supabase } from '../../../lib/supabase';
import {
  requestUserPermission,
  getFCMToken,
  sendTokenToBackend,
  setupFCMListeners,
} from '../../../lib/fcmService';

export default function SignIn() {
  const navigation = useNavigation();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  GoogleSignin.configure({
    webClientId:
      '256328138389-k6qq5pjcrapmm5u0smkr0gf1tllvuemq.apps.googleusercontent.com',
  });

  async function onGoogleButtonPress() {
    try {
      // Ensure the account chooser appears
      await GoogleSignin.signOut();

      // Check if your device supports Google Play
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });

      const userInfo = await GoogleSignin.signIn();
      if (userInfo.idToken) {
        // Attempt to sign in with Google ID token
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: userInfo.idToken,
        });

        if (error) {
          if (error.message.includes('already registered')) {
            // If user is already registered, log them in
            const { data: signInData, error: signInError } =
              await supabase.auth.signInWithIdToken({
                provider: 'google',
                token: userInfo.idToken,
              });

            if (signInError) {
              console.error(signInError);
              ToastAndroid.show(
                'Failed to sign in with Google',
                ToastAndroid.LONG,
              );
            } else {
              console.log('User logged in:', signInData);
              await setupFCMForUser(signInData.user.id);
              router.replace('/home'); // Navigate to home
            }
          } else {
            console.error(error);
            ToastAndroid.show('Google Sign-In failed', ToastAndroid.LONG);
          }
        } else {
          // New user or existing user successfully signed in
          console.log('User signed in or up:', data);
          await setupFCMForUser(data.user.id);
          router.replace('/home'); // Navigate to home
        }
      } else {
        throw new Error('No ID token present!');
      }
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.error(error);
        ToastAndroid.show('Google Sign-In cancelled', ToastAndroid.LONG);
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.error(error);
        ToastAndroid.show('Google Sign-In in progress', ToastAndroid.LONG);
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        console.error(error);
        ToastAndroid.show(
          'Google Play services not available',
          ToastAndroid.LONG,
        );
      } else {
        console.error(error);
        ToastAndroid.show('Google Sign-In failed', ToastAndroid.LONG);
      }
    }
  }

  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  async function setupFCMForUser(userId: string) {
    try {
      const hasPermission = await requestUserPermission();
      if (hasPermission) {
        const fcmToken = await getFCMToken();
        if (fcmToken) {
          await sendTokenToBackend(userId, fcmToken);
        }
        setupFCMListeners();
      } else {
        console.log('Failed to get notification permission');
      }
    } catch (error) {
      console.error('Error setting up FCM:', error);
      ToastAndroid.show('Failed to set up notifications', ToastAndroid.SHORT);
      // Optionally, you can add more specific error handling here
    }
  }

  const onSignIn = async () => {
    if (email === '' || password === '') {
      console.log('Input fields cannot be empty');
      ToastAndroid.show('Please enter all details', ToastAndroid.BOTTOM);
      return;
    }
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        console.log(data.user);
        await setupFCMForUser(data.user.id);
        router.replace('/home');
      }
    } catch (error) {
      console.error(error);
      ToastAndroid.show('Invalid Credentials', ToastAndroid.LONG);
    }
  };

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Icon name="arrow-back" size={24} color={Colors.NAVY} />
      </TouchableOpacity>
      <View style={styles.subcontainer}>
        <Text style={styles.title}>Welcome Back!</Text>
        <Text style={styles.subtitle}>Please enter your account here</Text>
      </View>
      <View style={styles.inputContainer}>
        <Icon
          name="mail-outline"
          size={20}
          color={Colors.GRAY}
          style={styles.inputIcon}
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={Colors.GRAY}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
      </View>
      <View style={styles.inputContainer}>
        <Icon
          name="lock-closed-outline"
          size={20}
          color={Colors.GRAY}
          style={styles.inputIcon}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={Colors.GRAY}
          secureTextEntry={!passwordVisible}
          value={password}
          onChangeText={setPassword}
          autoCapitalize="none"
        />
        <TouchableOpacity
          onPress={togglePasswordVisibility}
          style={styles.icon}
        >
          <Icon
            name={passwordVisible ? 'eye-off' : 'eye'}
            size={20}
            color={Colors.GRAY}
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.loginButton} onPress={onSignIn}>
        <Text style={styles.loginButtonText}>LOGIN</Text>
      </TouchableOpacity>

      <View style={styles.separatorContainer}>
        <View style={styles.separatorLine} />
        <Text style={styles.separatorText}>Or continue with</Text>
        <View style={styles.separatorLine} />
      </View>

      <TouchableOpacity
        style={styles.googleButton}
        onPress={onGoogleButtonPress}
      >
        <Image
          source={require('../../../assets/images/google.png')}
          style={styles.googleLogo}
        />
        <Text style={styles.googleButtonText}>Google</Text>
      </TouchableOpacity>

      <View style={styles.registerContainer}>
        <Text style={styles.registerText}>Don't have an account? </Text>
        <Link href="/auth/sign-up" style={styles.registerLink}>
          Register
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 25,
    backgroundColor: Colors.WHITE,
  },
  backButton: {
    position: 'absolute',
    top: 70, // Adjust based on your app's header height
    left: 20,
  },
  subcontainer: {
    marginTop: '40%',
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Outfit-Bold',
    textAlign: 'center',
    color: Colors.PRIMARY,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Outfit',
    color: Colors.GRAY,
    marginTop: 10,
    textAlign: 'center',
  },
  inputContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.LIGHTGRAY,
    borderRadius: 15,
    paddingHorizontal: 15,
    marginTop: 20,
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    color: Colors.PRIMARY,
    fontFamily: 'Outfit',
    marginLeft: 10,
  },
  inputIcon: {
    marginRight: 10,
  },
  icon: {
    marginLeft: 10,
  },
  loginButton: {
    width: '100%',
    borderRadius: 10,
    backgroundColor: Colors.NAVY,
    padding: 15,
    marginTop: 50,
    alignItems: 'center',
  },
  loginButtonText: {
    textAlign: 'center',
    fontFamily: 'Outfit',
    color: Colors.WHITE,
  },
  separatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    width: '100%',
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.GRAY,
  },
  separatorText: {
    fontSize: 14,
    fontFamily: 'Outfit',
    color: Colors.GRAY,
    marginHorizontal: 10,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    borderRadius: 10,
    backgroundColor: Colors.WHITE,
    padding: 5,
    borderWidth: 1,
    borderColor: Colors.GRAY,
    marginTop: 20,
  },
  googleLogo: {
    width: 40,
    height: 40,
    marginRight: 10,
    resizeMode: 'contain',
  },
  googleButtonText: {
    fontFamily: 'Outfit',
    color: Colors.PRIMARY,
    fontSize: 16,
  },
  registerContainer: {
    flexDirection: 'row',
    marginTop: 20,
  },
  registerText: {
    fontSize: 14,
    fontFamily: 'Outfit',
    color: Colors.GRAY,
  },
  registerLink: {
    fontSize: 14,
    fontFamily: 'Outfit',
    color: Colors.NAVY,
    textDecorationLine: 'underline',
  },
});
