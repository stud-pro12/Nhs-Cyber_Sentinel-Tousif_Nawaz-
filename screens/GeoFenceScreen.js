import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, FlatList, Alert, StyleSheet } from 'react-native';
import * as Location from 'expo-location';
import { saveSafeZones, loadSafeZones, saveGeoFenceExit } from '../utils/StorageHelper';
import { sendSMS } from '../utils/WhatsAppHelper';
import NetInfo from '@react-native-community/netinfo';

export default function GeoFenceScreen() {
  const [zoneName, setZoneName] = useState('');
  const [radius, setRadius] = useState('');
  const [safeZones, setSafeZones] = useState([]);
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setUserLocation(location.coords);

      const zones = await loadSafeZones();
      setSafeZones(zones);

      // Watch position for geo-fence monitoring
      Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 10 },
        (location) => {
          checkGeoFence(location.coords);
        }
      );
    })();
  }, []);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in meters
  };

  const checkGeoFence = async (coords) => {
    for (const zone of safeZones) {
      const distance = calculateDistance(
        coords.latitude,
        coords.longitude,
        zone.latitude,
        zone.longitude
      );
      if (distance > zone.radius) {
        const exitEvent = {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          zoneId: zone.id,
        };
        await saveGeoFenceExit(exitEvent);
        console.log('Geo-fence exit:', exitEvent);

        const message = `ALERT: User has exited safe zone ${zone.name} (Lat: ${zone.latitude}, Lon: ${zone.longitude}).`;
        const netInfo = await NetInfo.fetch();
        if (netInfo.isConnected) {
          const contacts = await loadContacts();
          if (contacts.length === 0) {
            Alert.alert('No Contacts', 'Please add emergency contacts.');
            return;
          }
          for (const contact of contacts) {
            await sendSMS(contact.number, message);
          }
          Alert.alert('Alert Sent', `Notified contacts about exiting ${zone.name}.`);
        } else {
          await saveOfflineSOS({ reason: 'Geo-fence exit', message, timestamp: new Date().toISOString() });
          Alert.alert('Offline', 'Alert saved, will sync when online.');
        }
      }
    }
  };

  const addSafeZone = async () => {
    if (!zoneName || !radius || isNaN(radius) || Number(radius) <= 0) {
      Alert.alert('Error', 'Please enter a valid zone name and radius.');
      return;
    }
    if (!userLocation) {
      Alert.alert('Error', 'Location not available.');
      return;
    }

    const newZone = {
      id: Date.now().toString(),
      name: zoneName,
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
      radius: Number(radius),
    };
    const updatedZones = [...safeZones, newZone];
    await saveSafeZones(updatedZones);
    setSafeZones(updatedZones);
    setZoneName('');
    setRadius('');
    Alert.alert('Success', 'Safe zone added!');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Manage Safe Zones</Text>
      <Text style={styles.subtitle}>Add New Safe Zone</Text>
      <TextInput
        style={styles.input}
        placeholder="Zone Name (e.g., Home)"
        value={zoneName}
        onChangeText={setZoneName}
      />
      <TextInput
        style={styles.input}
        placeholder="Radius (meters)"
        value={radius}
        onChangeText={setRadius}
        keyboardType="numeric"
      />
      <Button title="Add Safe Zone" onPress={addSafeZone} />
      <Text style={styles.subtitle}>Saved Safe Zones</Text>
      <FlatList
        data={safeZones}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.zoneItem}>
            <Text>{item.name} (Lat: {item.latitude.toFixed(4)}, Lon: {item.longitude.toFixed(4)}, Radius: {item.radius}m)</Text>
          </View>
        )}
        ListEmptyComponent={<Text>No safe zones added yet.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  subtitle: { fontSize: 18, fontWeight: 'bold', marginVertical: 10 },
  input: { borderWidth: 1, padding: 10, marginBottom: 10, borderRadius: 5, width: '100%' },
  zoneItem: { padding: 10, borderBottomWidth: 1, borderBottomColor: '#ccc' },
});