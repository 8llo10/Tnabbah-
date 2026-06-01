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
import { useLanguage } from "../providers/LanguageProvider";
import { useAppSettings } from "../providers/AppSettingsProvider";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";
import {
  Alexandria_400Regular,
  Alexandria_600SemiBold,
  Alexandria_700Bold,
  Alexandria_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/alexandria";

SplashScreen.preventAutoHideAsync().catch(() => {});

const START_BACKGROUND_LIGHT = require("../assets/images/start-intro-light.png");
const START_BACKGROUND_DARK = require("../assets/images/start-intro-dark.png");

const LOGO_ARABIC_LIGHT = require("../assets/images/logo-arabic-light.png");
const LOGO_ENGLISH_LIGHT = require("../assets/images/logo-english-light.png");
const LOGO_ARABIC_DARK = require("../assets/images/logo-arabic-dark.png");
const LOGO_ENGLISH_DARK = require("../assets/images/logo-english-dark.png");

const LIGHT_COLORS = {
  appBackground: "#F7F7F7",

  primary: "#9A211C",
  primaryDark: "#761713",

  titleMain: "#202020",
  titleAccent: "#9A211C",
  subtitle: "#303030",

  white: "#FFFFFF",
  buttonText: "#FFFFFF",

  secondaryButtonBg: "rgba(255,255,255,0.62)",
  secondaryButtonBorder: "rgba(154,33,28,0.28)",
  secondaryButtonText: "#9A211C",

  glassBg: "rgba(255,255,255,0.62)",
  glassBorder: "rgba(154,33,28,0.28)",

  stepActive: "#9A211C",
  stepInactive: "rgba(90,90,90,0.30)",
  stepText: "rgba(32,32,32,0.78)",

  logoLine: "#9A211C",
  logoLineBorder: "rgba(154,33,28,0.10)",

  languageIcon: "#9A211C",
  languageText: "#202020",
  languageDivider: "rgba(32,32,32,0.24)",

  overlayTop: "rgba(255,255,255,0.00)",
  overlayMiddle: "rgba(255,255,255,0.00)",
  overlayBottom: "rgba(255,255,255,0.00)",

  shadow: "rgba(255,255,255,0.60)",
  buttonShadow: "#6E1411",

  transitionOverlay: "rgba(255,255,255,0.72)",
};

const DARK_COLORS = {
  appBackground: "#101010",

  primary: "#B63A34",
  primaryDark: "#871B17",

  titleMain: "#FFFFFF",
  titleAccent: "#B63A34",
  subtitle: "#FFFFFF",

  white: "#FFFFFF",
  buttonText: "#FFFFFF",

  secondaryButtonBg: "rgba(255,255,255,0.14)",
  secondaryButtonBorder: "rgba(182,58,52,0.34)",
  secondaryButtonText: "#FFFFFF",

  glassBg: "rgba(255,255,255,0.14)",
  glassBorder: "rgba(182,58,52,0.34)",

  stepActive: "#B63A34",
  stepInactive: "rgba(255,255,255,0.26)",
  stepText: "rgba(255,255,255,0.78)",

  logoLine: "#B63A34",
  logoLineBorder: "rgba(182,58,52,0.18)",

  languageIcon: "#B63A34",
  languageText: "#FFFFFF",
  languageDivider: "rgba(255,255,255,0.28)",

  overlayTop: "rgba(0,0,0,0.00)",
  overlayMiddle: "rgba(0,0,0,0.00)",
  overlayBottom: "rgba(0,0,0,0.00)",

  shadow: "rgba(0,0,0,0.42)",
  buttonShadow: "#000000",

  transitionOverlay: "rgba(21,21,21,0.78)",
};

type StartColors = typeof LIGHT_COLORS;
type StepNumber = 1 | 2;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const FONT_SEMIBOLD = "Alexandria_600SemiBold";
const FONT_BOLD = "Alexandria_700Bold";
const FONT_EXTRABOLD = "Alexandria_800ExtraBold";

export default function StartScreen() {
  const router = useRouter();
  const { t, isArabic, language, changeLanguage } = useLanguage();
  const { darkModeEnabled } = useAppSettings();

  const [fontsLoaded] = useFonts({
    Alexandria_400Regular,
    Alexandria_600SemiBold,
    Alexandria_700Bold,
    Alexandria_800ExtraBold,
  });

  const COLORS = darkModeEnabled ? DARK_COLORS : LIGHT_COLORS;

  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const [activeStep, setActiveStep] = useState<StepNumber>(1);
  const [isNavigating, setIsNavigating] = useState(false);

  const isSmallScreen = height < 720;
  const isVerySmallScreen = height < 650;
  const isTabletLike = width >= 768;

  const horizontalPadding = isTabletLike
    ? clamp(width * 0.055, 36, 54)
    : clamp(width * 0.055, 18, 24);

  const splashLogoWidth = isTabletLike
    ? clamp(width * 0.36, 250, 305)
    : clamp(width * 0.62, 205, 248);

  const splashLogoHeight = splashLogoWidth * (240 / 270);

  const finalLogoWidth = isTabletLike
    ? clamp(width * 0.11, 80, 94)
    : clamp(width * 0.185, 64, 82);

  const finalLogoHeight = finalLogoWidth * (64 / 88);

  const headerTop = clamp(height * 0.014, 6, 14);

  const backgroundImage = useMemo(() => {
    return darkModeEnabled ? START_BACKGROUND_DARK : START_BACKGROUND_LIGHT;
  }, [darkModeEnabled]);

  const logoArabic = darkModeEnabled ? LOGO_ARABIC_DARK : LOGO_ARABIC_LIGHT;
  const logoEnglish = darkModeEnabled ? LOGO_ENGLISH_DARK : LOGO_ENGLISH_LIGHT;

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
        isTabletLike,
        width,
        height,
        COLORS,
        isArabic,
        language,
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
      isTabletLike,
      width,
      height,
      COLORS,
      isArabic,
      language,
    ]
  );

  const contentAnim = useRef(new Animated.Value(0)).current;

  const stepOpacityAnim = useRef(new Animated.Value(1)).current;
  const stepTranslateAnim = useRef(new Animated.Value(0)).current;

  const exitOpacityAnim = useRef(new Animated.Value(1)).current;
  const exitTranslateAnim = useRef(new Animated.Value(0)).current;
  const transitionOverlayAnim = useRef(new Animated.Value(0)).current;

  const logoMoveAnim = useRef(new Animated.Value(0)).current;
  const logoFinishAnim = useRef(new Animated.Value(0)).current;

  const lineAnim = useRef(new Animated.Value(0)).current;
  const arabicAnim = useRef(new Animated.Value(0)).current;
  const englishAnim = useRef(new Animated.Value(0)).current;

  const animationStarted = useRef(false);
  const splashHidden = useRef(false);
  const shouldOpenAuthOnReturnRef = useRef(false);

  const startIntroAnimation = () => {
    if (animationStarted.current) return;
    animationStarted.current = true;

    Animated.sequence([
      Animated.delay(120),

      Animated.timing(lineAnim, {
        toValue: 1,
        duration: 760,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),

      Animated.delay(60),

      Animated.parallel([
        Animated.timing(arabicAnim, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(englishAnim, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),

      Animated.delay(460),

      Animated.parallel([
        Animated.timing(logoMoveAnim, {
          toValue: 1,
          duration: 780,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),

        Animated.timing(contentAnim, {
          toValue: 1,
          duration: 600,
          delay: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),

        Animated.timing(logoFinishAnim, {
          toValue: 1,
          duration: 600,
          delay: 340,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  };

  const hideSplashAfterReady = async () => {
    if (splashHidden.current || !fontsLoaded) return;

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
    hideSplashAfterReady();
  }, [fontsLoaded]);

  useFocusEffect(
    useCallback(() => {
      const shouldOpenAuthStep = shouldOpenAuthOnReturnRef.current;

      setIsNavigating(false);
      setActiveStep(shouldOpenAuthStep ? 2 : 1);

      exitOpacityAnim.setValue(1);
      exitTranslateAnim.setValue(0);
      transitionOverlayAnim.setValue(0);

      stepOpacityAnim.setValue(1);
      stepTranslateAnim.setValue(0);

      if (shouldOpenAuthStep) {
        contentAnim.setValue(1);
        logoMoveAnim.setValue(1);
        logoFinishAnim.setValue(1);
        lineAnim.setValue(1);
        arabicAnim.setValue(1);
        englishAnim.setValue(1);
        animationStarted.current = true;
        return () => {};
      }

      contentAnim.setValue(0);
      logoMoveAnim.setValue(0);
      logoFinishAnim.setValue(0);
      lineAnim.setValue(0);
      arabicAnim.setValue(0);
      englishAnim.setValue(0);

      animationStarted.current = false;

      if (splashHidden.current && fontsLoaded) {
        requestAnimationFrame(() => {
          startIntroAnimation();
        });
      }

      return () => {};
    }, [
      fontsLoaded,
      contentAnim,
      stepOpacityAnim,
      stepTranslateAnim,
      exitOpacityAnim,
      exitTranslateAnim,
      transitionOverlayAnim,
      logoMoveAnim,
      logoFinishAnim,
      lineAnim,
      arabicAnim,
      englishAnim,
    ])
  );

  const goToFirstStep = () => {
    if (isNavigating || activeStep === 1) return;

    shouldOpenAuthOnReturnRef.current = false;

    Animated.parallel([
      Animated.timing(stepOpacityAnim, {
        toValue: 0,
        duration: 120,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(stepTranslateAnim, {
        toValue: 26,
        duration: 120,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setActiveStep(1);
      stepOpacityAnim.setValue(0);
      stepTranslateAnim.setValue(-22);

      Animated.parallel([
        Animated.timing(stepOpacityAnim, {
          toValue: 1,
          duration: 210,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(stepTranslateAnim, {
          toValue: 0,
          duration: 210,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const goToSecondStep = () => {
    if (isNavigating || activeStep === 2) return;

    shouldOpenAuthOnReturnRef.current = true;

    Animated.parallel([
      Animated.timing(stepOpacityAnim, {
        toValue: 0,
        duration: 120,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(stepTranslateAnim, {
        toValue: -26,
        duration: 120,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setActiveStep(2);
      stepOpacityAnim.setValue(0);
      stepTranslateAnim.setValue(22);

      Animated.parallel([
        Animated.timing(stepOpacityAnim, {
          toValue: 1,
          duration: 210,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(stepTranslateAnim, {
          toValue: 0,
          duration: 210,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const smoothNavigate = (path: "/login" | "/register") => {
    if (isNavigating) return;

    shouldOpenAuthOnReturnRef.current = true;
    setIsNavigating(true);

    Animated.parallel([
      Animated.timing(exitOpacityAnim, {
        toValue: 0.92,
        duration: 170,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(exitTranslateAnim, {
        toValue: -8,
        duration: 170,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(transitionOverlayAnim, {
        toValue: 1,
        duration: 210,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => {
      requestAnimationFrame(() => {
        router.push(path);
      });
    });
  };

  const toggleLanguage = () => {
    const nextLanguage = language === "AR" ? "EN" : "AR";
    changeLanguage(nextLanguage);
  };

  const stepOneLabel = t.startStepOne || (isArabic ? "١ من ٢" : "1 of 2");
  const stepTwoLabel = t.startStepTwo || (isArabic ? "٢ من ٢" : "2 of 2");

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

  const animatedLineWidth = lineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, splashLogoWidth * 0.86],
  });

  const arabicTranslateY = arabicAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 0],
  });

  const arabicOpacity = arabicAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const englishTranslateY = englishAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-20, 0],
  });

  const englishOpacity = englishAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const logoSoftLift = logoFinishAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -3],
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={styles.container}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={darkModeEnabled ? "light-content" : "dark-content"}
      />

      <Image
        source={backgroundImage}
        style={styles.realBackground}
        resizeMode="cover"
        fadeDuration={0}
        blurRadius={0}
      />

      <LinearGradient
        pointerEvents="none"
        colors={[COLORS.overlayTop, COLORS.overlayMiddle, COLORS.overlayBottom]}
        locations={[0, 0.48, 1]}
        style={styles.backgroundGradientLayer}
      />

      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <Animated.View
          style={[
            styles.fullContent,
            {
              opacity: Animated.multiply(contentOpacity, exitOpacityAnim),
              transform: [
                {
                  translateY: Animated.add(
                    contentTranslateY,
                    exitTranslateAnim
                  ),
                },
              ],
            },
          ]}
        >
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.langButtonWrapper}
              activeOpacity={0.78}
              onPress={toggleLanguage}
              disabled={isNavigating}
            >
              <View style={styles.langButtonInner}>
                <Feather name="globe" size={18} color={COLORS.languageIcon} />

                <View style={styles.langDivider} />

                <Text style={styles.langText} numberOfLines={1}>
                  {language === "AR" ? "English" : "العربية"}
                </Text>
              </View>
            </TouchableOpacity>

            <View style={styles.logoPlaceholder} />
          </View>

          <Animated.View
            style={[
              styles.stepContentWrapper,
              {
                opacity: stepOpacityAnim,
                transform: [{ translateY: stepTranslateAnim }],
              },
            ]}
          >
            {activeStep === 1 ? (
              <View style={styles.introContent}>
                <View style={styles.textGroup}>
                  {isArabic ? (
                    <Text style={styles.introTitle}>
                      {t.startIntroTitleBefore}{" "}
                      <Text style={styles.titleAccent}>
                        {t.startIntroTitleAccent}
                      </Text>
                      {"\n"}
                      {t.startIntroTitleAfter}
                    </Text>
                  ) : (
                    <Text style={styles.introTitleEnglish}>
                      {t.startIntroTitleBefore}{" "}
                      <Text style={styles.titleAccent}>
                        {t.startIntroTitleAccent}
                      </Text>
                      {"\n"}
                      {t.startIntroTitleAfter}
                    </Text>
                  )}

                  <Text style={styles.introSubtitle}>
                    {t.startIntroSubtitle}
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.authContent}>
                <View style={styles.textGroup}>
                  <Text
                    style={styles.authTitle}
                    numberOfLines={2}
                    adjustsFontSizeToFit={false}
                  >
                    {t.startAuthTitleBefore}{" "}
                    <Text style={styles.titleAccent}>
                      {t.startAuthTitleAccent}
                    </Text>
                  </Text>

                  <Text style={styles.authSubtitle}>
                    {t.startAuthSubtitle}
                  </Text>
                </View>
              </View>
            )}

            <View
              style={[
                styles.bottomArea,
                activeStep === 2 && styles.authBottomArea,
              ]}
            >
              <StepIndicator
                activeStep={activeStep}
                colors={COLORS}
                label={activeStep === 1 ? stepOneLabel : stepTwoLabel}
                onBackToIntro={activeStep === 2 ? goToFirstStep : undefined}
              />

              {activeStep === 1 ? (
                <TouchableOpacity
                  style={styles.primaryButtonWrapper}
                  onPress={goToSecondStep}
                  activeOpacity={0.88}
                  disabled={isNavigating}
                >
                  <LinearGradient
                    colors={[COLORS.primary, COLORS.primaryDark]}
                    start={{ x: 0.15, y: 0 }}
                    end={{ x: 0.9, y: 1 }}
                    style={styles.primaryGradient}
                  >
                    <View style={styles.primaryShine} />

                    <Text style={styles.primaryButtonText}>
                      {t.startIntroButton}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              ) : (
                <View style={styles.authButtonsArea}>
                  <TouchableOpacity
                    style={styles.primaryButtonWrapper}
                    onPress={() => smoothNavigate("/login")}
                    activeOpacity={0.88}
                    disabled={isNavigating}
                  >
                    <LinearGradient
                      colors={[COLORS.primary, COLORS.primaryDark]}
                      start={{ x: 0.15, y: 0 }}
                      end={{ x: 0.9, y: 1 }}
                      style={styles.primaryGradient}
                    >
                      <View style={styles.primaryShine} />

                      <Text style={styles.primaryButtonText}>
                        {t.startLoginButton}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.secondaryButtonWrapper}
                    onPress={() => smoothNavigate("/register")}
                    activeOpacity={0.78}
                    disabled={isNavigating}
                  >
                    <Text style={styles.secondaryButtonText}>
                      {t.startCreateAccountButton}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </Animated.View>
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
          source={logoArabic}
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
          source={logoEnglish}
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
            opacity: transitionOverlayAnim,
          },
        ]}
      />
    </View>
  );
}

function StepIndicator({
  activeStep,
  colors,
  label,
  onBackToIntro,
}: {
  activeStep: StepNumber;
  colors: StartColors;
  label: string;
  onBackToIntro?: () => void;
}) {
  return (
    <View style={stepStyles.wrapper}>
      <View style={stepStyles.dotsRow}>
        <TouchableOpacity
          activeOpacity={activeStep === 2 ? 0.75 : 1}
          onPress={onBackToIntro}
          disabled={activeStep === 1 || !onBackToIntro}
        >
          <View
            style={[
              stepStyles.dot,
              {
                width: activeStep === 1 ? 28 : 10,
                backgroundColor:
                  activeStep === 1 ? colors.stepActive : colors.stepInactive,
              },
            ]}
          />
        </TouchableOpacity>

        <View
          style={[
            stepStyles.dot,
            {
              width: activeStep === 2 ? 28 : 10,
              backgroundColor:
                activeStep === 2 ? colors.stepActive : colors.stepInactive,
            },
          ]}
        />
      </View>

      <Text style={[stepStyles.label, { color: colors.stepText }]}>
        {label}
      </Text>
    </View>
  );
}

const stepStyles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },

  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    marginBottom: 7,
  },

  dot: {
    height: 5,
    borderRadius: 999,
  },

  label: {
    fontFamily: FONT_SEMIBOLD,
    fontSize: 11.5,
    includeFontPadding: true,
    textAlignVertical: "center",
  },
});

function createStyles({
  horizontalPadding,
  splashLogoWidth,
  splashLogoHeight,
  finalLogoWidth,
  finalLogoHeight,
  headerTop,
  isSmallScreen,
  isVerySmallScreen,
  isTabletLike,
  width,
  height,
  COLORS,
  isArabic,
  language,
}: {
  horizontalPadding: number;
  splashLogoWidth: number;
  splashLogoHeight: number;
  finalLogoWidth: number;
  finalLogoHeight: number;
  headerTop: number;
  isSmallScreen: boolean;
  isVerySmallScreen: boolean;
  isTabletLike: boolean;
  width: number;
  height: number;
  COLORS: StartColors;
  isArabic: boolean;
  language: string;
}) {
  const buttonHeight = isTabletLike ? 64 : isVerySmallScreen ? 54 : 58;
  const buttonRadius = 34;
  const glassRadius = buttonRadius;

  const introTitleSize = isTabletLike
    ? 38
    : isVerySmallScreen
    ? 28
    : isSmallScreen
    ? 31
    : 34;

  const authTitleSize = isTabletLike
    ? 36
    : isVerySmallScreen
    ? 28
    : isSmallScreen
    ? 31
    : 34;

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

    backgroundGradientLayer: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 2,
    },

    safeArea: {
      flex: 1,
      zIndex: 5,
    },

    fullContent: {
      flex: 1,
      paddingHorizontal: horizontalPadding,
      paddingTop: headerTop,
      paddingBottom: isVerySmallScreen ? 4 : 8,
      zIndex: 5,
    },

    stepContentWrapper: {
      flex: 1,
      justifyContent: "space-between",
      paddingTop: 0,
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
      height: isTabletLike ? 44 : 42,
      minWidth: language === "AR" ? 126 : 118,
      borderRadius: glassRadius,
      overflow: "hidden",
      borderWidth: 1.15,
      borderColor: COLORS.glassBorder,
      backgroundColor: COLORS.glassBg,
      marginLeft: -4,
    },

    langButtonInner: {
      flex: 1,
      paddingHorizontal: 14,
      borderRadius: glassRadius,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 9,
    },

    langDivider: {
      width: 1,
      height: 20,
      backgroundColor: COLORS.languageDivider,
    },

    langText: {
      fontFamily: FONT_BOLD,
      fontSize: isTabletLike ? 14.8 : 14.4,
      lineHeight: isTabletLike ? 22 : 21,
      color: COLORS.languageText,
      includeFontPadding: true,
      textAlignVertical: "center",
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
      width: splashLogoWidth * 0.78,
      height: splashLogoHeight * 0.435,
      marginBottom: splashLogoHeight * 0.04,
    },

    logoLineContainer: {
      width: splashLogoWidth * 0.88,
      height: 12,
      alignItems: "center",
      justifyContent: "center",
      overflow: "visible",
    },

    logoLine: {
      height: 5.8,
      borderRadius: 999,
      backgroundColor: COLORS.logoLine,
      borderWidth: 0.8,
      borderColor: COLORS.logoLineBorder,
    },

    logoEnglish: {
      width: splashLogoWidth * 1.18,
      height: splashLogoHeight * 0.37,
      marginTop: splashLogoHeight * 0.012,
    },

    introContent: {
      flex: 1,
      width: "100%",
      alignItems: "center",
      justifyContent: "flex-start",
      paddingTop: isTabletLike
        ? height * 0.025
        : isVerySmallScreen
        ? height * 0.025
        : isSmallScreen
        ? height * 0.035
        : height * 0.045,
    },

    authContent: {
      flex: 1,
      width: "100%",
      alignItems: "center",
      justifyContent: "flex-start",
      paddingTop: isTabletLike
        ? height * 0.07
        : isVerySmallScreen
        ? height * 0.06
        : isSmallScreen
        ? height * 0.075
        : height * 0.085,
    },

    textGroup: {
      width: "100%",
      alignItems: "center",
      justifyContent: "center",
    },

    introTitle: {
      fontFamily: FONT_EXTRABOLD,
      fontSize: introTitleSize,
      lineHeight: introTitleSize + 18,
      color: COLORS.titleMain,
      textAlign: "center",
      letterSpacing: -0.7,
      includeFontPadding: true,
      textAlignVertical: "center",
      writingDirection: isArabic ? "rtl" : "ltr",
      textShadowColor: COLORS.shadow,
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 1.4,
      paddingTop: 6,
      paddingBottom: 4,
    },

    introTitleEnglish: {
      fontFamily: FONT_EXTRABOLD,
      width: isTabletLike ? 420 : width * 0.9,
      fontSize: isTabletLike
        ? 36
        : isVerySmallScreen
        ? 27
        : isSmallScreen
        ? 30
        : 33,
      lineHeight: isTabletLike
        ? 50
        : isVerySmallScreen
        ? 39
        : isSmallScreen
        ? 42
        : 46,
      color: COLORS.titleMain,
      textAlign: "center",
      letterSpacing: -0.8,
      includeFontPadding: true,
      textAlignVertical: "center",
      writingDirection: "ltr",
      textShadowColor: COLORS.shadow,
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 1.4,
      paddingTop: 6,
      paddingBottom: 4,
    },

    authTitle: {
      fontFamily: FONT_EXTRABOLD,
      width: isTabletLike ? 460 : width * 0.96,
      fontSize: authTitleSize,
      lineHeight: authTitleSize + 18,
      color: COLORS.titleMain,
      textAlign: "center",
      letterSpacing: -0.4,
      includeFontPadding: true,
      textAlignVertical: "center",
      writingDirection: isArabic ? "rtl" : "ltr",
      textShadowColor: COLORS.shadow,
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 1.4,
      paddingTop: 6,
      paddingBottom: 6,
      paddingHorizontal: 8,
    },

    titleAccent: {
      fontFamily: FONT_EXTRABOLD,
      color: COLORS.primary,
    },

    introSubtitle: {
      fontFamily: FONT_SEMIBOLD,
      marginTop: isVerySmallScreen ? 20 : 26,
      fontSize: isTabletLike ? 16 : isVerySmallScreen ? 13.8 : 14.7,
      lineHeight: isTabletLike ? 29 : isVerySmallScreen ? 25 : 28,
      color: COLORS.subtitle,
      textAlign: "center",
      maxWidth: isTabletLike ? 430 : clamp(width * 0.86, 295, 360),
      includeFontPadding: true,
      textAlignVertical: "center",
      writingDirection: isArabic ? "rtl" : "ltr",
      textShadowColor: COLORS.shadow,
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 1.2,
    },

    authSubtitle: {
      fontFamily: FONT_SEMIBOLD,
      marginTop: isVerySmallScreen ? 12 : 16,
      fontSize: isTabletLike ? 15.8 : isVerySmallScreen ? 13.9 : 14.8,
      lineHeight: isTabletLike ? 28 : isVerySmallScreen ? 25 : 28,
      color: COLORS.subtitle,
      textAlign: "center",
      maxWidth: isTabletLike ? 360 : clamp(width * 0.64, 235, 285),
      includeFontPadding: true,
      textAlignVertical: "center",
      writingDirection: isArabic ? "rtl" : "ltr",
      textShadowColor: COLORS.shadow,
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 1.2,
    },

    bottomArea: {
      width: "100%",
      alignItems: "center",
      justifyContent: "flex-end",
      marginBottom: isVerySmallScreen ? -2 : 0,
    },

    authBottomArea: {
      marginBottom: isVerySmallScreen ? -8 : -12,
    },

    authButtonsArea: {
      width: "100%",
      gap: isVerySmallScreen ? 12 : 14,
    },

    primaryButtonWrapper: {
      width: isTabletLike ? 430 : "100%",
      height: buttonHeight,
      borderRadius: buttonRadius,
      overflow: "hidden",
      shadowColor: COLORS.buttonShadow,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: Platform.OS === "android" ? 0.18 : 0.24,
      shadowRadius: 14,
      elevation: 6,
      backgroundColor: COLORS.primary,
    },

    primaryGradient: {
      flex: 1,
      borderRadius: buttonRadius,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      paddingTop: Platform.OS === "android" ? 1 : 0,
    },

    primaryShine: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: "48%",
      backgroundColor: "rgba(255,255,255,0.10)",
      borderTopLeftRadius: buttonRadius,
      borderTopRightRadius: buttonRadius,
    },

    primaryButtonText: {
      fontFamily: FONT_EXTRABOLD,
      color: COLORS.buttonText,
      fontSize: isTabletLike ? 19.5 : isVerySmallScreen ? 17.4 : 18.4,
      lineHeight: isTabletLike ? 31 : isVerySmallScreen ? 28 : 30,
      includeFontPadding: true,
      textAlignVertical: "center",
      letterSpacing: -0.15,
      paddingTop: Platform.OS === "ios" ? 1 : 0,
      paddingBottom: Platform.OS === "ios" ? 1 : 0,
    },

    secondaryButtonWrapper: {
      width: isTabletLike ? 430 : "100%",
      height: buttonHeight,
      borderRadius: glassRadius,
      overflow: "hidden",
      backgroundColor: COLORS.secondaryButtonBg,
      borderWidth: 1.15,
      borderColor: COLORS.secondaryButtonBorder,
      alignItems: "center",
      justifyContent: "center",
      paddingTop: Platform.OS === "android" ? 1 : 0,
    },

    secondaryButtonText: {
      fontFamily: FONT_EXTRABOLD,
      color: COLORS.secondaryButtonText,
      fontSize: isTabletLike ? 18.8 : isVerySmallScreen ? 17.2 : 18.2,
      lineHeight: isTabletLike ? 30 : isVerySmallScreen ? 28 : 30,
      includeFontPadding: true,
      textAlignVertical: "center",
      letterSpacing: -0.15,
      paddingTop: Platform.OS === "ios" ? 1 : 0,
      paddingBottom: Platform.OS === "ios" ? 1 : 0,
    },

    transitionOverlay: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 100,
      backgroundColor: COLORS.transitionOverlay,
    },
  });
}