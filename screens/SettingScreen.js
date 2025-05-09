import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function SettingsScreen() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <Button
        title="Manage Contacts"
        onPress={() => navigation.navigate('Contacts')}
      />
      <Button
        title="Manage Safe Zones"
        onPress={() => navigation.navigate('GeoFence')}
      />
      <Button
        title="Crowd-Sourced Companion"
        onPress={() => navigation.navigate('Companion')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
});