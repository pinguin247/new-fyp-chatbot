import React, { useState, useEffect } from 'react';
import { Text, SafeAreaView, View } from 'react-native';
import Header from '@/components/Header';
import Banner from '@/components/Banner';
import Card from '@/components/Card';
import VideoPlay from '@/components/VideoPlay';
import Label from '@/components/Label';
import styles from '../../constants/styles';
import { supabase } from '../../lib/supabase'; // Assuming supabase is configured
import { fetchUserProfile } from '../../lib/fetchUserProfile'; // Import the new service
import { LogBox } from 'react-native';

LogBox.ignoreLogs(['ReactImageView: Image source "null" doesn\'t exist']);

const HomePage: React.FC = () => {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null); // New state for storing username

  useEffect(() => {
    const fetchProfileData = async () => {
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError) {
        console.error('Error fetching session:', sessionError);
        return;
      }

      if (sessionData?.session) {
        const userId = sessionData.session.user.id;
        const profile = await fetchUserProfile(userId); // Call the function from profileService

        if (profile) {
          setAvatarUrl(profile.avatar_url || null); // Set the avatar URL
          setUserName(profile.full_name || ''); // Set the username from profile
        }
      }
    };

    fetchProfileData();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.screen}>
        {/* Pass the fetched avatarUrl and userName to the Header */}
        <Header avatarUrl={avatarUrl} userName={userName || 'User'} />
        <Banner />
      </View>
      <View style={{ marginHorizontal: '3%', marginTop: '3%' }}>
        <Label>Your Activities</Label>
        <View style={{ flexDirection: 'row' }}>
          {data.map((item, index) => (
            <Card data={item} index={index} key={index} />
          ))}
        </View>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '3%',
          }}
        >
          <Label>Exercise Videos</Label>
          <Text
            style={{
              fontFamily: 'Poppins-Regular',
              opacity: 0.5,
              fontSize: 12,
            }}
          >
            View All
          </Text>
        </View>
        <View style={{ flexDirection: 'row' }}>
          {data.map((item, index) => (
            <VideoPlay key={index} />
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
};

export default HomePage;

const data = [
  {
    name: 'Cycling',
    status: 85,
    image: require('../../assets/images/cycle.png'),
    lightColor: '#f8e4d9',
    color: '#fcf1ea',
    darkColor: '#fac5a4',
  },
  {
    name: 'Walking',
    status: 25,
    image: require('../../assets/images/walk.png'),
    lightColor: '#d7f0f7',
    color: '#e8f7fc',
    darkColor: '#aceafc',
  },
  {
    name: 'Yoga',
    status: 85,
    image: require('../../assets/images/yoga.png'),
    lightColor: '#dad5fe',
    color: '#e7e3ff',
    darkColor: '#8860a2',
  },
];
