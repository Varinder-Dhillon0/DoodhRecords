import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { COLORS } from "./src/constants";
import { initializeI18n } from "./src/i18n";
import { useTranslation } from "react-i18next";
import { DoodhProvider, useDoodhContext } from "./src/context/DoodhContext";
import { MainTabParamList, RootStackParamList } from "./src/types";
import HomeScreen from "./src/screens/HomeScreen";
import EntriesScreen from "./src/screens/EntriesScreen";
import ReportsScreen from "./src/screens/ReportsScreen";
import SettingsScreen from "./src/screens/SettingsScreen";
import EntryFormScreen from "./src/screens/EntryFormScreen";

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function Tabs() {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.brand,
        tabBarInactiveTintColor: "#64748B",
        tabBarStyle: {
          height: 64,
          paddingTop: 6,
          paddingBottom: 8,
          backgroundColor: "#ffffff",
          borderTopWidth: 1,
          borderTopColor: "#E2E8F0",
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
          marginBottom: 2,
        },
        tabBarLabel: t(`navigation.${route.name.toLowerCase()}`),
        tabBarIcon: ({ color, size }) => {
          const iconName =
            {
              Home: "home-variant",
              Entries: "clipboard-text",
              Reports: "chart-box",
              Settings: "cog",
            }[route.name] || "circle";

          return (
            <MaterialCommunityIcons
              name={iconName as any}
              size={size ?? 22}
              color={color}
            />
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Entries" component={EntriesScreen} />
      <Tab.Screen name="Reports" component={ReportsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

function MainNavigator() {
  const { isLoading } = useDoodhContext();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.brand} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={Tabs} />
      <Stack.Screen name="EntryForm" component={EntryFormScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  const [isI18nReady, setIsI18nReady] = useState(false);

  useEffect(() => {
    initializeI18n().then(() => setIsI18nReady(true));
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {isI18nReady ? (
        <DoodhProvider>
          <NavigationContainer>
            <MainNavigator />
          </NavigationContainer>
        </DoodhProvider>
      ) : (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.brand} />
        </View>
      )}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
});
