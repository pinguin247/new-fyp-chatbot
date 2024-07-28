import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useNavigation, Link } from 'expo-router';
import { Colors } from '@/constants/Colors';
import Icon from 'react-native-vector-icons/Ionicons';

export default function SignUp() {
  const navigation = useNavigation();
  const [passwordVisible, setPasswordVisible] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Icon name="arrow-back" size={24} color={Colors.NAVY} />
      </TouchableOpacity>
      <View style={styles.subcontainer}>
        <Text style={styles.title}>Registration</Text>
        <Text style={styles.subtitle}>Please register down here</Text>
      </View>
      <View style={styles.inputContainer}>
        <Icon name="person-outline" size={20} color={Colors.GRAY} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Full name"
          placeholderTextColor={Colors.GRAY}
        />
      </View>
      <View style={styles.inputContainer}>
        <Icon name="mail-outline" size={20} color={Colors.GRAY} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={Colors.GRAY}
        />
      </View>
      <View style={styles.inputContainer}>
        <Icon name="lock-closed-outline" size={20} color={Colors.GRAY} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={Colors.GRAY}
          secureTextEntry={!passwordVisible}
        />
        <TouchableOpacity onPress={togglePasswordVisibility} style={styles.icon}>
          <Icon name={passwordVisible ? "eye-off" : "eye"} size={20} color={Colors.GRAY} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.loginButton}>
        <Text style={styles.loginButtonText}>REGISTER</Text>
      </TouchableOpacity>

      <View style={styles.separatorContainer}>
        <View style={styles.separatorLine} />
        <Text style={styles.separatorText}>Or continue with</Text>
        <View style={styles.separatorLine} />
      </View>

      <TouchableOpacity style={styles.googleButton}>
        <Image
          source={require('../../../assets/images/google.png')}
          style={styles.googleLogo}
        />
        <Text style={styles.googleButtonText}>Google</Text>
      </TouchableOpacity>

      <View style={styles.registerContainer}>
        <Text style={styles.registerText}>Already have an acccount? </Text>
        <Link href="auth/sign-in" style={styles.registerLink}>
          Log in
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 25,
    backgroundColor: Colors.WHITE,
  },
  backButton: {
    position: 'absolute',
    top: 70, // Adjust based on your app's header height
    left: 20,
  },
  subcontainer: {
    marginTop: '40%',
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Outfit-Bold',
    textAlign: 'center',
    color: Colors.PRIMARY,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Outfit',
    color: Colors.GRAY,
    marginTop: 10,
    textAlign: 'center',
  },
  inputContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.LIGHTGRAY,
    borderRadius: 15,
    paddingHorizontal: 15,
    marginTop: 20,
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    color: Colors.PRIMARY,
    fontFamily: 'Outfit',
    marginLeft: 10,
  },
  inputIcon: {
    marginRight: 10,
  },
  icon: {
    marginLeft: 10,
  },
  loginButton: {
    width: '100%',
    borderRadius: 10,
    backgroundColor: Colors.NAVY,
    padding: 15,
    marginTop: 50,
    alignItems: 'center',
  },
  loginButtonText: {
    textAlign: 'center',
    fontFamily: 'Outfit',
    color: Colors.WHITE,
  },
  separatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    width: '100%',
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.GRAY,
  },
  separatorText: {
    fontSize: 14,
    fontFamily: 'Outfit',
    color: Colors.GRAY,
    marginHorizontal: 10,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    borderRadius: 10,
    backgroundColor: Colors.WHITE,
    padding: 5,
    borderWidth: 1,
    borderColor: Colors.GRAY,
    marginTop: 20,
  },
  googleLogo: {
    width: 40,
    height: 40,
    marginRight: 10,
    resizeMode: 'contain',
  },
  googleButtonText: {
    fontFamily: 'Outfit',
    color: Colors.BLACK,
    fontSize: 16,
  },
  registerContainer: {
    flexDirection: 'row',
    marginTop: 20,
  },
  registerText: {
    fontSize: 14,
    fontFamily: 'Outfit',
    color: Colors.GRAY,
  },
  registerLink: {
    fontSize: 14,
    fontFamily: 'Outfit',
    color: Colors.NAVY,
    textDecorationLine: 'underline',
  },
});
