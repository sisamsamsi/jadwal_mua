import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { View, Platform, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Plus } from "lucide-react-native";


export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#B76E79",
        tabBarInactiveTintColor: "#BDBDBD",
        tabBarHideOnKeyboard: true,
        tabBarStyle: { 
          height: Platform.OS === 'ios' ? 64 + insets.bottom : 70 + (insets.bottom > 0 ? insets.bottom - 10 : 0), 
          paddingBottom: Platform.OS === 'ios' ? insets.bottom : (insets.bottom > 0 ? insets.bottom : 12),
          paddingTop: 8,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          elevation: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -10 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          marginBottom: 4,
        }
      }}
    >
      <Tabs.Screen 
        name="home" 
        options={{ 
          title: "Home", 
          tabBarIcon: ({ color }) => <Ionicons name="home-sharp" size={22} color={color} /> 
        }} 
      />
      <Tabs.Screen 
        name="calendar" 
        options={{ 
          title: "Jadwal", 
          tabBarIcon: ({ color }) => <Ionicons name="calendar-sharp" size={22} color={color} /> 
        }} 
      />
      
      <Tabs.Screen 
        name="plus" 
        options={{ 
          title: "",
          tabBarButton: ({ delayLongPress, ...props }: any) => (
            <TouchableOpacity 
              {...props}
              activeOpacity={0.9}
              onPress={() => router.push("/booking/new")}
              style={{
                top: -15,
                justifyContent: 'center',
                alignItems: 'center',
                width: 65,
              }}
            >
               <View style={{
                 width: 56,
                 height: 56,
                 borderRadius: 28,
                 backgroundColor: '#B76E79',
                 justifyContent: 'center',
                 alignItems: 'center',
                 shadowColor: '#B76E79',
                 shadowOffset: { width: 0, height: 6 },
                 shadowOpacity: 0.4,
                 shadowRadius: 12,
                 elevation: 10,
               }}>
                 <Plus size={30} color="white" />
               </View>
            </TouchableOpacity>
          )
        }} 
      />

      <Tabs.Screen 
        name="clients" 
        options={{ 
          title: "Klien", 
          tabBarIcon: ({ color }) => <Ionicons name="people-sharp" size={22} color={color} /> 
        }} 
      />
      <Tabs.Screen 
        name="finance" 
        options={{ 
          title: "Uang", 
          tabBarIcon: ({ color }) => <Ionicons name="wallet-sharp" size={22} color={color} /> 
        }} 
      />
      
      {/* Sembunyikan profile dari bottom bar agar tidak sempit */}
      <Tabs.Screen 
        name="profile" 
        options={{ 
          href: null,
        }} 
      />
    </Tabs>
  );
}

