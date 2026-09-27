import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { COLORS } from "./src/constants";
import { FONT_SCALE_RANGE } from "./src/constants/typography";
import { initializeI18n } from "./src/i18n";
import { useTranslation } from "react-i18next";
import { DoodhProvider, useDoodhContext } from "./src/context/DoodhContext";
import { FontScaleProvider, useFontScale } from "./src/context/FontScaleContext";
import { MainTabParamList, RootStackParamList } from "./src/types";
import HomeScreen from "./src/screens/HomeScreen";
import EntriesScreen from "./src/screens/EntriesScreen";
import ReportsScreen from "./src/screens/ReportsScreen";
import SettingsScreen from "./src/screens/SettingsScreen";
import EntryFormScreen from "./src/screens/EntryFormScreen";
import WelcomeScreen from "./src/screens/WelcomeScreen";
import { getStoredFontScale } from "./src/utils/storageManager";
import { SnackbarProvider } from "./src/context/SnackbarContext";

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function Tabs() {
  const { t } = useTranslation();
  const { typography } = useFontScale();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.brand,
        tabBarInactiveTintColor: "#64748B",
        tabBarStyle: {
          height: 64 + insets.bottom,
          paddingTop: 6,
          paddingBottom: Math.max(insets.bottom, 8),
          backgroundColor: "#ffffff",
          borderTopWidth: 1,
          borderTopColor: "#E2E8F0",
        },
        tabBarLabelStyle: {
          fontSize: typography.micro,
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
    <Stack.Navigator initialRouteName="Welcome" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="MainTabs" component={Tabs} />
      <Stack.Screen name="EntryForm" component={EntryFormScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  const [initialFontScale, setInitialFontScale] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([initializeI18n(), getStoredFontScale()]).then(([, scale]) =>
      setInitialFontScale(scale ?? FONT_SCALE_RANGE.default),
    );
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {initialFontScale !== null ? (
        <FontScaleProvider initialScale={initialFontScale}>
          <DoodhProvider>
            <SnackbarProvider>
              <NavigationContainer>
                <MainNavigator />
              </NavigationContainer>
            </SnackbarProvider>
          </DoodhProvider>
        </FontScaleProvider>
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
