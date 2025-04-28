import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, FlatList, Alert, StyleSheet, TouchableOpacity } from 'react-native';
import { saveContacts, loadContacts } from '../utils/StorageHelper';

export default function ContactScreen() {
  const [contactName, setContactName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [contacts, setContacts] = useState([]);

  // Load contacts on mount
  useEffect(() => {
    (async () => {
      const savedContacts = await loadContacts();
      setContacts(savedContacts);
    })();
  }, []);

  const handleAddContact = async () => {
    if (!contactName || !contactNumber) {
      Alert.alert('Error', 'Please enter both name and phone number.');
      return;
    }
    if (!/^\+\d{10,15}$/.test(contactNumber)) {
      Alert.alert('Error', 'Please enter a valid phone number (e.g., +919876543210).');
      return;
    }

    const newContact = {
      id: Date.now().toString(),
      name: contactName,
      number: contactNumber,
    };
    const updatedContacts = [...contacts, newContact];
    await saveContacts(updatedContacts);
    setContacts(updatedContacts);
    setContactName('');
    setContactNumber('');
    Alert.alert('Success', 'Contact added!');
  };

  const handleDeleteContact = async (id) => {
    const updatedContacts = contacts.filter((contact) => contact.id !== id);
    await saveContacts(updatedContacts);
    setContacts(updatedContacts);
    Alert.alert('Success', 'Contact deleted!');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Manage Emergency Contacts</Text>
      <Text style={styles.subtitle}>Add New Contact</Text>
      <TextInput
        style={styles.input}
        placeholder="Name (e.g., Bhai)"
        value={contactName}
        onChangeText={setContactName}
      />
      <TextInput
        style={styles.input}
        placeholder="Phone Number (e.g., +919876543210)"
        value={contactNumber}
        onChangeText={setContactNumber}
        keyboardType="phone-pad"
      />
      <Button title="Add Contact" onPress={handleAddContact} />
      <Text style={styles.subtitle}>Saved Contacts</Text>
      <FlatList
        data={contacts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.contactItem}>
            <View>
              <Text style={styles.contactName}>{item.name}</Text>
              <Text>{item.number}</Text>
            </View>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteContact(item.id)}
            >
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text>No contacts added yet.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  subtitle: { fontSize: 18, fontWeight: 'bold', marginVertical: 10 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
    width: '100%',
  },
  contactItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  contactName: { fontSize: 16, fontWeight: 'bold' },
  deleteButton: {
    backgroundColor: '#ff4444',
    padding: 8,
    borderRadius: 5,
  },
  deleteButtonText: { color: '#fff', fontWeight: 'bold' },
})