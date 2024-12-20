import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler'; // Add this import
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { NotifierWrapper } from 'react-native-notifier';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Outfit-Regular': require('./../assets/fonts/Outfit-Regular.ttf'),
    'Outfit-Medium': require('./../assets/fonts/Outfit-Medium.ttf'),
    'Outfit-Bold': require('./../assets/fonts/Outfit-Bold.ttf'),
  });

  useEffect(() => {
    async function prepare() {
      if (fontsLoaded) {
        await SplashScreen.hideAsync();
      }
    }
    prepare();
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null; // Render null until fonts are loaded
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NotifierWrapper>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="(tabs)" />
        </Stack>
      </NotifierWrapper>
    </GestureHandlerRootView>
  );
}
