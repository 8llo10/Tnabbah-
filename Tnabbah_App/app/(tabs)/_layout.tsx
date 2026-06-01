import { Tabs } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
  useWindowDimensions,
  Text,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useRef } from "react";
import { useLanguage } from "../../providers/LanguageProvider";
import { useAppSettings } from "../../providers/AppSettingsProvider";

const TAB_COUNT = 3;

const BAR_HEIGHT = Platform.OS === "ios" ? 96 : 88;
const WRAPPER_HEIGHT = Platform.OS === "ios" ? 96 : 88;

const ACTIVE_PILL_WIDTH = 92;
const ACTIVE_PILL_HEIGHT = 50;
const ACTIVE_PILL_TOP = Platform.OS === "ios" ? 14 : 12;

type IconPack = "ion" | "material";

type TabTheme = {
  screenBg: string;
  barBg: string;
  inactive: string;
  activeGradient: readonly [string, string, string];
  activeShadow: string;
  activeText: string;
};

const lightTabTheme: TabTheme = {
  screenBg: "#FFFFFF",
  barBg: "#EBEBEB",
  inactive: "#5F5F5F",
  activeGradient: ["#871B17", "#871B17", "#871B17"],
  activeShadow: "#871B17",
  activeText: "#FFFFFF",
};

const darkTabTheme: TabTheme = {
  screenBg: "#151515",
  barBg: "#202020",
  inactive: "#C7C7C7",
  activeGradient: ["#B63A34", "#B63A34", "#B63A34"],
  activeShadow: "rgba(182,58,52,0.42)",
  activeText: "#FFFFFF",
};

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

