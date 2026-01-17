import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { User, BookOpen, Calendar, Home } from 'lucide-react-native';
import HomeScreen from '../screens/main/HomeScreen';
import AcademicScreen from '../screens/main/AcademicScreen';
import ScheduleScreen from '../screens/main/ScheduleScreen';
import DashboardScreen from '../screens/main/DashboardScreen';

const Tab = createBottomTabNavigator();

const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
          borderTopWidth: 1,
          borderTopColor: '#f1f5f9',
          elevation: 0, // hapus shadow di android
          backgroundColor: '#ffffff',
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        }
      }}
    >
      <Tab.Screen 
        name="Beranda" 
        component={DashboardScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tab.Screen 
        name="Akademik" 
        component={AcademicScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <BookOpen color={color} size={size} />,
        }}
      />
      <Tab.Screen 
        name="Jadwal" 
        component={ScheduleScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <Calendar color={color} size={size} />,
        }}
      />
      <Tab.Screen 
        name="Profil" 
        component={HomeScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;
