import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import * as Location from 'expo-location';
import * as SMS from 'expo-sms';
import * as Network from 'expo-network';
import { Accelerometer } from 'expo-sensors';
import { sendWhatsAppSOS } from '../utils/WhatsAppHelper';
import { saveSOSAlert } from '../utils/StorageHelper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming } from 'react-native-reanimated';

export default function SOSScreen() {
  const [location, setLocation] = useState(null);
  const [hasLocationPermission, setHasLocationPermission] = useState(null);
  const [accelerometerData, setAccelerometerData] = useState({ x: 0, y: 0, z: 0 });
  const [isShakeEnabled, setIsShakeEnabled] = useState(true);
  const [contacts, setContacts] = useState([]);

  // Animation
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  useEffect(() => {
    scale.value = withRepeat(
      withTiming(1.2, { duration: 1000 }),
      -1,
      true
    );
  }, []);

  useEffect(() => {
    (async () => {
      try {
        console.log('Requesting location permission for SOS...');
        const { status } = await Location.requestForegroundPermissionsAsync();
        console.log('Location permission result:', status);
        setHasLocationPermission(status === 'granted');
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({});
          setLocation(loc);
        }
      } catch (error) {
        console.log('Location permission error:', error);
        Alert.alert('Error', 'Failed to request location permission: ' + error.message);
      }
    })();
  }, []);

  useEffect(() => {
    const loadContacts = async () => {
      try {
        const savedContacts = await AsyncStorage.getItem('emergencyContacts');
        if (savedContacts) {
          setContacts(JSON.parse(savedContacts));
        }
      } catch (error) {
        console.log('Error loading contacts:', error);
      }
    };
    loadContacts();
  }, []);

  // Shake detection
  useEffect(() => {
    let subscription;
    if (isShakeEnabled && hasLocationPermission && location) {
      Accelerometer.setUpdateInterval(100);
      subscription = Accelerometer.addListener((data) => {
        setAccelerometerData(data);
      });
    }
    return () => subscription && subscription.remove();
  }, [isShakeEnabled, hasLocationPermission, location]);

  useEffect(() => {
    const { x, y, z } = accelerometerData;
    const acceleration = Math.sqrt(x * x + y * y + z * z);
    if (acceleration > 2.5 && isShakeEnabled) {
      triggerWhatsAppSOS('Shake detected');
    }
  }, [accelerometerData, isShakeEnabled]);

  const triggerSMSOS = async () => {
    if (!hasLocationPermission) {
      Alert.alert('Error', 'Location permission required for SOS.');
      return;
    }
    if (!location) {
      Alert.alert('Error', 'Location not available.');
      return;
    }
    if (contacts.length === 0) {
      Alert.alert('Error', 'No emergency contacts added. Please add contacts in Settings.');
      return;
    }

    try {
      const networkState = await Network.getNetworkStateAsync();
      const isConnected = networkState.isConnected;
      console.log('Network state:', isConnected);

      const message = `SOS! Emergency triggered from SOS button. My location: Lat ${location.coords.latitude}, Lon ${location.coords.longitude}`;

      if (isConnected) {
        const isSMSSupported = await SMS.isAvailableAsync();
        if (!isSMSSupported) {
          Alert.alert('Error', 'SMS is not supported on this device.');
          return;
        }

        const phoneNumbers = contacts.map((contact) => contact.number);
        await SMS.sendSMSAsync(phoneNumbers, message);
        Alert.alert('Success', 'SOS message sent to all contacts!');
      } else {
        const saved = await saveSOSAlert('SOS button triggered', location);
        if (saved) {
          Alert.alert('Offline', 'SOS saved locally. Will sync when online.');
        } else {
          Alert.alert('Error', 'Failed to save SOS locally.');
        }
      }
    } catch (error) {
      console.log('SMS SOS error:', error);
      Alert.alert('Error', 'Failed to process SMS SOS: ' + error.message);
    }
  };

  const triggerWhatsAppSOS = async (reason) => {
    if (!hasLocationPermission) {
      Alert.alert('Error', 'Location permission required for SOS.');
      return;
    }
    if (!location) {
      Alert.alert('Error', 'Location not available.');
      return;
    }
    if (contacts.length === 0) {
      Alert.alert('Error', 'No emergency contacts added. Please add contacts in Settings.');
      return;
    }

    const contact = contacts[0]; // Use first contact for WhatsApp
    await sendWhatsAppSOS(reason, location, contact.number);
  };

  if (hasLocationPermission === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.status}>Requesting location permission...</Text>
      </View>
    );
  }

  if (hasLocationPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.status}>Location permission denied.</Text>
        <Text style={styles.status}>Please enable in phone settings.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SOS Emergency</Text>
      <Animated.View style={[styles.sosButtonContainer, animatedStyle]}>
        <TouchableOpacity style={styles.sosButton} onPress={triggerSMSOS}>
          <Text style={styles.sosButtonText}>SEND SOS</Text>
        </TouchableOpacity>
      </Animated.View>
      <Text style={styles.instructions}>
        Press the button to send an SMS alert or shake the device to send a WhatsApp SOS to your emergency contacts.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f8',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  sosButtonContainer: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sosButton: {
    backgroundColor: '#dc3545',
    width: '100%',
    height: '100%',
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  sosButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  instructions: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginTop: 10,
  },
  status: {
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
    marginVertical: 10,
  },
});