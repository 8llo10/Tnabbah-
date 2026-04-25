import { Stack } from "expo-router";
import { AuthProvider } from "../providers/AuthProvider";
import { ThemeProvider, DarkTheme, DefaultTheme } from "@react-navigation/native";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: "fade",
            animationDuration: 250,
            contentStyle: {
              backgroundColor: "#F8EEEE",
            },
          }}
        >
          <Stack.Screen name="(tabs)" />
        </Stack>

        <StatusBar style="auto" />
      </ThemeProvider>
    </AuthProvider>
  );
}