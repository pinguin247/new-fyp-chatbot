import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Alert, ToastAndroid, Modal } from 'react-native';
import { Button, Input } from '@rneui/themed';
import { Picker } from '@react-native-picker/picker';
import { supabase } from '../../lib/supabase';
import { fetchUserProfile } from '../../lib/fetchUserProfile'; // Import the new service

import { router } from 'expo-router';

export default function Profile() {
  const [loading, setLoading] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  // Personal details fields for the modal
  const [age, setAge] = useState(18); // Default age set to 18
  const [phoneNumber, setPhoneNumber] = useState(''); // New phone number field
  const [gender, setGender] = useState('Male');
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const fetchSessionAndProfile = async () => {
      try {
        setLoading(true);

        // Fetch session
        const { data: sessionData, error: sessionError } =
          await supabase.auth.getSession();

        if (sessionError) {
          console.error('Error fetching session:', sessionError);
          return;
        }

        if (sessionData?.session) {
          setEmail(sessionData.session.user.email ?? '');

          // Fetch profile data using fetchUserProfile
          const profile = await fetchUserProfile(sessionData.session.user.id);

          if (profile) {
            setUsername(profile.full_name);
            setAvatarUrl(profile.avatar_url);
            setProfileId(profile.id); // Store the profile ID for later use
          } else {
            console.error('Error: Profile data is missing');
          }
        }
      } catch (error) {
        console.error('Error in fetchSessionAndProfile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSessionAndProfile();
  }, []);

  // Update profile function
  const updateProfile = async ({
    username,
    avatar_url,
  }: {
    username: string;
    avatar_url: string;
  }) => {
    try {
      setLoading(true);

      if (!profileId) {
        throw new Error('Profile ID is not available.');
      }

      const updates = {
        id: profileId,
        full_name: username, // Assuming full_name is the field for username in profiles table
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
        Alert.alert('Error', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSavePersonalDetails = async () => {
    try {
      setLoading(true);

      if (!profileId) {
        throw new Error('Profile ID is not available.');
      }

      const newRecord = {
        patient_id: profileId, // Use the stored profile ID as the foreign key
        age: age, // Age as a number
        phone_number: phoneNumber, // New phone number field
        gender: gender, // Gender value
        created_at: new Date(),
        updated_at: new Date(),
      };

      const { error } = await supabase.from('patient_inputs').insert(newRecord);

      if (error) {
        console.error('Error inserting data:', error);
        throw error;
      }

      ToastAndroid.show(
        'Personal details saved successfully',
        ToastAndroid.SHORT,
      );
      setModalVisible(false);
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert('Error', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      setLoading(true);
      await logout();
      ToastAndroid.show('Logged out successfully', ToastAndroid.SHORT);
      router.replace('/');
    } catch (error) {
      ToastAndroid.show('Error logging out', ToastAndroid.LONG);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      console.log('User signed out successfully');
    } catch (error: any) {
      console.error('Error signing out: ', error.message);
    }
  };

  // Generate an array of ages (e.g., 18 to 100)
  const ageOptions = Array.from({ length: 99 }, (_, index) => index + 1);

  return (
    <View style={styles.container}>
      <View style={[styles.verticallySpaced, styles.mt20]}>
        <Input label="Email" value={email} disabled />
      </View>
      <View style={styles.verticallySpaced}>
        <Input
          label="Username"
          value={username || ''}
          onChangeText={(text) => setUsername(text)}
        />
      </View>

      <View style={[styles.verticallySpaced, styles.mt20]}>
        <Button
          title={loading ? 'Loading ...' : 'Update Profile'}
          onPress={() => updateProfile({ username, avatar_url: avatarUrl })}
          disabled={loading}
        />
      </View>

      <View style={styles.verticallySpaced}>
        <Button
          title="Add Personal Details"
          onPress={() => setModalVisible(true)}
        />
      </View>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {/* Age Picker */}
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={age}
                onValueChange={(itemValue) => setAge(itemValue)}
              >
                {ageOptions.map((ageOption) => (
                  <Picker.Item
                    key={ageOption}
                    label={String(ageOption)}
                    value={ageOption}
                  />
                ))}
              </Picker>
            </View>

            <Input
              label="Phone Number"
              value={phoneNumber}
              onChangeText={(text) => setPhoneNumber(text)}
              keyboardType="phone-pad"
            />

            {/* Gender Picker */}
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={gender}
                onValueChange={(itemValue) => setGender(itemValue)}
              >
                <Picker.Item label="Male" value="Male" />
                <Picker.Item label="Female" value="Female" />
              </Picker>
            </View>

            <Button title="Save" onPress={handleSavePersonalDetails} />
            <Button title="Close" onPress={() => setModalVisible(false)} />
          </View>
        </View>
      </Modal>

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
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    margin: 20,
  },
  pickerContainer: {
    marginVertical: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
  },
});
