import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";

const ACTIVE = "#871B17";      // العودي للأيقونة المختارة
const INACTIVE = "#555555";    // رمادي غامق للأيقونات العادية
const BAR_BG = "#DADADA";      // رصاصي البيضاوي
const WHITE = "#FFFFFF";

function CustomTabBar({ state, descriptors, navigation }: any) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.tabBar}>
        {state.routes.map((route: any, index: number) => {
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const getIconName = () => {
            if (route.name === "home") {
              return isFocused ? "home" : "home-outline";
            }

            if (route.name === "chatbot") {
              return isFocused ? "sparkles" : "sparkles-outline";
            }

            if (route.name === "wallet") {
              return isFocused ? "wallet" : "wallet-outline";
            }

            if (route.name === "settings") {
              return isFocused ? "settings" : "settings-outline";
            }

            return "ellipse-outline";
          };

          const getLabel = () => {
            if (route.name === "home") return "الرئيسية";
            if (route.name === "chatbot") return "المساعد";
            if (route.name === "wallet") return "المحفظة";
            if (route.name === "settings") return "الإعدادات";
            return route.name;
          };

          return (
            <TouchableOpacity
              key={route.key}
              activeOpacity={0.85}
              onPress={onPress}
              style={styles.tabButton}
            >
              {isFocused ? (
                <View style={styles.activeContainer}>
                  <View style={styles.activeCircle}>
                    <Ionicons
                      name={getIconName() as any}
                      size={30}
                      color={WHITE}
                    />
                  </View>

                  <Text style={styles.activeLabel}>{getLabel()}</Text>
                </View>
              ) : (
                <View style={styles.inactiveContainer}>
                  <Ionicons
                    name={getIconName() as any}
                    size={29}
                    color={INACTIVE}
                  />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,

        // عشان البار ما يغطي محتوى الصفحات
        sceneStyle: {
          backgroundColor: "#FFFFFF",
          paddingBottom: 125,
        },
      }}
    >
      <Tabs.Screen name="home" options={{ title: "الرئيسية" }} />
      <Tabs.Screen name="chatbot" options={{ title: "المساعد" }} />
      <Tabs.Screen name="wallet" options={{ title: "المحفظة" }} />
      <Tabs.Screen name="settings" options={{ title: "الإعدادات" }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",

    // المسافة من حواف الشاشة
    left: 44,
    right: 44,
    bottom: 24,

    height: 92,
    justifyContent: "flex-end",
  },

  tabBar: {
    height: 66,
    borderRadius: 40,
    backgroundColor: BAR_BG,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",

    paddingHorizontal: 10,
    paddingTop: 6,
    paddingBottom: Platform.OS === "ios" ? 8 : 6,

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 8,
  },

  tabButton: {
    flex: 1,
    height: 90,
    justifyContent: "center",
    alignItems: "center",
  },

  inactiveContainer: {
    height: 60,
    justifyContent: "center",
    alignItems: "center",
  },

  activeContainer: {
    position: "absolute",
    top: -22,
    alignItems: "center",
    justifyContent: "center",
  },

  activeCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: ACTIVE,
    justifyContent: "center",
    alignItems: "center",

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 9,
  },

  activeLabel: {
    marginTop: 4,
    color: ACTIVE,
    fontSize: 12.5,
    fontWeight: "800",
    textAlign: "center",
    includeFontPadding: false,
  },
});