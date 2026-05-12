import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Animated,
  Easing,
  useWindowDimensions,
  StatusBar,
  Platform,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useAuth } from "../providers/AuthProvider";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import * as SplashScreen from "expo-splash-screen";

const BACKGROUND_IMAGE = require("../assets/images/start-background.png");
const LOGO_ARABIC = require("../assets/images/logo-arabic.png");
const LOGO_ENGLISH = require("../assets/images/logo-english.png");

const COLORS = {
  appBackground: "#EFE7DE",
  nextScreenBackground: "#FFFFFF",
  primary: "#9A211C",
  primaryDark: "#761713",
  primaryText: "#871B17",
  title: "#7B1714",
  darkText: "#2C2C2C",
  logoLine: "#B86B69",
  white: "#FFFFFF",
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export default function StartScreen() {
  const router = useRouter();
  const { session, loading } = useAuth();

  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const [language, setLanguage] = useState<"ar" | "en">("ar");
  const [isNavigating, setIsNavigating] = useState(false);

  const isArabic = language === "ar";
  const isSmallScreen = height < 720;
  const isVerySmallScreen = height < 650;

  const horizontalPadding = clamp(width * 0.055, 20, 26);

  const splashLogoWidth = clamp(width * 0.72, 220, 280);
  const splashLogoHeight = splashLogoWidth * (210 / 270);

  const finalLogoWidth = clamp(width * 0.23, 78, 92);
  const finalLogoHeight = finalLogoWidth * (64 / 88);

  const headerTop = clamp(height * 0.025, 10, 18);

  const styles = useMemo(
    () =>
      createStyles({
        horizontalPadding,
        splashLogoWidth,
        splashLogoHeight,
        finalLogoWidth,
        finalLogoHeight,
        headerTop,
        isSmallScreen,
        isVerySmallScreen,
        width,
        height,
      }),
    [
      horizontalPadding,
      splashLogoWidth,
      splashLogoHeight,
      finalLogoWidth,
      finalLogoHeight,
      headerTop,
      isSmallScreen,
      isVerySmallScreen,
      width,
      height,
    ]
  );

  const transitionAnim = useRef(new Animated.Value(0)).current;

  const contentAnim = useRef(new Animated.Value(0)).current;
  const glassLayerAnim = useRef(new Animated.Value(0)).current;
  const logoMoveAnim = useRef(new Animated.Value(0)).current;
  const lineAnim = useRef(new Animated.Value(0)).current;
  const arabicAnim = useRef(new Animated.Value(0)).current;
  const englishAnim = useRef(new Animated.Value(0)).current;

  const animationStarted = useRef(false);
  const splashHidden = useRef(false);

  useFocusEffect(
    useCallback(() => {
      setIsNavigating(false);
      transitionAnim.setValue(0);

      return () => {};
    }, [transitionAnim])
  );

  const startIntroAnimation = () => {
    if (animationStarted.current) return;
    animationStarted.current = true;

    const animation = Animated.sequence([
      Animated.timing(lineAnim, {
        toValue: 1,
        duration: 1050,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),

      Animated.delay(120),

      Animated.parallel([
        Animated.timing(arabicAnim, {
          toValue: 1,
          duration: 650,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(englishAnim, {
          toValue: 1,
          duration: 650,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),

      Animated.delay(850),

      Animated.parallel([
        Animated.timing(logoMoveAnim, {
          toValue: 1,
          duration: 900,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),

        Animated.timing(glassLayerAnim, {
          toValue: 1,
          duration: 760,
          delay: 330,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),

        Animated.timing(contentAnim, {
          toValue: 1,
          duration: 700,
          delay: 430,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]);

    animation.start();
  };

  const hideSplashAfterBackground = async () => {
    if (splashHidden.current) return;
    splashHidden.current = true;

    try {
      await SplashScreen.hideAsync();
    } catch {
      // عادي لو كانت شاشة البداية مخفية قبل
    } finally {
      requestAnimationFrame(() => {
        startIntroAnimation();
      });
    }
  };

  const toggleLanguage = () => {
    if (isNavigating) return;
    setLanguage((prev) => (prev === "ar" ? "en" : "ar"));
  };

  useEffect(() => {
    if (!loading && session) {
      // لو تبغين المستخدم المسجل يدخل للهوم مباشرة بعدين:
      // router.replace("/(tabs)/home");
    }
  }, [loading, session, router]);

  const smoothNavigate = (path: "/login" | "/register") => {
    if (isNavigating) return;

    setIsNavigating(true);

    Animated.timing(transitionAnim, {
      toValue: 1,
      duration: 160,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      requestAnimationFrame(() => {
        router.push(path);
      });
    });
  };

  const startX = width / 2 - splashLogoWidth / 2;
  const startY =
    height / 2 -
    splashLogoHeight / 2 -
    clamp(height * 0.105, 62, 88);

  const finalLogoLeft = width - horizontalPadding - finalLogoWidth;
  const finalLogoTop = insets.top + headerTop;

  const endX = finalLogoLeft - (splashLogoWidth - finalLogoWidth) / 2;
  const endY = finalLogoTop - (splashLogoHeight - finalLogoHeight) / 2;

  const logoTranslateX = logoMoveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [startX, endX],
  });

  const logoTranslateY = logoMoveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [startY, endY],
  });

  const logoScale = logoMoveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, finalLogoWidth / splashLogoWidth],
  });

  const contentOpacity = contentAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const contentTranslateY = contentAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [18, 0],
  });

  const glassLayerOpacity = glassLayerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const animatedLineWidth = lineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, splashLogoWidth * 0.73],
  });

  const arabicTranslateY = arabicAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [18, 0],
  });

  const arabicOpacity = arabicAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const englishTranslateY = englishAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-18, 0],
  });

  const englishOpacity = englishAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <View style={styles.container}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />

      <Image
        source={BACKGROUND_IMAGE}
        style={styles.realBackground}
        resizeMode="cover"
        fadeDuration={0}
        onLoadEnd={hideSplashAfterBackground}
      />

      <Animated.View
        pointerEvents="none"
        style={[styles.backgroundGlassLayer, { opacity: glassLayerOpacity }]}
      >
        <BlurView
          intensity={Platform.OS === "android" ? 14 : 12}
          tint="light"
          experimentalBlurMethod="dimezisBlurView"
          style={StyleSheet.absoluteFillObject}
        />

        <LinearGradient
          colors={[
            "rgba(255,255,255,0.10)",
            "rgba(255,255,255,0.03)",
            "rgba(255,255,255,0.09)",
          ]}
          locations={[0, 0.5, 1]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>

      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <Animated.View
          style={[
            styles.fullContent,
            {
              opacity: contentOpacity,
              transform: [{ translateY: contentTranslateY }],
            },
          ]}
        >
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.langButtonWrapper}
              activeOpacity={0.75}
              onPress={toggleLanguage}
              disabled={isNavigating}
            >
              <LinearGradient
                colors={[
                  "rgba(255,255,255,0.62)",
                  "rgba(255,255,255,0.34)",
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.langButtonGradient}
              >
                <Feather name="globe" size={18} color={COLORS.primaryText} />

                <View style={styles.langDivider} />

                <Text style={styles.langText}>
                  {isArabic ? "En" : "عربي"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.logoPlaceholder} />
          </View>

          <View style={styles.centerContent}>
            <View style={styles.textGroup}>
              {isArabic ? (
                <Text style={styles.title}>
                  مرحباً بك في <Text style={styles.titleBrand}>تنبه</Text>
                </Text>
              ) : (
                <Text style={styles.title}>
                  Welcome to <Text style={styles.titleBrand}>Tnabbah</Text>
                </Text>
              )}

              <View style={styles.titleUnderline} />

              <Text style={styles.subtitle}>
                {isArabic
                  ? "لأن سيارتك تحتاج من ينتبه لها"
                  : "Because your car needs someone to watch over it"}
              </Text>
            </View>
          </View>

          <View style={styles.buttonsArea}>
            <TouchableOpacity
              style={styles.loginButtonWrapper}
              onPress={() => smoothNavigate("/login")}
              activeOpacity={0.78}
              disabled={isNavigating}
            >
              <LinearGradient
                colors={[COLORS.primary, COLORS.primaryDark]}
                start={{ x: 0.15, y: 0 }}
                end={{ x: 0.9, y: 1 }}
                style={styles.loginGradient}
              >
                <View style={styles.loginShine} />

                <Text style={styles.loginText}>
                  {isArabic ? "تسجيل الدخول" : "Login"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.registerButtonWrapper}
              onPress={() => smoothNavigate("/register")}
              activeOpacity={0.78}
              disabled={isNavigating}
            >
              <LinearGradient
                colors={[
                  "rgba(255,255,255,0.64)",
                  "rgba(255,255,255,0.36)",
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.registerGradient}
              >
                <Text style={styles.registerText}>
                  {isArabic ? "إنشاء حساب جديد" : "Create Account"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </SafeAreaView>

      <Animated.View
        pointerEvents="none"
        style={[
          styles.splashLogoWrapper,
          {
            transform: [
              { translateX: logoTranslateX },
              { translateY: logoTranslateY },
              { scale: logoScale },
            ],
          },
        ]}
      >
        <Animated.Image
          source={LOGO_ARABIC}
          style={[
            styles.logoArabic,
            {
              opacity: arabicOpacity,
              transform: [{ translateY: arabicTranslateY }],
            },
          ]}
          resizeMode="contain"
          fadeDuration={0}
        />

        <View style={styles.logoLineContainer}>
          <Animated.View
            style={[styles.logoLine, { width: animatedLineWidth }]}
          />
        </View>

        <Animated.Image
          source={LOGO_ENGLISH}
          style={[
            styles.logoEnglish,
            {
              opacity: englishOpacity,
              transform: [{ translateY: englishTranslateY }],
            },
          ]}
          resizeMode="contain"
          fadeDuration={0}
        />
      </Animated.View>

      <Animated.View
        pointerEvents="none"
        style={[
          styles.transitionOverlay,
          {
            opacity: transitionAnim,
          },
        ]}
      />
    </View>
  );
}

function createStyles({
  horizontalPadding,
  splashLogoWidth,
  splashLogoHeight,
  finalLogoWidth,
  finalLogoHeight,
  headerTop,
  isSmallScreen,
  isVerySmallScreen,
  width,
  height,
}: {
  horizontalPadding: number;
  splashLogoWidth: number;
  splashLogoHeight: number;
  finalLogoWidth: number;
  finalLogoHeight: number;
  headerTop: number;
  isSmallScreen: boolean;
  isVerySmallScreen: boolean;
  width: number;
  height: number;
}) {
  const buttonHeight = clamp(height * 0.076, 56, 64);
  const buttonRadius = buttonHeight / 2;

  return StyleSheet.create({
    container: {
      flex: 1,
      overflow: "hidden",
      backgroundColor: COLORS.appBackground,
    },

    realBackground: {
      ...StyleSheet.absoluteFillObject,
      width: "100%",
      height: "100%",
      opacity: 1,
      zIndex: 0,
    },

    backgroundGlassLayer: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 1,
      backgroundColor: "transparent",
    },

    safeArea: {
      flex: 1,
      zIndex: 5,
    },

    fullContent: {
      flex: 1,
      paddingHorizontal: horizontalPadding,
      paddingTop: headerTop,
      paddingBottom: isVerySmallScreen ? 22 : 30,
      zIndex: 5,
    },

    splashLogoWrapper: {
      position: "absolute",
      width: splashLogoWidth,
      height: splashLogoHeight,
      top: 0,
      left: 0,
      zIndex: 30,
      alignItems: "center",
      justifyContent: "center",
    },

    logoArabic: {
      width: splashLogoWidth * 0.815,
      height: splashLogoHeight * 0.457,
      marginBottom: splashLogoHeight * 0.048,
    },

    logoLineContainer: {
      width: splashLogoWidth * 0.73,
      height: 6,
      alignItems: "flex-end",
      justifyContent: "center",
      overflow: "hidden",
    },

    logoLine: {
      height: 6,
      borderRadius: 3,
      backgroundColor: COLORS.logoLine,
    },

    logoEnglish: {
      width: splashLogoWidth * 0.815,
      height: splashLogoHeight * 0.162,
      marginTop: splashLogoHeight * 0.076,
    },

    header: {
      width: "100%",
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      zIndex: 5,
    },

    logoPlaceholder: {
      width: finalLogoWidth,
      height: finalLogoHeight,
    },

    langButtonWrapper: {
      height: isVerySmallScreen ? 44 : 48,
      minWidth: isVerySmallScreen ? 86 : 94,
      borderRadius: 26,
      overflow: "hidden",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: Platform.OS === "android" ? 0.08 : 0.1,
      shadowRadius: 14,
      elevation: 5,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.58)",
      backgroundColor: "rgba(255,255,255,0.35)",
    },

    langButtonGradient: {
      flex: 1,
      paddingHorizontal: 14,
      borderRadius: 26,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 9,
    },

    langDivider: {
      width: 1,
      height: 20,
      backgroundColor: "rgba(135,27,23,0.16)",
    },

    langText: {
      fontSize: 16,
      color: COLORS.primaryText,
      fontWeight: "800",
    },

    centerContent: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingBottom: isVerySmallScreen ? 140 : isSmallScreen ? 175 : 205,
    },

    textGroup: {
      width: "100%",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: clamp(width * 0.03, 10, 16),
    },

    title: {
      fontSize: isVerySmallScreen ? 25 : isSmallScreen ? 30 : 32,
      fontWeight: "900",
      color: COLORS.title,
      textAlign: "center",
      letterSpacing: -0.7,
      lineHeight: isVerySmallScreen ? 36 : 43,
      textShadowColor: "rgba(255,255,255,0.95)",
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 14,
    },

    titleBrand: {
      color: COLORS.primary,
      fontWeight: "900",
      letterSpacing: -0.4,
    },

    titleUnderline: {
      marginTop: 9,
      marginBottom: 11,
      width: isVerySmallScreen ? 68 : 84,
      height: 4,
      borderRadius: 99,
      backgroundColor: "rgba(135,27,23,0.28)",
    },

    subtitle: {
      fontSize: isVerySmallScreen ? 15 : 17,
      lineHeight: isVerySmallScreen ? 24 : 29,
      color: COLORS.darkText,
      fontWeight: "800",
      textAlign: "center",
      maxWidth: clamp(width * 0.82, 280, 330),
      textShadowColor: "rgba(255,255,255,0.90)",
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 10,
    },

    buttonsArea: {
      width: "100%",
      gap: isVerySmallScreen ? 12 : 14,
      marginBottom: isVerySmallScreen ? 6 : 10,
    },

    loginButtonWrapper: {
      width: "100%",
      height: buttonHeight,
      borderRadius: buttonRadius,
      overflow: "hidden",
      shadowColor: "#6E1411",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: Platform.OS === "android" ? 0.18 : 0.24,
      shadowRadius: 14,
      elevation: 6,
      backgroundColor: COLORS.primary,
    },

    loginGradient: {
      flex: 1,
      borderRadius: buttonRadius,
      justifyContent: "center",
      alignItems: "center",
      overflow: "hidden",
    },

    loginShine: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: "48%",
      backgroundColor: "rgba(255,255,255,0.10)",
      borderTopLeftRadius: buttonRadius,
      borderTopRightRadius: buttonRadius,
    },

    loginText: {
      color: COLORS.white,
      fontSize: isVerySmallScreen ? 19 : 21,
      fontWeight: "900",
    },

    registerButtonWrapper: {
      width: "100%",
      height: buttonHeight,
      borderRadius: buttonRadius,
      overflow: "hidden",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: Platform.OS === "android" ? 0.08 : 0.1,
      shadowRadius: 15,
      elevation: 5,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.58)",
      backgroundColor: "rgba(255,255,255,0.40)",
    },

    registerGradient: {
      flex: 1,
      borderRadius: buttonRadius,
      justifyContent: "center",
      alignItems: "center",
      overflow: "hidden",
    },

    registerText: {
      color: COLORS.primaryText,
      fontSize: isVerySmallScreen ? 18 : 20,
      fontWeight: "900",
    },

    transitionOverlay: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 100,
      backgroundColor: COLORS.nextScreenBackground,
    },
  });
}