function getIconData(
  routeName: string,
  focused: boolean,
): { pack: IconPack; name: any } {
  switch (routeName) {
    case "home":
      return {
        pack: "ion",
        name: focused ? "home" : "home-outline",
      };

    case "wallet":
      return {
        pack: "material",
        name: focused ? "wallet" : "wallet-outline",
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
}

function getLabel(routeName: string, language: "AR" | "EN"): string {
  const labels = {
    AR: {
      home: "الرئيسية",
      wallet: "المحفظة",
      settings: "الإعدادات",
    },
    EN: {
      home: "Home",
      wallet: "Wallet",
      settings: "Settings",
    },
  };

  switch (routeName) {
    case "home":
      return labels[language].home;

    case "wallet":
      return labels[language].wallet;

    case "settings":
      return labels[language].settings;

    default:
      return "";
  }
}

function getVisualRouteOrder(language: "AR" | "EN") {
  // English LTR: Home left, Wallet middle, Settings right
  // Arabic RTL: Home right, Wallet middle, Settings left
  return language === "AR"
    ? ["settings", "wallet", "home"]
    : ["home", "wallet", "settings"];
}

function CustomTabBar({ state, navigation }: any) {
  const { width } = useWindowDimensions();
  const { language } = useLanguage();
  const { darkModeEnabled } = useAppSettings();

  const theme = darkModeEnabled ? darkTabTheme : lightTabTheme;

  const visualRoutes = getVisualRouteOrder(language);
  const barWidth = width;
  const tabSlotWidth = barWidth / TAB_COUNT;

  const activeRoute = state.routes[state.index];
  const activeVisualIndex = Math.max(
    0,
    visualRoutes.findIndex((routeName) => routeName === activeRoute.name),
  );

  const activeIcon = getIconData(activeRoute.name, true);
  const activeLabel = getLabel(activeRoute.name, language);

  const activePillLeft = useMemo(() => {
    return (
      activeVisualIndex * tabSlotWidth +
      tabSlotWidth / 2 -
      ACTIVE_PILL_WIDTH / 2
    );
  }, [activeVisualIndex, tabSlotWidth]);

  const pillTranslateX = useRef(new Animated.Value(activePillLeft)).current;
  const pillScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(pillTranslateX, {
        toValue: activePillLeft,
        useNativeDriver: true,
        friction: 8,
        tension: 90,
      }),

      Animated.sequence([
        Animated.timing(pillScale, {
          toValue: 0.96,
          duration: 70,
          useNativeDriver: true,
        }),
        Animated.spring(pillScale, {
          toValue: 1,
          useNativeDriver: true,
          friction: 5,
          tension: 120,
        }),
      ]),
    ]).start();
  }, [activePillLeft, pillScale, pillTranslateX]);

  const handlePress = async (route: any, isFocused: boolean) => {
    try {
      await Haptics.selectionAsync();
    } catch {}

    const event = navigation.emit({
      type: "tabPress",
      target: route.key,
      canPreventDefault: true,
    });

    if (!isFocused && !event.defaultPrevented) {
      // مهم:
      // jumpTo ما يبني History بين التابات مثل navigate،
      // فـ Home ما يرجعك Settings بسبب history.
      navigation.jumpTo(route.name);
    }
  };

  return (
    <View
      style={[styles.wrapper, { backgroundColor: theme.barBg }]}
      pointerEvents="box-none"
    >
      <View
        style={[
          styles.barContainer,
          {
            width: barWidth,
            backgroundColor: theme.barBg,
          },
        ]}
      >
        <Animated.View
          pointerEvents="box-none"
          style={[
            styles.activePillWrapper,
            {
              shadowColor: theme.activeShadow,
              shadowOpacity: darkModeEnabled ? 0.16 : 0.22,
              transform: [{ translateX: pillTranslateX }, { scale: pillScale }],
            },
          ]}
        >
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.activePillTouch}
            onPress={async () => {
              try {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              } catch {}

              navigation.jumpTo(activeRoute.name);
            }}
          >
            <LinearGradient
              colors={theme.activeGradient}
              start={{ x: 0.15, y: 0 }}
              end={{ x: 0.9, y: 1 }}
              style={styles.activePill}
            >
              <TabIcon
                pack={activeIcon.pack}
                name={activeIcon.name}
                size={21}
                color={theme.activeText}
              />

              <Text
                numberOfLines={1}
                allowFontScaling={false}
                style={[styles.activePillLabel, { color: theme.activeText }]}
              >
                {activeLabel}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <View style={[styles.tabsRow, { width: barWidth }]}>
          {visualRoutes.map((routeName) => {
            const route = state.routes.find(
              (item: any) => item.name === routeName,
            );

            if (!route) return null;

            const isFocused = state.routes[state.index].key === route.key;
            const iconData = getIconData(route.name, false);
            const label = getLabel(route.name, language);

            return (
              <TouchableOpacity
                key={route.key}
                onPress={() => handlePress(route, isFocused)}
                activeOpacity={0.78}
                style={[
                  styles.tabButton,
                  {
                    width: tabSlotWidth,
                  },
                ]}
              >
                {!isFocused && (
                  <>
                    <View style={styles.iconSpace}>
                      <TabIcon
                        pack={iconData.pack}
                        name={iconData.name}
                        size={24}
                        color={theme.inactive}
                      />
                    </View>

                    <Text
                      numberOfLines={1}
                      allowFontScaling={false}
                      style={[styles.tabLabel, { color: theme.inactive }]}
                    >
                      {label}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

export default function TabsLayout() {
  const { language } = useLanguage();
  const { darkModeEnabled } = useAppSettings();

  const isArabic = language === "AR";
  const theme = darkModeEnabled ? darkTabTheme : lightTabTheme;

  return (
    <Tabs
      initialRouteName="home"
      backBehavior="none"
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,

        // لا تضيفي gestureEnabled هنا.
        // gestureEnabled خاص بالـ Stack وليس Tabs،
        // لذلك وجوده هنا يسبب TypeScript error.

        sceneStyle: {
          backgroundColor: theme.screenBg,
          paddingBottom: Platform.OS === "ios" ? 96 : 88,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: isArabic ? "الرئيسية" : "Home",
        }}
      />

      <Tabs.Screen
        name="wallet"
        options={{
          title: isArabic ? "المحفظة" : "Wallet",
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: isArabic ? "الإعدادات" : "Settings",
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: WRAPPER_HEIGHT,
    alignItems: "center",
    justifyContent: "flex-end",
    zIndex: 999,
    elevation: 999,
  },

  barContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: BAR_HEIGHT,
    overflow: "hidden",

    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 7,
    elevation: 7,
  },

  tabsRow: {
    height: BAR_HEIGHT,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    zIndex: 5,
    paddingTop: Platform.OS === "ios" ? 14 : 12,
  },

  tabButton: {
    height: 62,
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: 0,
  },

  iconSpace: {
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },

  tabLabel: {
    fontSize: 11,
    fontFamily: "Alexandria-Bold",
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 15,
    includeFontPadding: true,
    paddingBottom: 1,
  },

  activePillWrapper: {
    position: "absolute",
    left: 0,
    top: ACTIVE_PILL_TOP,
    width: ACTIVE_PILL_WIDTH,
    height: ACTIVE_PILL_HEIGHT,
    borderRadius: ACTIVE_PILL_HEIGHT / 2,
    zIndex: 30,

    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 8,
    elevation: 8,
  },

  activePillTouch: {
    width: ACTIVE_PILL_WIDTH,
    height: ACTIVE_PILL_HEIGHT,
    borderRadius: ACTIVE_PILL_HEIGHT / 2,
    overflow: "hidden",
  },

  activePill: {
    width: ACTIVE_PILL_WIDTH,
    height: ACTIVE_PILL_HEIGHT,
    borderRadius: ACTIVE_PILL_HEIGHT / 2,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingTop: 4,
    paddingBottom: 4,
  },

  activePillLabel: {
    marginTop: 1,
    fontSize: 10.5,
    fontFamily: "Alexandria-Bold",
    fontWeight: "900",
    textAlign: "center",
    lineHeight: 14,
    includeFontPadding: true,
    paddingBottom: 1,
  },
});
