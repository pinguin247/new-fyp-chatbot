import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

export default function RootLayout() {
  //Fonts are defined here
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
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      {/* <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      /> */}
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
