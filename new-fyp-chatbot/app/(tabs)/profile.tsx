import { useState, useEffect } from 'react';
import { StyleSheet, View, Alert, ToastAndroid } from 'react-native';
import { Button, Input } from '@rneui/themed';
import { Session } from '@supabase/supabase-js';
import React from 'react';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';

export default function Profile({ session }: { session: Session }) {
  const [loading, setLoading] = useState(false); // Initially set to false
  const [username, setUsername] = useState('');
  const [website, setWebsite] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  useEffect(() => {
    if (session) getProfile();
  }, [session]);

  async function getProfile() {
    try {
      setLoading(true);
      if (!session?.user) throw new Error('No user on the session!');

      const { data, error, status } = await supabase
        .from('profiles')
        .select(`username, website, avatar_url`)
        .eq('id', session?.user.id)
        .single();
      if (error && status !== 406) {
        throw error;
      }

      if (data) {
        setUsername(data.username);
        setWebsite(data.website);
        setAvatarUrl(data.avatar_url);
      }
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert(error.message);
      }
    } finally {
      setLoading(false); // Make sure loading is reset here
    }
  }

  async function updateProfile({
    username,
    website,
    avatar_url,
  }: {
    username: string;
    website: string;
    avatar_url: string;
  }) {
    try {
      setLoading(true);
      if (!session?.user) throw new Error('No user on the session!');

      const updates = {
        id: session?.user.id,
        username,
        website,
        avatar_url,
        updated_at: new Date(),
      };

      const { error } = await supabase.from('profiles').upsert(updates);

      if (error) {
        throw error;
      }

      ToastAndroid.show('Profile updated successfully', ToastAndroid.SHORT);
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert(error.message);
      }
    } finally {
      setLoading(false); // Ensure loading is reset here after updating profile
    }
  }

  const handleLogout = async () => {
    try {
      setLoading(true); // Optional: Add loading state here if needed
      await logout();
      ToastAndroid.show('Logged out successfully', ToastAndroid.SHORT);
      router.replace('/'); // Adjust the route as necessary
    } catch (error) {
      ToastAndroid.show('Error logging out', ToastAndroid.LONG);
    } finally {
      setLoading(false); // Ensure loading is reset here after logout
    }
  };

  async function logout() {
    try {
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
      <View style={[styles.verticallySpaced, styles.mt20]}>
        <Input label="Email" value={session?.user?.email} disabled />
      </View>
      <View style={styles.verticallySpaced}>
        <Input
          label="Username"
          value={username || ''}
          onChangeText={(text) => setUsername(text)}
        />
      </View>
      <View style={styles.verticallySpaced}>
        <Input
          label="Website"
          value={website || ''}
          onChangeText={(text) => setWebsite(text)}
        />
      </View>

      <View style={[styles.verticallySpaced, styles.mt20]}>
        <Button
          title={loading ? 'Loading ...' : 'Update'}
          onPress={() =>
            updateProfile({ username, website, avatar_url: avatarUrl })
          }
          disabled={loading} // Disable the button while loading
        />
      </View>

      <View style={styles.verticallySpaced}>
        <Button title="Sign Out" onPress={handleLogout} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 40,
    padding: 12,
  },
  verticallySpaced: {
    paddingTop: 4,
    paddingBottom: 4,
    alignSelf: 'stretch',
  },
  mt20: {
    marginTop: 20,
  },
});
