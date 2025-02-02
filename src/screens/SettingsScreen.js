// ./src/screens/SettingsScreen.js
import React from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';

export default function SettingsScreen({ isDarkMode, toggleDarkMode }) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Dark Mode</Text>
      <Switch 
        value={isDarkMode} 
        onValueChange={toggleDarkMode} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  label: {
    fontSize: 18,
    marginBottom: 10,
  },
});
