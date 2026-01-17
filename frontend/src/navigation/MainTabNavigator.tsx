import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { User, BookOpen, Calendar, Home } from 'lucide-react-native';
import { View, Platform } from 'react-native';
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
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: '#2563eb', // Blue-600
        tabBarInactiveTintColor: '#94a3b8', // Slate-400
        tabBarShowLabel: true,
        tabBarStyle: {
          position: 'absolute',
          bottom: 20,
          left: 20,
          right: 20,
          elevation: 5,
          backgroundColor: '#ffffff',
          borderRadius: 20,
          height: 70,
          paddingBottom: 10,
          paddingTop: 10,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 4,
          },
          shadowOpacity: 0.1,
          shadowRadius: 10,
          borderTopWidth: 0,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginBottom: 0,
        },
        tabBarItemStyle: {
          // paddingVertical: 5,
        }
      }}
    >
      <Tab.Screen 
        name="Beranda" 
        component={DashboardScreen} 
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <View className={`p-2 rounded-xl ${focused ? 'bg-blue-50' : 'bg-transparent'}`}>
              <Home color={color} size={22} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tab.Screen 
        name="Akademik" 
        component={AcademicScreen} 
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <View className={`p-2 rounded-xl ${focused ? 'bg-blue-50' : 'bg-transparent'}`}>
              <BookOpen color={color} size={22} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tab.Screen 
        name="Jadwal" 
        component={ScheduleScreen} 
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <View className={`p-2 rounded-xl ${focused ? 'bg-blue-50' : 'bg-transparent'}`}>
              <Calendar color={color} size={22} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tab.Screen 
        name="Profil" 
        component={HomeScreen} 
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <View className={`p-2 rounded-xl ${focused ? 'bg-blue-50' : 'bg-transparent'}`}>
              <User color={color} size={22} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;
