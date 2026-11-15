import React from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors } from './src/theme';
import { StoreProvider, useStore } from './src/store';
import { TAB_SCREENS, TabBar } from './src/components/TabBar';
import Splash from './src/screens/Splash';
import Login from './src/screens/Login';
import Register from './src/screens/Register';
import Forgot from './src/screens/Forgot';
import Home from './src/screens/Home';
import Queue from './src/screens/Queue';
import Ticket from './src/screens/Ticket';
import Records from './src/screens/Records';
import LabDetail from './src/screens/LabDetail';
import Pay from './src/screens/Pay';
import PayDetail from './src/screens/PayDetail';
import Success from './src/screens/Success';
import Profile from './src/screens/Profile';
import Notif from './src/screens/Notif';
import Akun from './src/screens/Akun';

const SCREENS = {
  splash: Splash, login: Login, register: Register, forgot: Forgot, home: Home, queue: Queue, ticket: Ticket, records: Records,
  lab: LabDetail, pay: Pay, payDetail: PayDetail, success: Success, profile: Profile, notif: Notif, akun: Akun,
};

function Root() {
  const { screen } = useStore();
  const Current = SCREENS[screen];
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style={screen === 'login' ? 'light' : 'dark'} />
      <View style={{ flex: 1 }}><Current /></View>
      {TAB_SCREENS.includes(screen) && <TabBar />}
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StoreProvider><Root /></StoreProvider>
    </SafeAreaProvider>
  );
}
