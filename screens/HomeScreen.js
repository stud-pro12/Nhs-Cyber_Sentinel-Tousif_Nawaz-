import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import * as Progress from 'react-native-progress';
import { loadGeoFenceExits } from '../utils/StorageHelper';

export default function HomeScreen() {
  const [safetyScore, setSafetyScore] = useState(100);

  useEffect(() => {
    (async () => {
      const exits = await loadGeoFenceExits();
      // Calculate score: 100 - 5 * number of exits in last 7 days
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const recentExits = exits.filter(
        (exit) => new Date(exit.timestamp) >= oneWeekAgo
      );
      const score = Math.max(0, 100 - 5 * recentExits.length);
      setSafetyScore(score);
    })();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>GuardianPulse X</Text>
      <Text style={styles.subtitle}>Weekly Safety Score</Text>
      <Progress.Circle
        progress={safetyScore / 100}
        size={150}
        thickness={10}
        color="#007AFF"
        unfilledColor="#E0E0E0"
        borderWidth={0}
        textStyle={styles.scoreText}
        showsText
        formatText={() => `${safetyScore}/100`}
      />
      <Text style={styles.info}>
        Your safety score is based on how often you exit safe zones. Stay safe!
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20 },
  subtitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  scoreText: { fontSize: 24, fontWeight: 'bold', color: '#007AFF' },
  info: { fontSize: 16, textAlign: 'center', color: '#666', marginTop: 20 },
});