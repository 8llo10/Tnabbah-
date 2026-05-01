import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        // شكل البار
        tabBarStyle: {
          backgroundColor: "#f2f2f2", // رمادي فاتح
          borderTopWidth: 0,
          height: 70,
          paddingBottom: 10,
          paddingTop: 10,
        },

        // ألوان الأيقونات
        tabBarActiveTintColor: "#7a0f1f", // أحمر غامق عودي
        tabBarInactiveTintColor: "#999", // رمادي
      }}
    >

      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <Ionicons name="home-outline" size={26} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="chatbot"
        options={{
          title: "Chat",
          tabBarIcon: ({ color }) => (
            <Ionicons name="chatbubble-ellipses-outline" size={26} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="wallet"
        options={{
          title: "Wallet",
          tabBarIcon: ({ color }) => (
            <Ionicons name="wallet-outline" size={26} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => (
            <Ionicons name="settings-outline" size={26} color={color} />
          ),
        }}
      />

    </Tabs>
  );
}
