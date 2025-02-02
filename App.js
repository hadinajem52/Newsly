// App.js
import React, { useState, useEffect } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import HomeScreen from './src/screens/HomeScreen';
import CategoriesScreen from './src/screens/CategoriesScreen'; 
import StocksScreen from './src/screens/StocksScreen'; 
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

  const loadDarkModeSetting = async () => {
    try {
      const savedSetting = await AsyncStorage.getItem('@darkMode');
      if (savedSetting !== null) {
        setIsDarkMode(savedSetting === 'true');
      }
    } catch (error) {
      console.error('Failed to load dark mode setting:', error);
    }
  };

  const toggleDarkMode = async () => {
    try {
      const newValue = !isDarkMode;
      setIsDarkMode(newValue);
      await AsyncStorage.setItem('@darkMode', newValue.toString());
    } catch (error) {
      console.error('Failed to save dark mode setting:', error);
    }
  };

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
              iconName = 'logo-bitcoin'; 
            } else if (route.name === 'Stocks') {
              iconName = 'bar-chart-outline'; 
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
