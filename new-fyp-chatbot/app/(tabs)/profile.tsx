import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ToastAndroid,
  Modal,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  Image,
  Switch,
  StatusBar,
  Platform,
  Animated,
  Alert,
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
  const [
    exerciseAvailabilityModalVisible,
    setExerciseAvailabilityModalVisible,
  ] = useState(false);

  const [availableDay, setAvailableDay] = useState('Monday');
  const [startTime, setStartTime] = useState('06:00');
  const [endTime, setEndTime] = useState('07:00');
  const [exerciseModalVisible, setExerciseModalVisible] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState('');
  const [newExerciseIntensity, setNewExerciseIntensity] = useState('moderate');

  const [showSuccessBar, setShowSuccessBar] = useState(false);
  const [successAnim] = useState(new Animated.Value(0));

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

            // Check for existing patient_inputs data
            const { data: patientInputs, error: fetchError } = await supabase
              .from('patient_inputs')
              .select('*')
              .eq('patient_id', profile.id)
              .single();

            if (fetchError && fetchError.code !== 'PGRST116') {
              throw fetchError;
            }

            if (patientInputs) {
              // Autofill the form fields
              setAge(patientInputs.age);
              setPhoneNumber(patientInputs.phone_number);
              setGender(patientInputs.gender);
            }
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

  const handleSavePersonalDetails = async () => {
    try {
      setLoading(true);
      if (!profileId) {
        throw new Error('Profile ID is not available.');
      }

      // Update the user profile in Supabase
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: username,
          email: email,
          updated_at: new Date(),
        })
        .eq('id', profileId); // Ensure you're updating the correct profile

      if (profileError) {
        throw profileError;
      }

      // Check if the patient_inputs record exists
      const { data: existingRecord, error: fetchError } = await supabase
        .from('patient_inputs')
        .select('*')
        .eq('patient_id', profileId)
        .single(); // Fetches a single record if it exists

      if (fetchError && fetchError.code !== 'PGRST116') {
        // If there is any error other than "No Rows Found" (PGRST116), throw the error
        throw fetchError;
      }

      const newRecord = {
        patient_id: profileId,
        age: age,
        phone_number: phoneNumber,
        gender: gender,
        updated_at: new Date(),
      };

      let response;
      if (existingRecord) {
        // Update the existing record
        response = await supabase
          .from('patient_inputs')
          .update(newRecord)
          .eq('patient_id', profileId);
      } else {
        // Insert a new record if it doesn't exist
        response = await supabase.from('patient_inputs').insert(newRecord);
      }

      const { error: saveError } = response;
      if (saveError) {
        throw saveError;
      }

      // Show success message
      if (Platform.OS === 'android') {
        ToastAndroid.show(
          'Personal details saved successfully',
          ToastAndroid.SHORT,
        );
      } else {
        // For iOS, show custom success bar
        setShowSuccessBar(true);
        Animated.timing(successAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: false,
        }).start(() => {
          setTimeout(() => {
            Animated.timing(successAnim, {
              toValue: 0,
              duration: 500,
              useNativeDriver: false,
            }).start(() => setShowSuccessBar(false));
          }, 2000); // Show for 2 seconds
        });
      }

      setModalVisible(false);
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert('Error', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveExerciseAvailability = async () => {
    try {
      console.log('Saving exercise availability...'); // Debugging log
      setLoading(true);
      if (!profileId) {
        throw new Error('Profile ID is not available.');
      }

      const newExerciseRecord = {
        profile_id: profileId,
        day_of_week: availableDay,
        start_time: startTime,
        end_time: endTime,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const { error } = await supabase
        .from('user_availability')
        .insert(newExerciseRecord);

      if (error) {
        throw error;
      }

      ToastAndroid.show(
        'Exercise availability saved successfully',
        ToastAndroid.SHORT,
      );
      setExerciseAvailabilityModalVisible(false);
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error saving exercise availability:', error.message); // Debugging log
        Alert.alert('Error', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddExercise = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('exercises').insert({
        name: newExerciseName,
        intensity: newExerciseIntensity,
      });

      if (error) throw error;

      ToastAndroid.show('Exercise added successfully', ToastAndroid.SHORT);
      setExerciseModalVisible(false);
      setNewExerciseName('');
      setNewExerciseIntensity('moderate');
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
            <Text style={styles.sectionTitle}>Manage Account</Text>
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
              <TouchableOpacity
                onPress={() => setExerciseAvailabilityModalVisible(true)}
              >
                <View style={[styles.row, styles.rowFirst]}>
                  <View
                    style={[styles.rowIcon, { backgroundColor: '#38C959' }]}
                  >
                    <FeatherIcon color="#fff" name="plus" size={20} />
                  </View>
                  <Text style={styles.rowLabel}>Add Exercise Availability</Text>
                  <View style={styles.rowSpacer} />
                  <FeatherIcon color="#C6C6C6" name="chevron-right" size={20} />
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setExerciseModalVisible(true)}>
                <View style={[styles.row, styles.rowFirst]}>
                  <View
                    style={[styles.rowIcon, { backgroundColor: '#FFA500' }]}
                  >
                    <FeatherIcon color="#fff" name="plus-circle" size={20} />
                  </View>
                  <Text style={styles.rowLabel}>Add New Exercise</Text>
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

      <Modal
        visible={exerciseAvailabilityModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setExerciseAvailabilityModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Exercise Availability</Text>

            <Text style={styles.modalLabel}>Day</Text>
            <Picker
              selectedValue={availableDay}
              onValueChange={(value) => setAvailableDay(value)}
              style={styles.picker}
            >
              <Picker.Item label="Monday" value="Monday" />
              <Picker.Item label="Tuesday" value="Tuesday" />
              <Picker.Item label="Wednesday" value="Wednesday" />
              <Picker.Item label="Thursday" value="Thursday" />
              <Picker.Item label="Friday" value="Friday" />
              <Picker.Item label="Saturday" value="Saturday" />
              <Picker.Item label="Sunday" value="Sunday" />
            </Picker>

            <Text style={styles.modalLabel}>Start Time</Text>
            <Input
              value={startTime}
              onChangeText={(text) => setStartTime(text)}
              keyboardType="number-pad"
              containerStyle={styles.inputContainer}
              inputStyle={styles.inputText}
            />

            <Text style={styles.modalLabel}>End Time</Text>
            <Input
              value={endTime}
              onChangeText={(text) => setEndTime(text)}
              keyboardType="number-pad"
              containerStyle={styles.inputContainer}
              inputStyle={styles.inputText}
            />

            <Button
              title="Save"
              buttonStyle={styles.saveButton}
              containerStyle={styles.saveButtonContainer}
              onPress={handleSaveExerciseAvailability}
            />
            <Button
              title="Close"
              type="outline"
              buttonStyle={styles.closeButton}
              containerStyle={styles.closeButtonContainer}
              onPress={() => setExerciseAvailabilityModalVisible(false)}
            />
          </View>
        </View>
      </Modal>

      <Modal
        visible={exerciseModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setExerciseModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Exercise</Text>

            <Text style={styles.modalLabel}>Exercise Name</Text>
            <Input
              value={newExerciseName}
              onChangeText={(text) => setNewExerciseName(text)}
              containerStyle={styles.inputContainer}
              inputStyle={styles.inputText}
            />

            <Text style={styles.modalLabel}>Intensity</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={newExerciseIntensity}
                onValueChange={(itemValue) =>
                  setNewExerciseIntensity(itemValue)
                }
                style={styles.picker}
                itemStyle={styles.pickerItem}
              >
                <Picker.Item label="Low" value="low" />
                <Picker.Item label="Moderate" value="moderate" />
                <Picker.Item label="Vigorous" value="vigorous" />
              </Picker>
            </View>

            <Button
              title="Add Exercise"
              buttonStyle={styles.saveButton}
              containerStyle={styles.saveButtonContainer}
              onPress={handleAddExercise}
            />
            <Button
              title="Close"
              type="outline"
              buttonStyle={styles.closeButton}
              containerStyle={styles.closeButtonContainer}
              onPress={() => setExerciseModalVisible(false)}
            />
          </View>
        </View>
      </Modal>

      {showSuccessBar && (
        <Animated.View
          style={[
            styles.successBar,
            {
              opacity: successAnim,
              bottom: successAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-50, 0],
              }),
            },
          ]}
        >
          <Text style={styles.successText}>Details updated successfully!</Text>
        </Animated.View>
      )}
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
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  pickerItem: {
    fontSize: 16,
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
  successBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 50,
    backgroundColor: 'green',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
