import {
  View,
  Text,
  TouchableOpacity,
  ImageBackground,
  StyleSheet,
  Animated,
  Easing,
  useWindowDimensions,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../providers/AuthProvider";
import { useEffect, useMemo, useRef, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";

// الصور
const BACKGROUND_IMAGE = require("../assets/images/start-background.png");
const LOGO_ARABIC = require("../assets/images/logo-arabic.png");
const LOGO_ENGLISH = require("../assets/images/logo-english.png");

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export default function StartScreen() {
  const router = useRouter();
  const { session, loading } = useAuth();

  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const [language, setLanguage] = useState<"ar" | "en">("ar");

  const isArabic = language === "ar";
  const isSmallScreen = height < 720;
  const isVerySmallScreen = height < 650;

  const horizontalPadding = clamp(width * 0.055, 20, 24);

  const splashLogoWidth = clamp(width * 0.72, 220, 270);
  const splashLogoHeight = splashLogoWidth * (210 / 270);

  const finalLogoWidth = clamp(width * 0.23, 80, 90);
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
    ]
  );

  const contentAnim = useRef(new Animated.Value(0)).current;
  const glassLayerAnim = useRef(new Animated.Value(0)).current;
  const logoMoveAnim = useRef(new Animated.Value(0)).current;
  const lineAnim = useRef(new Animated.Value(0)).current;
  const arabicAnim = useRef(new Animated.Value(0)).current;
  const englishAnim = useRef(new Animated.Value(0)).current;

  const animationStarted = useRef(false);

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === "ar" ? "en" : "ar"));
  };

  useEffect(() => {
    if (animationStarted.current) return;
    animationStarted.current = true;

    const timer = setTimeout(() => {
      const animation = Animated.sequence([
        // الخط يمشي بهدوء
        Animated.timing(lineAnim, {
          toValue: 1,
          duration: 1100,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),

        Animated.delay(120),

        // ظهور اللوقو العربي والإنجليزي
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

        // اللوقو يثبت شوي قبل ما يطلع فوق
        Animated.delay(950),

        // اللوقو يطلع فوق ويصغر، وبعدها تظهر الواجهة
        Animated.parallel([
          Animated.timing(logoMoveAnim, {
            toValue: 1,
            duration: 950,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),

          Animated.timing(glassLayerAnim, {
            toValue: 1,
            duration: 850,
            delay: 420,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),

          Animated.timing(contentAnim, {
            toValue: 1,
            duration: 750,
            delay: 520,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ]);

      animation.start();
    }, 450);

    return () => clearTimeout(timer);
  }, [
    lineAnim,
    arabicAnim,
    englishAnim,
    logoMoveAnim,
    glassLayerAnim,
    contentAnim,
  ]);

  useEffect(() => {
    if (!loading && session) {
      // لو تبغين بعدين المستخدم المسجل يدخل للهوم مباشرة:
      // router.replace("/(tabs)/home");
    }
  }, [loading, session, router]);

  // بداية اللوقو فوق النص شوي عشان يكون واضح مع الخلفية
  const startX = width / 2 - splashLogoWidth / 2;
  const startY = height / 2 - splashLogoHeight / 2 - 85;

  // مكان اللوقو النهائي فوق اليمين
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
    <ImageBackground
      source={BACKGROUND_IMAGE}
      style={styles.container}
      imageStyle={styles.backgroundImage}
      resizeMode="cover"
    >
      <StatusBar barStyle="dark-content" />

      {/* تغبيش زجاجي خفيف يظهر بعد اللوقو */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.backgroundGlassLayer,
          {
            opacity: glassLayerOpacity,
          },
        ]}
      >
        <BlurView
          intensity={12}
          tint="light"
          style={StyleSheet.absoluteFillObject}
        >
          <LinearGradient
            colors={[
              "rgba(255,255,255,0.13)",
              "rgba(255,255,255,0.05)",
              "rgba(255,255,255,0.11)",
            ]}
            locations={[0, 0.5, 1]}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
        </BlurView>
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
          {/* الهيدر */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.langButtonWrapper}
              activeOpacity={0.85}
              onPress={toggleLanguage}
            >
              <BlurView intensity={10} tint="light" style={styles.langBlur}>
                <LinearGradient
                  colors={[
                    "rgba(255,255,255,0.48)",
                    "rgba(255,255,255,0.24)",
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.langButtonGradient}
                >
                  <Feather name="globe" size={18} color="#871B17" />
                  <View style={styles.langDivider} />

                  <Text style={styles.langText}>
                    {isArabic ? "En" : "عربي"}
                  </Text>
                </LinearGradient>
              </BlurView>
            </TouchableOpacity>

            <View style={styles.logoPlaceholder} />
          </View>

          {/* النص بدون مربع */}
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

          {/* الأزرار */}
          <View style={styles.buttonsArea}>
            <TouchableOpacity
              style={styles.loginButtonWrapper}
              onPress={() => router.push("/login")}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={["rgba(154,33,28,0.98)", "rgba(118,23,19,0.98)"]}
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
              onPress={() => router.push("/register")}
              activeOpacity={0.9}
            >
              <BlurView intensity={10} tint="light" style={styles.registerBlur}>
                <LinearGradient
                  colors={[
                    "rgba(255,255,255,0.50)",
                    "rgba(255,255,255,0.28)",
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.registerGradient}
                >
                  <Text style={styles.registerText}>
                    {isArabic ? "إنشاء حساب جديد" : "Create Account"}
                  </Text>
                </LinearGradient>
              </BlurView>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </SafeAreaView>

      {/* اللوقو */}
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
            style={[
              styles.logoLine,
              {
                width: animatedLineWidth,
              },
            ]}
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
    </ImageBackground>
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
}: {
  horizontalPadding: number;
  splashLogoWidth: number;
  splashLogoHeight: number;
  finalLogoWidth: number;
  finalLogoHeight: number;
  headerTop: number;
  isSmallScreen: boolean;
  isVerySmallScreen: boolean;
}) {
  return StyleSheet.create({
    container: {
      flex: 1,
      overflow: "hidden",
      backgroundColor: "#EFE7DE",
    },

    backgroundImage: {
      opacity: 1,
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
      backgroundColor: "#B86B69",
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
      shadowOpacity: 0.1,
      shadowRadius: 14,
      elevation: 5,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.58)",
    },

    langBlur: {
      flex: 1,
      borderRadius: 26,
      overflow: "hidden",
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
      color: "#871B17",
      fontWeight: "800",
    },

    centerContent: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",

      // زيدي الأرقام لو تبغين الكلام يطلع فوق أكثر
      paddingBottom: isVerySmallScreen ? 145 : isSmallScreen ? 180 : 210,
    },

    textGroup: {
      width: "100%",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 12,
    },

    title: {
      fontSize: isVerySmallScreen ? 25 : isSmallScreen ? 30 : 32,
      fontWeight: "900",
      color: "#7B1714",
      textAlign: "center",
      letterSpacing: -0.7,
      lineHeight: isVerySmallScreen ? 36 : 43,

      // يخلي العنوان واضح فوق الخلفية
      textShadowColor: "rgba(255,255,255,0.95)",
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 14,
    },

    titleBrand: {
      color: "#9A211C",
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
      color: "#2C2C2C",
      fontWeight: "800",
      textAlign: "center",
      maxWidth: 310,

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
      height: isVerySmallScreen ? 58 : 64,
      borderRadius: 30,
      overflow: "hidden",
      shadowColor: "#6E1411",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.24,
      shadowRadius: 14,
      elevation: 6,
    },

    loginGradient: {
      flex: 1,
      borderRadius: 30,
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
      borderTopLeftRadius: 30,
      borderTopRightRadius: 30,
    },

    loginText: {
      color: "#FFFFFF",
      fontSize: isVerySmallScreen ? 19 : 21,
      fontWeight: "900",
    },

    registerButtonWrapper: {
      width: "100%",
      height: isVerySmallScreen ? 58 : 64,
      borderRadius: 30,
      overflow: "hidden",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.1,
      shadowRadius: 15,
      elevation: 5,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.58)",
    },

    registerBlur: {
      flex: 1,
      borderRadius: 30,
      overflow: "hidden",
    },

    registerGradient: {
      flex: 1,
      borderRadius: 30,
      justifyContent: "center",
      alignItems: "center",
      overflow: "hidden",
    },

    registerText: {
      color: "#871B17",
      fontSize: isVerySmallScreen ? 18 : 20,
      fontWeight: "900",
    },
  });

}