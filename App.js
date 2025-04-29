import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import PasscodeScreen from './screens/PasscodeScreen';
import HomeScreen from './screens/HomeScreen';
import EmotionScreen from './screens/EmotionScreen';
import LocationScreen from './screens/LocationScreen';
import SettingsScreen from './screens/SettingsScreen';
import SOSScreen from './screens/SOSScreen';
import GeoFenceScreen from './screens/GeoFenceScreen';
import CompanionScreen from './screens/CompanionScreen';
import ContactScreen from './screens/ContactScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function SettingsStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="SettingsHome" component={SettingsScreen} options={{ title: 'Settings' }} />
      <Stack.Screen name="GeoFence" component={GeoFenceScreen} options={{ title: 'Manage Safe Zones' }} />
      <Stack.Screen name="Companion" component={CompanionScreen} options={{ title: 'Companion System' }} />
      <Stack.Screen name="Contacts" component={ContactScreen} options={{ title: 'Manage Contacts' }} />
    </Stack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === 'Home') iconName = 'home';
          else if (route.name === 'Emotion') iconName = 'happy';
          else if (route.name === 'Location') iconName = 'location';
          else if (route.name === 'Settings') iconName = 'settings';
          else if (route.name === 'SOS') iconName = 'alert-circle';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Emotion" component={EmotionScreen} />
      <Tab.Screen name="Location" component={LocationScreen} />
      <Tab.Screen name="Settings" component={SettingsStackNavigator} options={{ headerShown: false }} />
      <Tab.Screen name="SOS" component={SOSScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Passcode">
        <Stack.Screen name="Passcode" component={PasscodeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}