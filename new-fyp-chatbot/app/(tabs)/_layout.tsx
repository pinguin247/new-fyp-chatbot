import React from 'react';
import { Tabs } from 'expo-router';
import { Image, StyleSheet } from 'react-native';
import homeIcon from '../../assets/images/Home.png'; // Importing custom icons
import calendar from '../../assets/images/Calender.png';
import profile from '../../assets/images/User.png';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors } from '@/constants/Colors';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.NAVY,
        tabBarInactiveTintColor: '#aaa',
        tabBarStyle: styles.tabBarStyle, // Applying custom styles
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => (
            <Image
              source={homeIcon}
              style={[styles.icon, { tintColor: color }]}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="chatbot"
        options={{
          tabBarLabel: 'Chatbot',
          tabBarIcon: ({ color }) => (
            <Ionicons name="chatbox-ellipses-outline" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          tabBarLabel: 'Schedule',
          tabBarIcon: ({ color }) => (
            <Image
              source={calendar}
              style={[styles.icon, { tintColor: color }]}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color }) => (
            <Image
              source={profile}
              style={[styles.icon, { tintColor: color }]}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarStyle: {
    backgroundColor: '#EDEDED',
    paddingBottom: 10,
    paddingTop: 10,
    borderRadius: 20,
    height: 65,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  icon: {
    height: 24, // Same size as Ionicons size 24
    width: 24,
    resizeMode: 'contain',
  },
});
