import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import * as Location from 'expo-location';
import * as SMS from 'expo-sms';
import { Audio } from 'expo-av';
import * as Network from 'expo-network';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveSOSAlert } from '../utils/StorageHelper';

export default function EmotionScreen() {
  const [hasCameraPermission, setHasCameraPermission] = useState(null);
  const [hasAudioPermission, setHasAudioPermission] = useState(null);
  const [hasLocationPermission, setHasLocationPermission] = useState(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [location, setLocation] = useState(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [contacts, setContacts] = useState([]);
  const cameraRef = useRef(null);
  const recordingRef = useRef(null);

  console.log('Camera module:', Camera);
  console.log('CameraView module:', CameraView);
  console.log('Permissions state:', { camera: hasCameraPermission, audio: hasAudioPermission, location: hasLocationPermission });
  console.log('Camera ready state:', isCameraReady);

  useEffect(() => {
    (async () => {
      try {
        console.log('Requesting camera permission...');
        const cameraStatus = await Camera.requestCameraPermissionsAsync();
        console.log('Camera permission result:', cameraStatus);
        setHasCameraPermission(cameraStatus.status === 'granted');

        console.log('Requesting audio permission...');
        const audioStatus = await Audio.requestPermissionsAsync();
        console.log('Audio permission result:', audioStatus);
        setHasAudioPermission(audioStatus.status === 'granted');

        console.log('Requesting location permission...');
        const { status } = await Location.requestForegroundPermissionsAsync();
        console.log('Location permission result:', status);
        setHasLocationPermission(status === 'granted');
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({});
          setLocation(loc);
        }
      } catch (error) {
        console.log('Permission request error:', error);
        Alert.alert('Error', 'Failed to request permissions: ' + error.message);
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

  const toggleDetection = async () => {
    if (!isDetecting) {
      if (!hasCameraPermission || !hasAudioPermission || !hasLocationPermission) {
        Alert.alert('Error', 'Camera, microphone, and location permissions are required.');
        return;
      }

      try {
        const recording = new Audio.Recording();
        await recording.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
        await recording.startAsync();
        recordingRef.current = recording;

        recording.setOnRecordingStatusUpdate((status) => {
          const amplitude = status.metering;
          if (amplitude && amplitude > -10) {
            triggerSOS('Loud sound detected');
          }
        });
      } catch (error) {
        Alert.alert('Error', 'Failed to start audio recording: ' + error.message);
      }

      setIsDetecting(true);
    } else {
      if (recordingRef.current) {
        await recordingRef.current.stopAndUnloadAsync();
        recordingRef.current = null;
      }
      setIsDetecting(false);
    }
  };

  const handleFacesDetected = ({ faces }) => {
    if (isDetecting && faces.length > 0) {
      const face = faces[0];
      if (face.mouthOpenProbability && face.mouthOpenProbability > 0.7) {
        triggerSOS('Distressed face detected');
      }
    }
  };

  const triggerSOS = async (reason) => {
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

      const message = `SOS! ${reason}. My location: Lat ${location.coords.latitude}, Lon ${location.coords.longitude}`;

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
        const saved = await saveSOSAlert(reason, location);
        if (saved) {
          Alert.alert('Offline', 'SOS saved locally. Will sync when online.');
        } else {
          Alert.alert('Error', 'Failed to save SOS locally.');
        }
      }
      toggleDetection();
    } catch (error) {
      console.log('SOS error:', error);
      Alert.alert('Error', 'Failed to process SOS: ' + error.message);
    }
  };

  if (hasCameraPermission === null || hasAudioPermission === null || hasLocationPermission === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.status}>Requesting permissions...</Text>
        <Text style={styles.status}>Check console logs for details.</Text>
      </View>
    );
  }

  if (hasCameraPermission === false || hasAudioPermission === false || hasLocationPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.status}>
          Missing permissions:
          {!hasCameraPermission && ' Camera'}
          {!hasAudioPermission && ' Microphone'}
          {!hasLocationPermission && ' Location'}
        </Text>
        <Text style={styles.status}>Please enable in phone settings.</Text>
      </View>
    );
  }

  console.log('Rendering CameraView with props:', { facing: 'front', ref: cameraRef, isDetecting });

  return (
    <View style={styles.container}>
      <Text style={styles.status}>
        {isCameraReady ? 'Camera active' : 'Camera loading...'}
      </Text>
      <CameraView
        style={styles.camera}
        facing="front"
        ref={cameraRef}
        enableTorch={false}
        mute={true}
        onCameraReady={() => {
          console.log('CameraView is ready');
          setIsCameraReady(true);
        }}
        onMountError={(error) => console.log('CameraView mount error:', error)}
        onFacesDetected={isDetecting ? handleFacesDetected : null}
        faceDetectorSettings={{
          mode: 'fast',
          detectLandmarks: 'all',
          runClassifications: 'all',
        }}
      />
      {!isCameraReady && (
        <Text style={styles.status}>If camera doesn’t show, check logs or restart Expo Go.</Text>
      )}
      <Text style={styles.status}>
        {isDetecting ? 'Detecting distress...' : 'Detection off'}
      </Text>
      <TouchableOpacity
        style={[styles.toggleButton, isDetecting ? styles.stopButton : styles.startButton]}
        onPress={toggleDetection}
      >
        <Text style={styles.toggleButtonText}>
          {isDetecting ? 'Stop Detection' : 'Start Detection'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    width: '100%',
    height: '60%',
    alignSelf: 'center',
  },
  status: {
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
    marginVertical: 10,
  },
  toggleButton: {
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    margin: 20,
  },
  startButton: {
    backgroundColor: '#28a745',
  },
  stopButton: {
    backgroundColor: '#dc3545',
  },
  toggleButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});