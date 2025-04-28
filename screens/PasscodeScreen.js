import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { loadContacts } from '../utils/StorageHelper';
import { sendSMS } from '../utils/WhatsAppHelper';
import NetInfo from '@react-native-community/netinfo';

export default function PasscodeScreen() {
  const [passcode, setPasscode] = useState('');
  const navigation = useNavigation();

  const handlePasscode = async () => {
    if (passcode === '5678') {
      navigation.replace('Main'); // Navigate to Main (bottom tabs)
    } else if (passcode === '1234') {
      const contacts = await loadContacts();
      if (contacts.length === 0) {
        Alert.alert('No Contacts', 'Please add emergency contacts in Settings.');
        return;
      }
      const message = 'Emergency SOS triggered via passcode!';
      const netInfo = await NetInfo.fetch();
      if (netInfo.isConnected) {
        for (const contact of contacts) {
          await sendSMS(contact.number, message);
        }
        Alert.alert('Success', 'SOS sent to all contacts!');
      } else {
        await saveOfflineSOS({ reason: 'Passcode SOS', message, timestamp: new Date().toISOString() });
        Alert.alert('Offline', 'SOS saved, will sync when online.');
      }
    } else {
      Alert.alert('Error', 'Incorrect passcode');
    }
    setPasscode('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter Passcode</Text>
      <TextInput
        style={styles.input}
        placeholder="Passcode"
        value={passcode}
        onChangeText={setPasscode}
        keyboardType="numeric"
        secureTextEntry
      />
      <Button title="Submit" onPress={handlePasscode} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 1, padding: 10, marginBottom: 10, borderRadius: 5 },
});