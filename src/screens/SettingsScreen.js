// ./src/screens/SettingsScreen.js
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Switch, 
  StyleSheet, 
  Button, 
  Alert,
  ScrollView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Slider from '@react-native-community/slider';

export default function SettingsScreen({ isDarkMode, toggleDarkMode }) {
  const [fontSize, setFontSize] = useState(18);

  


  const clearCacheAndData = async () => {
    try {
      await AsyncStorage.clear();
      Alert.alert('Success', 'Cache & Data cleared successfully.');
    } catch (error) {
      Alert.alert('Error', 'Failed to clear cache & data.');
      console.error('Error clearing AsyncStorage:', error);
    }
  };

  const textColor = isDarkMode ? '#fff' : '#000';

  return (
    <ScrollView style={[styles.container, isDarkMode && styles.darkContainer]}>
      {/* Appearance Section */}
      <Text style={[styles.sectionHeader, { color: textColor }]}>
        Appearance
      </Text>
      <View style={styles.settingRow}>
        <Text style={[styles.label, { fontSize, color: textColor }]}>
          Dark Mode
        </Text>
        <Switch 
          value={isDarkMode} 
          onValueChange={toggleDarkMode} 
        />
      </View>

      {/* General Section */}
      <Text style={[styles.sectionHeader, { color: textColor }]}>
        General
      </Text>
      <View style={styles.buttonContainer}>
        <Button 
          title="Clear Cache & Data"
          onPress={clearCacheAndData}
          color="#FF3B30"
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20,
    backgroundColor: '#fff'
  },
  darkContainer: {
    backgroundColor: '#121212',
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingBottom: 5,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 15,
  },
  label: {
    fontSize: 18,
  },
  slider: {
    width: '100%',
    height: 40,
    marginBottom: 30,
  },
  buttonContainer: {
    marginTop: 10,
    marginBottom: 30,
  },
});
