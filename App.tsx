import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StatusBar } from "expo-status-bar";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { COLORS, RADII } from "./src/constants";
import { FONT_FAMILY, loadAppFonts } from "./src/constants/fonts";
import { FONT_SCALE_RANGE } from "./src/constants/typography";
import { initializeI18n } from "./src/i18n";
import { useTranslation } from "react-i18next";
import { DoodhProvider, useDoodhContext } from "./src/context/DoodhContext";
import {
  FontScaleProvider,
  useFontScale,
} from "./src/context/FontScaleContext";
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
        tabBarInactiveTintColor: COLORS.muted,
        tabBarStyle: {
          height: 64 + insets.bottom,
          paddingTop: 6,
          paddingBottom: Math.max(insets.bottom, 8),
          backgroundColor: COLORS.background,
          borderTopWidth: 0,
          borderTopLeftRadius: RADII.card,
          borderTopRightRadius: RADII.card,
          shadowColor: "#0F172A",
          shadowOpacity: 0.08,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: -4 },
          elevation: 12,
        },
        tabBarItemStyle: {
          borderRadius: RADII.control,
        },
        tabBarLabelStyle: {
          fontFamily: FONT_FAMILY.bold,
          fontSize: typography.caption,
          marginBottom: 2,
        },
        tabBarLabel: t(`navigation.${route.name.toLowerCase()}`),
        tabBarIcon: ({ focused, color, size }) => {
          const iconName =
            {
              Home: focused ? "home" : "home-outline",
              Entries: focused ? "clipboard-text" : "clipboard-text-outline",
              Reports: focused ? "chart-box" : "chart-box-outline",
              Settings: focused ? "cog" : "cog-outline",
            }[route.name] || "circle";

          return (
            <MaterialCommunityIcons
              name={iconName as any}
              size={size ?? 24}
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
    <Stack.Navigator
      initialRouteName="Welcome"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="MainTabs" component={Tabs} />
      <Stack.Screen
        name="EntryForm"
        component={EntryFormScreen}
        options={{
          presentation: "transparentModal",
          animation: "none",
          cardOverlayEnabled: false,
          gestureEnabled: false,
        }}
      />
    </Stack.Navigator>
  );
}

export default function App() {
  const [fontsLoaded] = loadAppFonts();
  const [initialFontScale, setInitialFontScale] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([initializeI18n(), getStoredFontScale()]).then(([, scale]) =>
      setInitialFontScale(scale ?? FONT_SCALE_RANGE.default),
    );
  }, []);

  if (!fontsLoaded || initialFontScale === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.brand} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <FontScaleProvider initialScale={initialFontScale}>
        <DoodhProvider>
          <SnackbarProvider>
            <NavigationContainer>
              <MainNavigator />
            </NavigationContainer>
          </SnackbarProvider>
        </DoodhProvider>
      </FontScaleProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
});
