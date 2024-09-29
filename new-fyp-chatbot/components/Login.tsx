import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import React from 'react';
import { Colors } from '@/constants/Colors';
import { useRouter } from 'expo-router';

export default function Login() {
  const router = useRouter();
  return (
    <View>
      <Image
        source={require('./../assets/images/TTSH.jpg')}
        style={{
          width: '100%',
          height: 520,
        }}
      />
      <View style={styles.container}>
        <Text
          style={{
            fontSize: 30,
            fontFamily: 'Outfit-Bold',
            textAlign: 'center',
            marginTop: 10,
          }}
        >
          FitBuddySG
        </Text>
        <Text
          style={{
            fontSize: 17,
            fontFamily: 'Outfit',
            textAlign: 'center',
            color: Colors.GRAY,
            marginTop: 20,
          }}
        >
          Stay active, stay healthy, and achieve your fitness goals with our
          interactive chatbot and exercise tracking features.
        </Text>

        <TouchableOpacity
          onPress={() => router.push('/auth/sign-in')}
          style={styles.button}
        >
          <Text
            style={{
              color: Colors.WHITE,
              textAlign: 'center',
              fontFamily: 'Outfit',
              fontSize: 17,
            }}
          >
            Get Started
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.WHITE,
    marginTop: -20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '100%',
    padding: 25,
  },
  button: {
    padding: 15,
    backgroundColor: Colors.NAVY,
    borderRadius: 99,
    marginTop: '25%',
  },
});
