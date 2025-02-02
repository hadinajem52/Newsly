// App.js
import React, { useState, useEffect } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import your screens
import HomeScreen from './src/screens/HomeScreen';
import CategoriesScreen from './src/screens/CategoriesScreen'; // Crypto screen
import StocksScreen from './src/screens/StocksScreen'; // New Stocks screen
import SavedArticlesScreen from './src/screens/SavedArticlesScreen';
import ArticleDetailsScreen from './src/screens/ArticleDetailsScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="HomeScreen" 
        component={HomeScreen} 
        options={{ title: 'Briefing' }} 
      />
      <Stack.Screen 
        name="ArticleDetails" 
        component={ArticleDetailsScreen} 
        options={{ title: 'Article' }} 
      />
    </Stack.Navigator>
  );
}

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Function to load the dark mode setting from AsyncStorage
  const loadDarkModeSetting = async () => {
    try {
      const savedSetting = await AsyncStorage.getItem('@darkMode');
      if (savedSetting !== null) {
        // AsyncStorage stores values as strings, so convert to boolean
        setIsDarkMode(savedSetting === 'true');
      }
    } catch (error) {
      console.error('Failed to load dark mode setting:', error);
    }
  };

  // Function to toggle dark mode and persist the setting
  const toggleDarkMode = async () => {
    try {
      const newValue = !isDarkMode;
      setIsDarkMode(newValue);
      await AsyncStorage.setItem('@darkMode', newValue.toString());
    } catch (error) {
      console.error('Failed to save dark mode setting:', error);
    }
  };

  // Load the setting when the component mounts
  useEffect(() => {
    loadDarkModeSetting();
  }, []);

  const navTheme = isDarkMode ? DarkTheme : DefaultTheme;

  return (
    <NavigationContainer theme={navTheme}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ color, size }) => {
            let iconName;
            if (route.name === 'Home') {
              iconName = 'home-outline';
            } else if (route.name === 'Crypto') {
              iconName = 'logo-bitcoin'; // Crypto-related icon
            } else if (route.name === 'Stocks') {
              iconName = 'bar-chart-outline'; // Stocks-related icon
            } else if (route.name === 'Saved Articles') {
              iconName = 'bookmark-outline';
            } else if (route.name === 'Settings') {
              iconName = 'settings-outline';
            }
            return <Ionicons name={iconName} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Home" component={HomeStack} />
        <Tab.Screen name="Crypto" component={CategoriesScreen} />
        <Tab.Screen name="Stocks" component={StocksScreen} />
        <Tab.Screen name="Saved Articles" component={SavedArticlesScreen} />
        <Tab.Screen name="Settings">
          {() => (
            <SettingsScreen 
              isDarkMode={isDarkMode} 
              toggleDarkMode={toggleDarkMode} 
            />
          )}
        </Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  );
}
