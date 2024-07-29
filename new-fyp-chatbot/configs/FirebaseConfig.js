// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyAt4tZldEkckofguV4PD-74BdvYGsG9U1E',
  authDomain: 'new-fyp-chatbot-233d5.firebaseapp.com',
  projectId: 'new-fyp-chatbot-233d5',
  storageBucket: 'new-fyp-chatbot-233d5.appspot.com',
  messagingSenderId: '256328138389',
  appId: '1:256328138389:web:d4fd54b6e7640118a5659c',
};

const app = initializeApp(firebaseConfig);

const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export { auth };
