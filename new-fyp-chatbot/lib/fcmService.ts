import messaging from '@react-native-firebase/messaging';
import { ToastAndroid } from 'react-native';
import { supabase } from '../lib/supabase'; // Adjust the import path as needed

export async function requestUserPermission() {
  const authStatus = await messaging().requestPermission();
  return (
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL
  );
}

export async function getFCMToken() {
  try {
    const token = await messaging().getToken();
    console.log('FCM Token:', token);
    return token;
  } catch (error) {
    console.error('Failed to get FCM token:', error);
    return null;
  }
}

export async function sendTokenToBackend(userId: string, token: string) {
  try {
    const { data, error } = await supabase
      .from('user_fcm_tokens')
      .upsert(
        { user_id: userId, fcm_token: token },
        { onConflict: 'user_id', ignoreDuplicates: false },
      );

    if (error) throw error;
    console.log('FCM token stored in backend');
  } catch (error) {
    console.error('Failed to send FCM token to backend:', error);
    throw error; // Rethrow the error so it can be handled by the caller
  }
}

export function setupFCMListeners() {
  messaging().onMessage(async (remoteMessage) => {
    console.log('Foreground message received:', remoteMessage);
    // Handle foreground notifications here
  });

  messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    console.log('Background message received:', remoteMessage);
    // Handle background notifications here
  });
}
