import { Tabs } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useRef } from "react";
import Svg, { Path } from "react-native-svg";

const ACTIVE = "#871B17";
const ACTIVE_DARK = "#5F130F";
const INACTIVE = "#555555";

const BAR_BG = "#EDEDED";
const BAR_BORDER = "rgba(120, 120, 120, 0.18)";

const BAR_SIDE_MARGIN = 24;

const TAB_COUNT = 4;

const BAR_HEIGHT = 70;
const BAR_RADIUS = 20;

const BUBBLE_SIZE = 60;
const BUBBLE_TOP = 9;

const WRAPPER_HEIGHT = 108;

const NOTCH_WIDTH = 82;
const NOTCH_DEPTH = 32;
const EDGE_SAFE_SPACE = 48;

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

function getIconData(
  routeName: string,
  focused: boolean
): { pack: IconPack; name: any } {
  switch (routeName) {
    case "home":
      return {
        pack: "ion",
        name: focused ? "home" : "home-outline",
      };

    case "chatbot":
      return {
        pack: "ion",
        name: focused ? "chatbubble-ellipses" : "chatbubble-ellipses-outline",
      };

    case "wallet":
      return {
        pack: "material",
        name: focused ? "file-document-edit" : "file-document-edit-outline",
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

function getLabel(routeName: string): string {
  switch (routeName) {
    case "home":
      return "الرئيسية";

    case "chatbot":
      return "المساعد";

    case "wallet":
      return "المحفظة";

    case "settings":
      return "الإعدادات";

    default:
      return "";
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getSafeCenterX({
  activeIndex,
  tabSlotWidth,
  barWidth,
}: {
  activeIndex: number;
  tabSlotWidth: number;
  barWidth: number;
}) {
  const originalCenter = activeIndex * tabSlotWidth + tabSlotWidth / 2;

  return clamp(
    originalCenter,
    EDGE_SAFE_SPACE,
    barWidth - EDGE_SAFE_SPACE
  );
}

function buildNotchPath({
  activeIndex,
  tabSlotWidth,
  barWidth,
}: {
  activeIndex: number;
  tabSlotWidth: number;
  barWidth: number;
}): string {
  const cx = getSafeCenterX({
    activeIndex,
    tabSlotWidth,
    barWidth,
  });

  const w = barWidth;
  const h = BAR_HEIGHT;
  const cr = BAR_RADIUS;

  const notchHalf = NOTCH_WIDTH / 2;

  const start = cx - notchHalf;
  const end = cx + notchHalf;

  return [
    `M ${cr} 0`,

    `L ${start} 0`,

    /*
      القوس حول الدائرة
      متوازن وما يقرب زيادة من الأطراف
    */
    `C ${start + 10} 0 ${cx - 36} 4 ${cx - 31} 17`,
    `C ${cx - 26} ${NOTCH_DEPTH} ${cx - 17} ${
      NOTCH_DEPTH + 7
    } ${cx} ${NOTCH_DEPTH + 7}`,
    `C ${cx + 17} ${NOTCH_DEPTH + 7} ${cx + 26} ${NOTCH_DEPTH} ${
      cx + 31
    } 17`,
    `C ${cx + 36} 4 ${end - 10} 0 ${end} 0`,

    `L ${w - cr} 0`,
    `Q ${w} 0 ${w} ${cr}`,
    `L ${w} ${h - cr}`,
    `Q ${w} ${h} ${w - cr} ${h}`,
    `L ${cr} ${h}`,
    `Q 0 ${h} 0 ${h - cr}`,
    `L 0 ${cr}`,
    `Q 0 0 ${cr} 0`,
    `Z`,
  ].join(" ");
}

function CustomTabBar({ state, navigation }: any) {
  const { width } = useWindowDimensions();

  const barWidth = width - BAR_SIDE_MARGIN * 2;
  const tabSlotWidth = barWidth / TAB_COUNT;

  const activeIndex = state.index;
  const activeRoute = state.routes[activeIndex];

  const activeIcon = getIconData(activeRoute.name, true);
  const activeLabel = getLabel(activeRoute.name);

  const safeCenterX = useMemo(() => {
    return getSafeCenterX({
      activeIndex,
      tabSlotWidth,
      barWidth,
    });
  }, [activeIndex, tabSlotWidth, barWidth]);

  const activeBubbleLeft = safeCenterX - BUBBLE_SIZE / 2;

  const notchPath = useMemo(() => {
    return buildNotchPath({
      activeIndex,
      tabSlotWidth,
      barWidth,
    });
  }, [activeIndex, tabSlotWidth, barWidth]);

  const bubbleScale = useRef(new Animated.Value(1)).current;
  const labelOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.sequence([
        Animated.timing(bubbleScale, {
          toValue: 0.93,
          duration: 70,
          useNativeDriver: true,
        }),
        Animated.spring(bubbleScale, {
          toValue: 1,
          useNativeDriver: true,
          friction: 5,
          tension: 120,
        }),
      ]),

      Animated.sequence([
        Animated.timing(labelOpacity, {
          toValue: 0,
          duration: 60,
          useNativeDriver: true,
        }),
        Animated.timing(labelOpacity, {
          toValue: 1,
          duration: 140,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [activeIndex, bubbleScale, labelOpacity]);

  return (
    <View
      style={[
        styles.wrapper,
        {
          left: BAR_SIDE_MARGIN,
          right: BAR_SIDE_MARGIN,
          width: barWidth,
        },
      ]}
      pointerEvents="box-none"
    >
      <View style={[styles.svgContainer, { width: barWidth }]}>
        <Svg width={barWidth} height={BAR_HEIGHT}>
          <Path
            d={notchPath}
            fill={BAR_BG}
            stroke={BAR_BORDER}
            strokeWidth={1}
          />
        </Svg>
      </View>

      <View style={[styles.tabsRow, { width: barWidth }]}>
        {state.routes.map((route: any) => {
          const isFocused = state.routes[state.index].key === route.key;
          const iconData = getIconData(route.name, false);

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
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              activeOpacity={0.82}
              style={[
                styles.tabButton,
                {
                  width: tabSlotWidth,
                },
              ]}
            >
              {!isFocused && (
                <TabIcon
                  pack={iconData.pack}
                  name={iconData.name}
                  size={27}
                  color={INACTIVE}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <Animated.View
        pointerEvents="box-none"
        style={[
          styles.activeBubbleWrapper,
          {
            left: activeBubbleLeft,
            transform: [{ scale: bubbleScale }],
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.activeBubbleTouch}
          onPress={() => navigation.navigate(activeRoute.name)}
        >
          <LinearGradient
            colors={[ACTIVE, "#7A1814", ACTIVE_DARK]}
            start={{ x: 0.15, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={styles.activeBubble}
          >
            <TabIcon
              pack={activeIcon.pack}
              name={activeIcon.name}
              size={29}
              color="#FFFFFF"
            />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      <Animated.Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.75}
        pointerEvents="none"
        style={[
          styles.activeLabel,
          {
            left: activeIndex * tabSlotWidth,
            width: tabSlotWidth,
            opacity: labelOpacity,
          },
        ]}
      >
        {activeLabel}
      </Animated.Text>
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
      <Tabs.Screen name="home" options={{ title: "الرئيسية" }} />
      <Tabs.Screen name="chatbot" options={{ title: "المساعد " }} />
      <Tabs.Screen name="wallet" options={{ title: "المحفظة" }} />
      <Tabs.Screen name="settings" options={{ title: "الإعدادات" }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 30 : 24,
    height: WRAPPER_HEIGHT,
    alignItems: "center",
    justifyContent: "flex-end",
    zIndex: 999,
    elevation: 999,
  },

  svgContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 8,
  },

  tabsRow: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: BAR_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 5,
  },

  tabButton: {
    height: BAR_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 9,
  },

  activeBubbleWrapper: {
    position: "absolute",
    top: BUBBLE_TOP,
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: BUBBLE_SIZE / 2,
    zIndex: 30,

    shadowColor: ACTIVE,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 9,
    elevation: 12,
  },

  activeBubbleTouch: {
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: BUBBLE_SIZE / 2,
    overflow: "hidden",
  },

  activeBubble: {
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: BUBBLE_SIZE / 2,
    justifyContent: "center",
    alignItems: "center",
  },

  activeLabel: {
    position: "absolute",
    bottom: 13,
    color: INACTIVE,
    fontSize: 11,
    fontWeight: "800",
    textAlign: "center",
    includeFontPadding: false,
    zIndex: 20,
  },
});