import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Alert,
  ToastAndroid,
  Modal,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  Image,
  Switch,
  StatusBar,
} from 'react-native';
import { Button, Input } from '@rneui/themed';
import { Picker } from '@react-native-picker/picker';
import { supabase } from '../../lib/supabase';
import { fetchUserProfile } from '../../lib/fetchUserProfile';
import { router } from 'expo-router';
import FeatherIcon from 'react-native-vector-icons/Feather';
import { Colors } from '@/constants/Colors';

export default function Profile() {
  const [loading, setLoading] = useState(false);
  const [profileId, setProfileId] = useState(null);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  const [age, setAge] = useState(18);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [gender, setGender] = useState('Male');
  const [modalVisible, setModalVisible] = useState(false);

  const [form, setForm] = useState({
    emailNotifications: true,
    pushNotifications: false,
  });

  useEffect(() => {
    const fetchSessionAndProfile = async () => {
      try {
        setLoading(true);
        const { data: sessionData, error: sessionError } =
          await supabase.auth.getSession();

        if (sessionError) {
          console.error('Error fetching session:', sessionError);
          return;
        }

        if (sessionData?.session) {
          setEmail(sessionData.session.user.email ?? '');
          const profile = await fetchUserProfile(sessionData.session.user.id);

          if (profile) {
            setUsername(profile.full_name);
            setAvatarUrl(profile.avatar_url);
            setProfileId(profile.id);
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

  const updateProfile = async ({ username, avatar_url, email }) => {
    try {
      setLoading(true);
      if (!profileId) {
        throw new Error('Profile ID is not available.');
      }

      const updates = {
        id: profileId,
        full_name: username,
        avatar_url,
        email,
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

      await updateProfile({
        username,
        avatar_url: avatarUrl,
        email,
      });

      const newRecord = {
        patient_id: profileId,
        age: age,
        phone_number: phoneNumber,
        gender: gender,
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

  const ageOptions = Array.from({ length: 99 }, (_, index) => index + 1);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f6f6f6' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#f6f6f6" />
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Profile</Text>
          </View>
          <View style={[styles.section, { paddingTop: 4 }]}>
            <Text style={styles.sectionTitle}>Account</Text>
            <View style={styles.sectionBody}>
              <TouchableOpacity style={styles.profile}>
                <Image
                  alt=""
                  source={{
                    uri: avatarUrl || 'https://via.placeholder.com/150',
                  }}
                  style={styles.profileAvatar}
                />
                <View style={styles.profileBody}>
                  <Text style={styles.profileName}>
                    {username || 'User Name'}
                  </Text>
                  <Text style={styles.profileHandle}>
                    {email || 'user@example.com'}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account Information</Text>
            <View style={styles.sectionBody}>
              <TouchableOpacity onPress={() => setModalVisible(true)}>
                <View style={[styles.row, styles.rowFirst]}>
                  <View
                    style={[styles.rowIcon, { backgroundColor: '#007AFF' }]}
                  >
                    <FeatherIcon color="#fff" name="user-plus" size={20} />
                  </View>
                  <Text style={styles.rowLabel}>Edit Personal Details</Text>
                  <View style={styles.rowSpacer} />
                  <FeatherIcon color="#C6C6C6" name="chevron-right" size={20} />
                </View>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notifications</Text>

            <View style={styles.sectionBody}>
              <View style={styles.rowWrapper}>
                <View style={styles.row}>
                  <View
                    style={[styles.rowIcon, { backgroundColor: '#38C959' }]}
                  >
                    <FeatherIcon color="#fff" name="bell" size={20} />
                  </View>
                  <Text style={styles.rowLabel}>Push Notifications</Text>
                  <View style={styles.rowSpacer} />
                  <Switch
                    onValueChange={(pushNotifications) =>
                      setForm({ ...form, pushNotifications })
                    }
                    value={form.pushNotifications}
                  />
                </View>
              </View>
            </View>
          </View>

          <View style={{ marginTop: 25 }}>
            <View style={styles.sectionBody}>
              <View
                style={[
                  styles.rowWrapper,
                  styles.rowFirst,
                  styles.rowLast,
                  { alignItems: 'center' },
                ]}
              >
                <TouchableOpacity onPress={handleLogout} style={styles.row}>
                  <Text style={[styles.rowLabel, styles.rowLabelLogout]}>
                    Log Out
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Personal Details</Text>

            <Text style={styles.modalLabel}>Name</Text>
            <Input
              value={username}
              onChangeText={(text) => setUsername(text)}
              containerStyle={styles.inputContainer}
              inputStyle={styles.inputText}
            />

            <Text style={styles.modalLabel}>Email</Text>
            <Input
              value={email}
              onChangeText={(text) => setEmail(text)}
              containerStyle={styles.inputContainer}
              inputStyle={styles.inputText}
            />

            <Text style={styles.modalLabel}>Age</Text>
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

            <Text style={styles.modalLabel}>Phone Number</Text>
            <Input
              value={phoneNumber}
              onChangeText={(text) => setPhoneNumber(text)}
              keyboardType="phone-pad"
              containerStyle={styles.inputContainer}
              inputStyle={styles.inputText}
            />

            <Text style={styles.modalLabel}>Gender</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={gender}
                onValueChange={(itemValue) => setGender(itemValue)}
              >
                <Picker.Item label="Male" value="Male" />
                <Picker.Item label="Female" value="Female" />
              </Picker>
            </View>

            <Button
              title="Save"
              buttonStyle={styles.saveButton}
              containerStyle={styles.saveButtonContainer}
              onPress={handleSavePersonalDetails}
            />
            <Button
              title="Close"
              type="outline"
              buttonStyle={styles.closeButton}
              containerStyle={styles.closeButtonContainer}
              onPress={() => setModalVisible(false)}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollViewContent: {
    flexGrow: 1,
  },
  container: {
    paddingTop: StatusBar.currentHeight || 0,
    paddingBottom: 24,
    paddingHorizontal: 24,
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
  },
  header: {
    marginTop: 10,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1d1d1d',
  },
  profile: {
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 9999,
    marginRight: 12,
  },
  profileBody: {
    marginRight: 'auto',
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#292929',
  },
  profileHandle: {
    marginTop: 2,
    fontSize: 16,
    fontWeight: '400',
    color: '#858585',
  },
  section: {
    marginTop: 12,
  },
  sectionTitle: {
    marginTop: 15,
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#a7a7a7',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  sectionBody: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e3e3e3',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingRight: 24,
    height: 50,
  },
  rowWrapper: {
    borderTopWidth: 1,
    borderColor: '#e3e3e3',
  },
  rowFirst: {
    borderTopWidth: 0,
  },
  rowIcon: {
    width: 30,
    height: 30,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowLabel: {
    fontSize: 17,
    fontWeight: '500',
    color: '#000',
  },
  rowSpacer: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 10,
    margin: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 5,
  },
  pickerContainer: {
    marginVertical: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    padding: 5,
  },
  inputContainer: {
    marginTop: 2,
  },
  inputText: {
    fontSize: 16,
    paddingLeft: 5,
  },
  saveButton: {
    backgroundColor: Colors.NAVY,
    paddingVertical: 10,
  },
  saveButtonContainer: {
    marginTop: 15,
  },
  closeButton: {
    paddingVertical: 10,
    borderColor: Colors.NAVY,
  },
  closeButtonContainer: {
    marginTop: 10,
  },
  rowLast: {
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  rowLabelLogout: {
    width: '100%',
    textAlign: 'center',
    fontWeight: '600',
    color: '#dc2626',
  },
});
