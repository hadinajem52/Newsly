// navbar.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen';
import CategoriesScreen from '../screens/CategoriesScreen';
import StocksScreen from '../screens/StocksScreen'; 
import SavedArticlesScreen from '../screens/SavedArticlesScreen';

const Tab = createBottomTabNavigator();

export default function BottomNavBar() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === 'Home') {
            iconName = 'home-outline';
          } else if (route.name === 'Categories') {
            iconName = 'logo-bitcoin';
          } else if (route.name === 'Stocks') {
            iconName = 'bar-chart-outline';
          } else if (route.name === 'Saved Articles') {
            iconName = 'bookmark-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Categories" component={CategoriesScreen} />
      <Tab.Screen name="Stocks" component={StocksScreen} />
      <Tab.Screen name="Saved Articles" component={SavedArticlesScreen} />
    </Tab.Navigator>
  );
}
