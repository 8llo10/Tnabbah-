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
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useAuth } from "../providers/AuthProvider";
import { useLanguage } from "../providers/LanguageProvider";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";

SplashScreen.preventAutoHideAsync().catch(() => {});

const BACKGROUND_IMAGE = require("../assets/images/start-background.png");
const LOGO_ARABIC = require("../assets/images/logo-arabic.png");
const LOGO_ENGLISH = require("../assets/images/logo-english.png");

const COLORS = {
  appBackground: "#E9EEF1",
  nextScreenBackground: "#FFFFFF",

  primary: "#8F1F1A",
  primaryDark: "#6F1713",
  primaryText: "#7B1714",

  title: "#7A1815",
  darkText: "#263238",

  // لون الخط بين الكلمتين صار نفس لون اللوقو تقريبًا
  logoLine: "#8F1F1A",
  logoLineBorder: "rgba(255,255,255,0.88)",

  white: "#FFFFFF",

  glassLight: "rgba(255,255,255,0.78)",
  glassSoft: "rgba(245,247,248,0.66)",
  glassBorder: "rgba(143,31,26,0.34)",
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export default function StartScreen() {
  const router = useRouter();
  const { session, loading } = useAuth();
  const { t, isArabic, language, changeLanguage } = useLanguage();
  

  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  
  const [isNavigating, setIsNavigating] = useState(false);

  const isSmallScreen = height < 720;
  const isVerySmallScreen = height < 650;

  const horizontalPadding = clamp(width * 0.055, 20, 26);

  const splashLogoWidth = clamp(width * 0.72, 220, 280);
  const splashLogoHeight = splashLogoWidth * (240 / 270);

  const finalLogoWidth = clamp(width * 0.2, 70, 82);
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

  const exitAnim = useRef(new Animated.Value(0)).current;

  const contentAnim = useRef(new Animated.Value(0)).current;
  const logoMoveAnim = useRef(new Animated.Value(0)).current;
  const logoFinishAnim = useRef(new Animated.Value(0)).current;
  const lineAnim = useRef(new Animated.Value(0)).current;
  const arabicAnim = useRef(new Animated.Value(0)).current;
  const englishAnim = useRef(new Animated.Value(0)).current;

  const animationStarted = useRef(false);
  const splashHidden = useRef(false);

  useFocusEffect(
    useCallback(() => {
      setIsNavigating(false);
      exitAnim.setValue(0);
      logoFinishAnim.setValue(0);

      return () => {};
    }, [exitAnim, logoFinishAnim])
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
          duration: 1050,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),

        Animated.timing(contentAnim, {
          toValue: 1,
          duration: 850,
          delay: 420,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),

        Animated.timing(logoFinishAnim, {
          toValue: 1,
          duration: 900,
          delay: 520,
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

 

  useEffect(() => {
    if (!loading && session) {
      // لو تبغين المستخدم المسجل يدخل للهوم مباشرة بعدين:
      // router.replace("/(tabs)/home");
    }
  }, [loading, session, router]);

  const smoothNavigate = (path: "/login" | "/register") => {
    if (isNavigating) return;

    setIsNavigating(true);
    router.push(path);
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

  const exitOpacity = exitAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1],
  });

  const exitScale = exitAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1],
  });

  // عرض الخط أثناء الأنيميشن
  // كبرته شوي عشان يكون قريب من شكل الخط في الصورة
  const animatedLineWidth = lineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, splashLogoWidth * 0.84],
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

  const logoSoftLift = logoFinishAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -4],
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
        blurRadius={0}
        onLoadEnd={hideSplashAfterBackground}
      />

      <View pointerEvents="none" style={styles.backgroundSoftLayer} />

      <View pointerEvents="none" style={styles.backgroundExtraLayer} />

      <LinearGradient
        pointerEvents="none"
        colors={[
          "rgba(255,255,255,0.34)",
          "rgba(255,255,255,0.10)",
          "rgba(233,238,241,0.50)",
        ]}
        locations={[0, 0.48, 1]}
        style={styles.backgroundGradientLayer}
      />

      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <Animated.View
          style={[
            styles.fullContent,
            {
              opacity: Animated.multiply(contentOpacity, exitOpacity),
              transform: [
                { translateY: contentTranslateY },
                { scale: exitScale },
              ],
            },
          ]}
        >
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.langButtonWrapper}
              activeOpacity={0.78}
              onPress={() => {
                const nextLanguage = language === "AR" ? "EN" : "AR";
                changeLanguage(nextLanguage);
              }}
              disabled={isNavigating}
            >
              <LinearGradient
                colors={[COLORS.glassLight, COLORS.glassLight]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.langButtonGradient}
              >
                <Feather name="globe" size={18} color={COLORS.primaryText} />

                <View style={styles.langDivider} />

                <Text style={styles.langText}>{t.languageButton}</Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.logoPlaceholder} />
          </View>

          <View style={styles.centerContent}>
            <View style={styles.textGroup}>

              {isArabic ? (
                <Text style={styles.title}>
                  {t.startWelcome}{" "}
                  <Text style={styles.titleBrand}>{t.startBrand}</Text>
                </Text>
              ) : (
                <Text
                  style={[styles.title, styles.englishTitle]}
                  numberOfLines={1}
                >
                  {t.startWelcome}{" "}
                  <Text style={styles.titleBrand}>{t.startBrand}</Text>
                </Text>
              )}

              <View style={styles.titleUnderline} />

              <Text style={styles.subtitle}>{t.startSubtitle}</Text>
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
                colors={[COLORS.primary, COLORS.primary]}
                start={{ x: 0.15, y: 0 }}
                end={{ x: 0.9, y: 1 }}
                style={styles.loginGradient}
              >
                <View style={styles.loginShine} />

                <Text style={styles.loginText}>{t.login}</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.registerButtonWrapper}
              onPress={() => smoothNavigate("/register")}
              activeOpacity={0.78}
              disabled={isNavigating}
            >
              <LinearGradient
                colors={[COLORS.glassLight, COLORS.glassLight]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.registerGradient}
              >
                <Text style={styles.registerText}>{t.createAccount}</Text>
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
              { translateY: Animated.add(logoTranslateY, logoSoftLift) },
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

  const titleShadow = {
    textShadowColor: "rgba(255,255,255,0.82)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 5,
  };

  const subtitleShadow = {
    textShadowColor: "rgba(255,255,255,0.76)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  };

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

    backgroundSoftLayer: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(255,255,255,0.25)",
      zIndex: 1,
    },

    backgroundExtraLayer: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(233,238,241,0.22)",
      zIndex: 2,
    },

    backgroundGradientLayer: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 3,
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
      justifyContent: "space-between",
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

    // هنا حجم ومكان الخط
    logoLineContainer: {
      width: splashLogoWidth * 0.84,
      height: 8,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },

    // هنا شكل الخط نفسه: أحمر غامق + حد أبيض خفيف
    logoLine: {
      height: 5.5,
      borderRadius: 1.5,
      backgroundColor: COLORS.logoLine,
      borderWidth: 0.8,
      borderColor: COLORS.logoLineBorder,
    },

    logoEnglish: {
      width: splashLogoWidth * 1.07,
      height: splashLogoHeight * 0.3,
      marginTop: splashLogoHeight * 0.037,
    },

    header: {
      width: "100%",
      minHeight: finalLogoHeight,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      zIndex: 5,
    },

    logoPlaceholder: {
      width: finalLogoWidth,
      height: finalLogoHeight,
    },

    langButtonWrapper: {
      height: isVerySmallScreen ? 40 : 44,
      minWidth: isVerySmallScreen ? 84 : 92,
      borderRadius: 26,
      overflow: "hidden",
      shadowColor: "transparent",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
      borderWidth: 1.3,
      borderColor: COLORS.glassBorder,
      backgroundColor: "rgba(255,255,255,0.62)",
    },

    langButtonGradient: {
      flex: 1,
      paddingHorizontal: 14,
      borderRadius: 26,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 9,
      overflow: "hidden",
    },

    langDivider: {
      width: 1,
      height: 20,
      backgroundColor: "rgba(123,23,20,0.20)",
    },

    langText: {
      fontSize: 16,
      color: COLORS.primaryText,
      fontWeight: "900",
      includeFontPadding: false,
      textAlignVertical: "center",
    },

    centerContent: {
      width: "100%",
      alignItems: "center",
      justifyContent: "flex-start",
      paddingTop: isVerySmallScreen
        ? height * 0.1
        : isSmallScreen
        ? height * 0.1
        : height * 0.1,
      flex: 1,
    },

    textGroup: {
      width: "100%",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: clamp(width * 0.02, 8, 14),
    },

    title: {
      fontSize: isVerySmallScreen ? 30 : isSmallScreen ? 35 : 38,
      fontWeight: "900",
      color: COLORS.title,
      textAlign: "center",
      letterSpacing: -0.4,
      lineHeight: isVerySmallScreen ? 42 : isSmallScreen ? 47 : 50,
      includeFontPadding: false,
      textAlignVertical: "center",
      ...titleShadow,
    },

    englishTitle: {
      fontSize: isVerySmallScreen ? 28 : isSmallScreen ? 31 : 33,
      lineHeight: isVerySmallScreen ? 38 : isSmallScreen ? 41 : 44,
      letterSpacing: -0.8,
      maxWidth: width * 0.99,
    },

    titleBrand: {
      color: COLORS.primary,
      fontWeight: "900",
      letterSpacing: -0.2,
      includeFontPadding: false,
    },

    titleUnderline: {
      marginTop: 9,
      marginBottom: 11,
      width: isVerySmallScreen ? 66 : 78,
      height: 3.5,
      borderRadius: 99,
      backgroundColor: "rgba(143,31,26,0.30)",
    },

    subtitle: {
      fontSize: isVerySmallScreen ? 15 : 16.5,
      lineHeight: isVerySmallScreen ? 24 : 28,
      color: "rgba(38,50,56,0.88)",
      fontWeight: "800",
      textAlign: "center",
      maxWidth: clamp(width * 0.82, 270, 330),
      includeFontPadding: false,
      textAlignVertical: "center",
      ...subtitleShadow,
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
      shadowColor: "transparent",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
      backgroundColor: COLORS.primary,
      borderWidth: 1,
      borderColor: "rgba(111,23,19,0.28)",
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
      includeFontPadding: false,
      textAlignVertical: "center",
    },

    registerButtonWrapper: {
      width: "100%",
      height: buttonHeight,
      borderRadius: buttonRadius,
      overflow: "hidden",
      shadowColor: "transparent",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
      borderWidth: 1.3,
      borderColor: COLORS.glassBorder,
      backgroundColor: "rgba(255,255,255,0.62)",
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
      includeFontPadding: false,
      textAlignVertical: "center",
    },
  });
}