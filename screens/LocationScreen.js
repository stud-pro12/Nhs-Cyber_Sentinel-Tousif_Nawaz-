import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import * as Location from 'expo-location';
import { loadSafeZones } from '../utils/StorageHelper';

export default function LocationScreen() {
  const [userLocation, setUserLocation] = useState(null);
  const [safeZones, setSafeZones] = useState([]);
  const [unsafeZones, setUnsafeZones] = useState([]);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Location permission denied');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setUserLocation(location.coords);

      const zones = await loadSafeZones();
      setSafeZones(zones);

      // Mock unsafe zones (500m away from user)
      if (location.coords) {
        setUnsafeZones([
          {
            id: 'unsafe1',
            latitude: location.coords.latitude + 0.0045, // ~500m north
            longitude: location.coords.longitude,
            radius: 100,
          },
          {
            id: 'unsafe2',
            latitude: location.coords.latitude - 0.0045, // ~500m south
            longitude: location.coords.longitude,
            radius: 100,
          },
        ]);
      }
    })();
  }, []);

  return (
    <View style={styles.container}>
      {userLocation ? (
        <>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
          >
            <Marker
              coordinate={{
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
              }}
              title="Your Location"
              pinColor="blue"
            />
            {safeZones.map((zone) => (
              <Circle
                key={zone.id}
                center={{
                  latitude: zone.latitude,
                  longitude: zone.longitude,
                }}
                radius={zone.radius}
                strokeColor="rgba(0, 255, 0, 0.5)"
                fillColor="rgba(0, 255, 0, 0.2)"
              />
            ))}
            {unsafeZones.map((zone) => (
              <Circle
                key={zone.id}
                center={{
                  latitude: zone.latitude,
                  longitude: zone.longitude,
                }}
                radius={zone.radius}
                strokeColor="rgba(255, 0, 0, 0.5)"
                fillColor="rgba(255, 0, 0, 0.2)"
              />
            ))}
          </MapView>
          <View style={styles.legend}>
            <Text style={styles.legendText}>Green: Safe Zones</Text>
            <Text style={styles.legendText}>Red: Unsafe Zones</Text>
          </View>
        </>
      ) : (
        <Text>Loading location...</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  legend: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  legendText: { fontSize: 14, color: '#000', fontWeight: '500' },
});