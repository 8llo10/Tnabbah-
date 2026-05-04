import { Tabs } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef } from "react";

const { width } = Dimensions.get("window");

const ACTIVE = "#871B17";
const INACTIVE = "#6F6F6F";

const BAR_BG = "rgba(238, 238, 238, 0.98)";
const BAR_BORDER = "rgba(170, 170, 170, 0.24)";
const INACTIVE_CIRCLE_BG = "rgba(130, 130, 130, 0.12)";

const BAR_SIDE_MARGIN = 20;
const BAR_INNER_PADDING = 8;

const BAR_WIDTH = width - BAR_SIDE_MARGIN * 2;
const AVAILABLE_WIDTH = BAR_WIDTH - BAR_INNER_PADDING * 2;
const TAB_SLOT_WIDTH = AVAILABLE_WIDTH / 4;

const ACTIVE_TAB_WIDTH = Math.min(92, TAB_SLOT_WIDTH - 2);
const INACTIVE_TAB_WIDTH = 44;

type IconPack = "ion" | "material";

function TabIcon({
  pack,
  name,
  size,
  color,
}: {
  pack: IconPack;
  name: any;
  size: number;
  color: string;
}) {
  if (pack === "material") {
    return <MaterialCommunityIcons name={name} size={size} color={color} />;
  }

  return <Ionicons name={name} size={size} color={color} />;
}

function AnimatedPillTab({
  focused,
  iconName,
  iconPack,
  label,
  onPress,
}: {
  focused: boolean;
  iconName: any;
  iconPack: IconPack;
  label: string;
  onPress: () => void;
}) {
  const widthAnim = useRef(
    new Animated.Value(focused ? ACTIVE_TAB_WIDTH : INACTIVE_TAB_WIDTH)
  ).current;

  const opacityAnim = useRef(new Animated.Value(focused ? 1 : 0)).current;
  const circleSizeAnim = useRef(new Animated.Value(focused ? 36 : 32)).current;
  const iconScaleAnim = useRef(new Animated.Value(focused ? 1.1 : 1)).current;
  const translateYAnim = useRef(new Animated.Value(focused ? -2 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(widthAnim, {
        toValue: focused ? ACTIVE_TAB_WIDTH : INACTIVE_TAB_WIDTH,
        useNativeDriver: false,
        friction: 9,
        tension: 85,
      }),

      Animated.timing(opacityAnim, {
        toValue: focused ? 1 : 0,
        duration: 150,
        useNativeDriver: false,
      }),

      Animated.spring(circleSizeAnim, {
        toValue: focused ? 36 : 32,
        useNativeDriver: false,
        friction: 9,
        tension: 85,
      }),

      Animated.spring(iconScaleAnim, {
        toValue: focused ? 1.1 : 1,
        useNativeDriver: false,
        friction: 9,
        tension: 85,
      }),

      Animated.spring(translateYAnim, {
        toValue: focused ? -2 : 0,
        useNativeDriver: false,
        friction: 9,
        tension: 85,
      }),
    ]).start();
  }, [
    focused,
    widthAnim,
    opacityAnim,
    circleSizeAnim,
    iconScaleAnim,
    translateYAnim,
  ]);

  return (
    <View style={styles.tabItem}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.85}
        style={styles.touchArea}
      >
        <Animated.View
          style={[
            styles.pillTab,
            {
              width: widthAnim,
              transform: [{ translateY: translateYAnim }],
            },
          ]}
        >
          {focused && (
            <LinearGradient
              colors={["#9A3A33", "#871B17", "#5F130F"]}
              start={{ x: 0.15, y: 0 }}
              end={{ x: 0.9, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
          )}

          <Animated.View
            style={[
              styles.iconCircle,
              {
                width: circleSizeAnim,
                height: circleSizeAnim,
                borderRadius: circleSizeAnim.interpolate({
                  inputRange: [32, 36],
                  outputRange: [16, 18],
                }),
                backgroundColor: focused
                  ? "rgba(255,255,255,0.18)"
                  : INACTIVE_CIRCLE_BG,
                transform: [{ scale: iconScaleAnim }],
              },
            ]}
          >
            <TabIcon
              pack={iconPack}
              name={iconName}
              size={focused ? 24 : 21}
              color={focused ? "#FFFFFF" : INACTIVE}
            />
          </Animated.View>

          {focused && (
            <Animated.Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
              style={[styles.tabLabel, { opacity: opacityAnim }]}
            >
              {label}
            </Animated.Text>
          )}
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}

function CustomTabBar({ state, navigation }: any) {
  const getIconData = (
    routeName: string,
    focused: boolean
  ): { pack: IconPack; name: any } => {
    switch (routeName) {
      case "home":
        return {
          pack: "ion",
          name: focused ? "home" : "home-outline",
        };

      case "chatbot":
        return {
          pack: "ion",
          name: focused ? "sparkles" : "sparkles-outline",
        };

      case "wallet":
        return {
          pack: "material",
          name: focused ? "file-cog" : "file-cog-outline",
        };

      case "settings":
        return {
          pack: "ion",
          name: focused ? "settings" : "settings-outline",
        };

      default:
        return {
          pack: "ion",
          name: "ellipse-outline",
        };
    }
  };

  const getLabel = (routeName: string): string => {
    switch (routeName) {
      case "home":
        return "الرئيسية";

      case "chatbot":
        return "المساعد";

      case "wallet":
        return "التقرير";

      case "settings":
        return "إعدادات";

      default:
        return "";
    }
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.tabBar}>
        <View style={styles.tabsRow}>
          {state.routes.map((route: any) => {
            const isFocused = state.routes[state.index].key === route.key;
            const iconData = getIconData(route.name, isFocused);

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

            return (
              <AnimatedPillTab
                key={route.key}
                focused={isFocused}
                iconPack={iconData.pack}
                iconName={iconData.name}
                label={getLabel(route.name)}
                onPress={onPress}
              />
            );
          })}
        </View>
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
        sceneStyle: {
          backgroundColor: "#FFFFFF",
          paddingBottom: 115,
        },
      }}
    >
      <Tabs.Screen name="home" options={{ title: "الصفحة الرئيسية" }} />
      <Tabs.Screen name="chatbot" options={{ title: "المساعد الذكي" }} />
      <Tabs.Screen name="wallet" options={{ title: "التقرير" }} />
      <Tabs.Screen name="settings" options={{ title: "الإعدادات" }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: BAR_SIDE_MARGIN,
    right: BAR_SIDE_MARGIN,
    bottom: Platform.OS === "ios" ? 30 : 24,
    height: 78,
    justifyContent: "center",
    alignItems: "center",
  },

  tabBar: {
    width: "100%",
    height: 68,
    borderRadius: 36,
    backgroundColor: BAR_BG,
    borderWidth: 1,
    borderColor: BAR_BORDER,
    overflow: "hidden",

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.08,
    shadowRadius: 13,
    elevation: 6,
  },

  tabsRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: BAR_INNER_PADDING,
  },

  tabItem: {
    width: TAB_SLOT_WIDTH,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
  },

  touchArea: {
    width: TAB_SLOT_WIDTH,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
  },

  pillTab: {
    height: 50,
    borderRadius: 25,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
    overflow: "hidden",
  },

  iconCircle: {
    justifyContent: "center",
    alignItems: "center",
  },

  tabLabel: {
    marginLeft: 3,
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
    includeFontPadding: false,
    textAlign: "center",
    maxWidth: 46,
  },
});