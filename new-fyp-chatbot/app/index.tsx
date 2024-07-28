import Login from '@/components/Login';
import { View } from 'react-native';
import { auth } from '../configs/FirebaseConfig';
import { Redirect } from 'expo-router';

export default function Index() {
  const user = auth.currentUser;
  console.log('TESTNG LOGIN', user);

  return (
    <View style={{ flex: 1 }}>
      {user ? <Redirect href={'/home'} /> : <Login />}
    </View>
  );
}
