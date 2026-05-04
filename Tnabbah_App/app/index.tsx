/* import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../../providers/AuthProvider';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const router = useRouter();
  const { session, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (session) {
        router.replace('/home');
      } else {
        router.replace('/start');
      }
    }
  }, [loading, session]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
    </View>
  );
} */




  // دايم نوجّه المستخدم لصفحة Start
import { Redirect } from "expo-router";

export default function Index() {
  return <Redirect href="/start" />;
}