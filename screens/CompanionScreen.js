import React, { useState, useEffect } from 'react';
import { View, Text, Button, FlatList, Alert, StyleSheet } from 'react-native';
import * as Location from 'expo-location';
import { sendSMS } from '../utils/WhatsAppHelper';
import { saveCompanionRequest, loadCompanionRequests } from '../utils/StorageHelper';
import NetInfo from '@react-native-community/netinfo';

export default function CompanionScreen() {
  const [volunteers, setVolunteers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required.');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setUserLocation(location.coords);

      
      const mockVolunteers = [
        {
          id: '1',
          name: 'Volunteer 1',
          number: '+919876543211',
          latitude: location.coords.latitude + 0.001,
          longitude: location.coords.longitude + 0.001,
        },
        {
          id: '2',
          name: 'Volunteer 2',
          number: '+919876543212',
          latitude: location.coords.latitude - 0.001,
          longitude: location.coords.longitude - 0.001,
        },
      ];
      setVolunteers(mockVolunteers);

      
      setRequests(await loadCompanionRequests());
    })();
  }, []);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; 
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; 
    return (distance / 1000).toFixed(2); 
  };

  const requestCompanion = async (volunteer) => {
    const message = `Request: Please assist as a companion. My location: Lat ${userLocation?.latitude}, Lon ${userLocation?.longitude}.`;
    const netInfo = await NetInfo.fetch();

    if (netInfo.isConnected) {
      await sendSMS(volunteer.number, message);
      Alert.alert('Success', `Request sent to ${volunteer.name}!`);
    } else {
      Alert.alert('Offline', 'Request saved, will sync when online.');
    }

    const request = {
      id: Date.now().toString(),
      volunteerName: volunteer.name,
      volunteerNumber: volunteer.number,
      timestamp: new Date().toISOString(),
      message,
    };
    await saveCompanionRequest(request);
    setRequests([...requests, request]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Crowd-Sourced Companion</Text>
      <Text style={styles.subtitle}>Nearby Volunteers</Text>
      <FlatList
        data={volunteers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.volunteerItem}>
            <Text>
              {item.name} (Distance: {userLocation ? calculateDistance(
                userLocation.latitude,
                userLocation.longitude,
                item.latitude,
                item.longitude
              ) : 'N/A'} km)
            </Text>
            <Button title="Request" onPress={() => requestCompanion(item)} />
          </View>
        )}
      />
      <Text style={styles.subtitle}>Request History</Text>
      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.requestItem}>
            <Text>{item.volunteerName} at {new Date(item.timestamp).toLocaleString()}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  subtitle: { fontSize: 18, fontWeight: 'bold', marginVertical: 10 },
  volunteerItem: { flexDirection: 'row', justifyContent: 'space-between', padding: 10, borderBottomWidth: 1 },
  requestItem: { padding: 10, borderBottomWidth: 1 },
});