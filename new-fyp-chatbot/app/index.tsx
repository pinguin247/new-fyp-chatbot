import Login from '@/components/Login';
import { View } from 'react-native';
import { supabase } from '../lib/supabase';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import React from 'react';

export default function Index() {
  const [user, setUser] = useState<Session | null>(null);

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setUser(data.session);
      } else {
        setUser(null);
      }
    };

    getSession();
  }, []);

  return (
    <View style={{ flex: 1 }}>
      {user ? <Redirect href={'/home'} /> : <Login />}
    </View>
  );
}
