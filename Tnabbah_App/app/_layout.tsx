import { Stack } from "expo-router";
import { AuthProvider } from "../providers/AuthProvider";
import * as SplashScreen from "expo-splash-screen";
import { Asset } from "expo-asset";

import {
  ThemeProvider as NavigationThemeProvider,
  DarkTheme,
  DefaultTheme,
} from "@react-navigation/native";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
import { useEffect, useState } from "react";

const APP_BACKGROUND = "#EFE7DE";

SplashScreen.preventAutoHideAsync();

const LightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: APP_BACKGROUND,
    card: APP_BACKGROUND,
    border: "transparent",
    text: "#111111",
    primary: "#871B17",
    notification: "#871B17",
  },
};

const AppDarkTheme = {
  ...DarkTheme,
  dark: false,
  colors: {
    ...DarkTheme.colors,
    background: APP_BACKGROUND,
    card: APP_BACKGROUND,
    border: "transparent",
    text: "#111111",
    primary: "#871B17",
    notification: "#871B17",
  },
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function prepareApp() {
      try {
        await Asset.loadAsync([
          require("../assets/images/start-background.png"),
          require("../assets/images/logo-arabic.png"),
          require("../assets/images/logo-english.png"),
          require("../assets/images/splash-logo.png"),
        ]);
      } catch (error) {
        console.warn("Asset loading error:", error);
      } finally {
        if (mounted) {
          setAppIsReady(true);
          
        }
      }
    }

    prepareApp();

    return () => {
      mounted = false;
    };
  }, []);

  if (!appIsReady) {
    return <View style={styles.root} />;
  }

  return (
    <View style={styles.root}>
      <AuthProvider>
        <NavigationThemeProvider
          value={colorScheme === "dark" ? AppDarkTheme : LightTheme}
        >
          <Stack
  screenOptions={{
    headerShown: false,
    animation: "none",
    contentStyle: {
      backgroundColor: "#FFFFFF",
    },
  }}
>
            <Stack.Screen name="index" />
            <Stack.Screen name="start" />
            <Stack.Screen name="login" />
            <Stack.Screen name="register" />
            <Stack.Screen name="forgot-password" />

            <Stack.Screen name="connection-intro" />
            <Stack.Screen name="bluetooth-setup" />
            <Stack.Screen name="connection-success" />

            <Stack.Screen name="auth/reset-password" />
            <Stack.Screen name="auth/new-password" />

            <Stack.Screen name="(tabs)" />
          </Stack>

          <StatusBar style="dark" translucent backgroundColor="transparent" />
        </NavigationThemeProvider>
      </AuthProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: APP_BACKGROUND,
  },
});