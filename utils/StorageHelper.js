import AsyncStorage from '@react-native-async-storage/async-storage';

// Save contacts to AsyncStorage
const saveContacts = async (contacts) => {
  try {
    await AsyncStorage.setItem('contacts', JSON.stringify(contacts));
    console.log('Contacts saved:', contacts);
  } catch (error) {
    console.error('Error saving contacts:', error);
  }
};

// Load contacts from AsyncStorage
const loadContacts = async () => {
  try {
    const contacts = await AsyncStorage.getItem('contacts');
    return contacts ? JSON.parse(contacts) : [];
  } catch (error) {
    console.error('Error loading contacts:', error);
    return [];
  }
};

// Save offline SOS alerts to AsyncStorage
const saveOfflineSOS = async (alert) => {
  try {
    const offlineAlerts = await AsyncStorage.getItem('offlineAlerts');
    const alerts = offlineAlerts ? JSON.parse(offlineAlerts) : [];
    alerts.push(alert);
    await AsyncStorage.setItem('offlineAlerts', JSON.stringify(alerts));
    console.log('Offline SOS saved:', alert);
  } catch (error) {
    console.error('Error saving offline SOS:', error);
  }
};

// Load offline SOS alerts from AsyncStorage
const loadOfflineSOS = async () => {
  try {
    const offlineAlerts = await AsyncStorage.getItem('offlineAlerts');
    return offlineAlerts ? JSON.parse(offlineAlerts) : [];
  } catch (error) {
    console.error('Error loading offline SOS:', error);
    return [];
  }
};

// Clear offline SOS alerts from AsyncStorage
const clearOfflineSOS = async () => {
  try {
    await AsyncStorage.removeItem('offlineAlerts');
    console.log('Offline SOS alerts cleared');
  } catch (error) {
    console.error('Error clearing offline SOS:', error);
  }
};

// Save safe zones to AsyncStorage
const saveSafeZones = async (safeZones) => {
  try {
    await AsyncStorage.setItem('safeZones', JSON.stringify(safeZones));
    console.log('Safe zones saved:', safeZones);
  } catch (error) {
    console.error('Error saving safe zones:', error);
  }
};

// Load safe zones from AsyncStorage
const loadSafeZones = async () => {
  try {
    const safeZones = await AsyncStorage.getItem('safeZones');
    return safeZones ? JSON.parse(safeZones) : [];
  } catch (error) {
    console.error('Error loading safe zones:', error);
    return [];
  }
};

// Save companion requests to AsyncStorage
const saveCompanionRequest = async (request) => {
  try {
    const requests = await AsyncStorage.getItem('companionRequests');
    const requestList = requests ? JSON.parse(requests) : [];
    requestList.push(request);
    await AsyncStorage.setItem('companionRequests', JSON.stringify(requestList));
    console.log('Companion request saved:', request);
  } catch (error) {
    console.error('Error saving companion request:', error);
  }
};

// Load companion requests from AsyncStorage
const loadCompanionRequests = async () => {
  try {
    const requests = await AsyncStorage.getItem('companionRequests');
    return requests ? JSON.parse(requests) : [];
  } catch (error) {
    console.error('Error loading companion requests:', error);
    return [];
  }
};

// Save geo-fence exit events to AsyncStorage
const saveGeoFenceExit = async (exitEvent) => {
  try {
    const exits = await AsyncStorage.getItem('geoFenceExits');
    const exitList = exits ? JSON.parse(exits) : [];
    exitList.push(exitEvent);
    await AsyncStorage.setItem('geoFenceExits', JSON.stringify(exitList));
    console.log('Geo-fence exit saved:', exitEvent);
  } catch (error) {
    console.error('Error saving geo-fence exit:', error);
  }
};

// Load geo-fence exit events from AsyncStorage
const loadGeoFenceExits = async () => {
  try {
    const exits = await AsyncStorage.getItem('geoFenceExits');
    return exits ? JSON.parse(exits) : [];
  } catch (error) {
    console.error('Error loading geo-fence exits:', error);
    return [];
  }
};



export {
  saveContacts,
  loadContacts,
  saveOfflineSOS,
  loadOfflineSOS,
  clearOfflineSOS,
  saveSafeZones,
  loadSafeZones,
  saveCompanionRequest,
  loadCompanionRequests,
  saveGeoFenceExit,
  loadGeoFenceExits,
  
};