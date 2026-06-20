import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { supabase } from "../lib/supabase";

import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  ActivityIndicator,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  useWindowDimensions,
  Animated,
  Easing,
  StatusBar,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";
import { Feather, Ionicons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Alexandria_400Regular,
  Alexandria_600SemiBold,
  Alexandria_700Bold,
  Alexandria_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/alexandria";
import { useLanguage } from "../providers/LanguageProvider";
import { useAppSettings } from "../providers/AppSettingsProvider";

const LIGHT_COLORS = {
  screenBackground: "#FFFFFF",
  nextScreenBackground: "#FFFFFF",

  primary: "#9A211C",
  primaryDark: "#761713",
  buttonGradientStart: "#9A211C",
  buttonGradientEnd: "#761713",
  primaryText: "#871B17",

  title: "#202020",
  textDark: "#2C2C2C",
  inputText: "#2E1D1D",

  label: "#6C5B58",
  muted: "#6C5B58",
  placeholder: "#A8A8A8",
  border: "#DCDCDC",

  shadowGray: "#000000",
  white: "#FFFFFF",

  error: "#D32F2F",
  errorSoft: "rgba(211,47,47,0.045)",
  errorBorder: "rgba(211,47,47,0.55)",

  inputBackground: "#FFFFFF",
  inputErrorBackground: "rgba(211,47,47,0.045)",
  titleShadow: "rgba(255,255,255,0.95)",
  subtitleShadow: "rgba(255,255,255,0.90)",
  overlayShadow: "#6E1411",
};

const DARK_COLORS = {
  screenBackground: "#151515",
  nextScreenBackground: "#151515",

  primary: "#C8564E",
  primaryDark: "#C8564E",
  buttonGradientStart: "#B63A34",
  buttonGradientEnd: "#871B17",
  primaryText: "#C8564E",

  title: "#FFFFFF",
  textDark: "#FFFFFF",
  inputText: "#FFFFFF",

  label: "#D6D6D6",
  muted: "#C7C7C7",
  placeholder: "#8E8E8E",
  border: "#383838",

  shadowGray: "#000000",
  white: "#FFFFFF",

  error: "#EF7676",
  errorSoft: "rgba(239,118,118,0.10)",
  errorBorder: "rgba(239,118,118,0.45)",

  inputBackground: "#202020",
  inputErrorBackground: "rgba(239,118,118,0.10)",
  titleShadow: "transparent",
  subtitleShadow: "transparent",
  overlayShadow: "#000000",
};

type AppColors = typeof LIGHT_COLORS | typeof DARK_COLORS;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const FONT_REGULAR = "Alexandria_400Regular";
const FONT_SEMIBOLD = "Alexandria_600SemiBold";
const FONT_BOLD = "Alexandria_700Bold";
const FONT_EXTRABOLD = "Alexandria_800ExtraBold";

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string; from?: string }>();
  const { t, isArabic } = useLanguage();
  const { darkModeEnabled } = useAppSettings();
  const [fontsLoaded] = useFonts({
    Alexandria_400Regular,
    Alexandria_600SemiBold,
    Alexandria_700Bold,
    Alexandria_800ExtraBold,
  });

  const COLORS = darkModeEnabled ? DARK_COLORS : LIGHT_COLORS;

  const textAlign = isArabic ? "right" : "left";
  const rowDirection = isArabic ? "row-reverse" : "row";
  const iconMargin = isArabic ? { marginLeft: 10 } : { marginRight: 10 };

  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const initialEmail = String(params.email || "").trim().toLowerCase();
  const from = String(params.from || "");

  const [email, setEmail] = useState(initialEmail);
  const [errorMessage, setErrorMessage] = useState("");

  const [loading, setLoading] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  const screenOpacity = useRef(new Animated.Value(0)).current;
  const screenTranslateY = useRef(new Animated.Value(10)).current;
  const transitionAnim = useRef(new Animated.Value(0)).current;

  const isSmallScreen = height < 720;
  const isVerySmallScreen = height < 650;
  const isTabletLike = width >= 768;

  const horizontalPadding = isTabletLike ? 24 : clamp(width * 0.055, 18, 24);

  const backButtonSize = isVerySmallScreen ? 42 : 46;
  const backButtonRadius = backButtonSize / 2;

  const topSpacing = clamp(height * 0.008, 4, 8);
  const bottomSpacing = clamp(height * 0.014, 8, 14);

  const inputHeight = isVerySmallScreen ? 53 : 57;
  const inputRadius = 22;

  const buttonHeight = isVerySmallScreen ? 54 : 58;
  const buttonRadius = 30;

  const buttonFullWidth = Math.min(
    430,
    Math.max(buttonHeight, width - horizontalPadding * 2)
  );

  const buttonWidthAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(buttonWidthAnim, {
      toValue: loading ? 0 : 1,
      duration: 190,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [buttonWidthAnim, loading]);

  const animatedMainButtonStyle = {
    width: buttonWidthAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [buttonHeight, buttonFullWidth],
    }),
  };

  const styles = useMemo(
    () =>
      createStyles({
        COLORS,
        horizontalPadding,
        backButtonSize,
        backButtonRadius,
        topSpacing,
        bottomSpacing,
        inputHeight,
        inputRadius,
        buttonHeight,
        buttonRadius,
        isSmallScreen,
        isVerySmallScreen,
        safeTop: insets.top,
        width,
        height,
        isArabic,
      }),
    [
      COLORS,
      horizontalPadding,
      backButtonSize,
      backButtonRadius,
      topSpacing,
      bottomSpacing,
      inputHeight,
      inputRadius,
      buttonHeight,
      buttonRadius,
      isSmallScreen,
      isVerySmallScreen,
      insets.top,
      width,
      height,
      isArabic,
    ]
  );

  useFocusEffect(
    useCallback(() => {
      setIsNavigating(false);

      transitionAnim.setValue(0);
      screenOpacity.setValue(0);
      screenTranslateY.setValue(10);

      Animated.parallel([
        Animated.timing(screenOpacity, {
          toValue: 1,
          duration: 180,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(screenTranslateY, {
          toValue: 0,
          duration: 180,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();

      return () => { };
    }, [screenOpacity, screenTranslateY, transitionAnim])
  );

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const smoothReplace = (path: string, params?: Record<string, string>) => {
    if (isNavigating) return;

    setIsNavigating(true);

    Animated.timing(transitionAnim, {
      toValue: 1,
      duration: 150,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      requestAnimationFrame(() => {
        if (params) {
          router.replace({
            pathname: path as any,
            params,
          });
        } else {
          router.replace(path as any);
        }
      });
    });
  };

  const smoothBack = () => {
    if (isNavigating || loading) return;

    setIsNavigating(true);

    Animated.timing(transitionAnim, {
      toValue: 1,
      duration: 150,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      requestAnimationFrame(() => {
        if (from === "settings") {
          router.replace("/(tabs)/settings" as any);
          return;
        }

        router.replace("/login" as any);
      });
    });
  };

  const handleSubmit = async () => {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setErrorMessage(t.enterForgotEmail);
      return;
    }

    if (!cleanEmail.includes("@") || !cleanEmail.includes(".")) {
      setErrorMessage(t.enterValidForgotEmail);
      return;
    }

    setErrorMessage("");
    Keyboard.dismiss();

    try {
      setLoading(true);

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", cleanEmail)
        .maybeSingle();
      if (profileError) {
        console.log("Check email profile error:", profileError.message);
        setErrorMessage(t.forgotSendError);
        return;
      }

      if (!profileData) {
        setErrorMessage(t.forgotEmailNotRegistered);
        return;
      }

      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail);

      if (error) {
        const message = error.message?.toLowerCase() || "";

        console.log("FORGOT PASSWORD SEND ERROR:", {
          message: error.message,
          status: error.status,
          code: error.code,
          email: cleanEmail,
        });

        if (
          message.includes("rate limit") ||
          message.includes("too many") ||
          message.includes("429")
        ) {
          setErrorMessage(t.forgotRateLimit);
          return;
        }

        setErrorMessage(t.forgotSendError);
        return;
      }

      smoothReplace("/auth/reset-password", {
        email: cleanEmail,
        from,
      });
    } catch (err) {
      console.log("Forgot password unexpected error:", err);
      setErrorMessage(t.forgotUnexpectedError);
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = () => {
    if (errorMessage) {
      return (
        <View style={[styles.messageBox, { flexDirection: rowDirection }]}>
          <Ionicons
            name="alert-circle"
            size={14}
            color={COLORS.error}
            style={iconMargin}
          />

          <Text style={[styles.messageTextError, { textAlign }]} allowFontScaling={false}>
            {errorMessage}
          </Text>
        </View>
      );
    }

    return <View style={styles.messagePlaceholder} />;
  };

  if (!fontsLoaded) {
    return null;
  }

  return (
    /* <TouchableWithoutFeedback onPress={dismissKeyboard} accessible={false}> */
    <TouchableWithoutFeedback
      onPress={Platform.OS === "web" ? undefined : dismissKeyboard}
      accessible={false}
      disabled={Platform.OS === "web"}
    >
      <View style={styles.container}>
        <Stack.Screen options={{ gestureEnabled: false }} />

        <StatusBar
          translucent
          backgroundColor="transparent"
          barStyle={darkModeEnabled ? "light-content" : "dark-content"}
        />

        <Animated.View
          style={[
            styles.animatedScreen,
            {
              opacity: screenOpacity,
              transform: [{ translateY: screenTranslateY }],
            },
          ]}
        >
          <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
            <KeyboardAvoidingView
              style={styles.keyboardAvoidingView}
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 16}
            >
              <View style={styles.screenContent}>
                <View style={styles.backArea}>
                  <TouchableOpacity
                    style={styles.backButtonWrapper}
                    activeOpacity={0.85}
                    onPress={smoothBack}
                    disabled={isNavigating || loading}
                  >
                    <Ionicons
                      name={isArabic ? "arrow-forward-outline" : "arrow-back-outline"}
                      size={isVerySmallScreen ? 23 : 25}
                      color={COLORS.textDark}
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.titleArea}>
                  <Text style={styles.title} allowFontScaling={false}>{t.forgotPasswordTitle}</Text>

                  <Text style={styles.subtitle} allowFontScaling={false}>
                    {t.forgotPasswordSubtitle}
                  </Text>
                </View>

                <View style={styles.formArea}>
                  <View style={styles.fieldGroup}>
                    <Text style={[styles.inputLabel, { textAlign }]} allowFontScaling={false}>
                      {t.email}
                    </Text>

                    <View
                      style={[
                        styles.inputWrapper,
                        { flexDirection: rowDirection },
                        errorMessage && styles.inputWrapperError,
                      ]}
                    >
                      <Feather
                        name="mail"
                        size={isVerySmallScreen ? 20 : 21}
                        color={COLORS.primary}
                        style={[styles.inputIcon, iconMargin]}
                      />

                      <TextInput
                        allowFontScaling={false}
                        style={styles.input}
                        placeholder="example@email.com"
                        placeholderTextColor={COLORS.placeholder}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        value={email}
                        onChangeText={(text) => {
                          setEmail(text);
                          setErrorMessage("");
                        }}
                        textAlign={textAlign}
                        returnKeyType="done"
                        editable={!loading && !isNavigating}
                        selectionColor={COLORS.primary}
                        onSubmitEditing={handleSubmit}
                      />
                    </View>

                    {renderMessage()}
                  </View>
                </View>

                <View style={styles.buttonsArea}>
                  <AnimatedTouchableOpacity
                    style={[
                      styles.resetButtonWrapper,
                      animatedMainButtonStyle,
                      loading && styles.resetButtonDisabled,
                    ]}
                    onPress={handleSubmit}
                    disabled={loading || isNavigating}
                    activeOpacity={0.9}
                  >
                    <LinearGradient
                      colors={[COLORS.buttonGradientStart, COLORS.buttonGradientEnd]}
                      start={{ x: 0.15, y: 0 }}
                      end={{ x: 0.9, y: 1 }}
                      style={styles.resetGradient}
                    >
                      <View style={styles.resetGlassTop} />

                      <View style={styles.loadingRow}>
                        {loading ? (
                          <ActivityIndicator
                            size="small"
                            color={COLORS.white}
                          />
                        ) : (
                          <Text style={styles.resetText} allowFontScaling={false}>
                            {t.sendCode}
                          </Text>
                        )}
                      </View>
                    </LinearGradient>
                  </AnimatedTouchableOpacity>

                  <View style={styles.loadingStatusArea}>
                    {loading ? (
                      <Text style={styles.loadingStatusText} allowFontScaling={false}>
                        {isArabic ? "جاري إرسال الرمز..." : "Sending verification code..."}
                      </Text>
                    ) : null}
                  </View>
                </View>
              </View>
            </KeyboardAvoidingView>
          </SafeAreaView>
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
    </TouchableWithoutFeedback>
  );
}

function createStyles({
  COLORS,
  horizontalPadding,
  backButtonSize,
  backButtonRadius,
  topSpacing,
  bottomSpacing,
  inputHeight,
  inputRadius,
  buttonHeight,
  buttonRadius,
  isSmallScreen,
  isVerySmallScreen,
  safeTop,
  width,
  height,
  isArabic,
}: {
  COLORS: AppColors;
  horizontalPadding: number;
  backButtonSize: number;
  backButtonRadius: number;
  topSpacing: number;
  bottomSpacing: number;
  inputHeight: number;
  inputRadius: number;
  buttonHeight: number;
  buttonRadius: number;
  isSmallScreen: boolean;
  isVerySmallScreen: boolean;
  safeTop: number;
  width: number;
  height: number;
  isArabic: boolean;
}) {
  return StyleSheet.create({
    container: {
      flex: 1,
      overflow: "hidden",
      backgroundColor: COLORS.screenBackground,
    },

    animatedScreen: {
      flex: 1,
      backgroundColor: COLORS.screenBackground,
    },

    safeArea: {
      flex: 1,
      backgroundColor: COLORS.screenBackground,
    },

    keyboardAvoidingView: {
      flex: 1,
      backgroundColor: COLORS.screenBackground,
    },

    screenContent: {
      flex: 1,
      paddingHorizontal: horizontalPadding,
      paddingTop: topSpacing,
      paddingBottom: bottomSpacing,
      backgroundColor: COLORS.screenBackground,
      width: "100%",
      maxWidth: 430,
      alignSelf: "center",
    },

    backArea: {
      width: "100%",
      paddingTop: safeTop + 2,
      alignItems: isArabic ? "flex-end" : "flex-start",
      justifyContent: "center",
      marginBottom: isVerySmallScreen ? 18 : 22,
    },

    backButtonWrapper: {
      width: backButtonSize,
      height: backButtonSize,
      borderRadius: backButtonRadius,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "transparent",
      borderWidth: 0,
      shadowOpacity: 0,
      elevation: 0,
    },

    titleArea: {
      width: "100%",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: isVerySmallScreen ? 30 : isSmallScreen ? 38 : 44,
      paddingHorizontal: clamp(width * 0.02, 8, 14),
    },

    title: {
      fontFamily: FONT_EXTRABOLD,
      fontSize: isVerySmallScreen ? 23 : isSmallScreen ? 25 : 27,
      color: COLORS.primaryText,
      textAlign: "center",
      letterSpacing: -0.35,
      lineHeight: isVerySmallScreen ? 32 : isSmallScreen ? 35 : 38,
      textShadowColor: COLORS.titleShadow,
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 12,
      includeFontPadding: false,
    },

    subtitle: {
      fontFamily: FONT_SEMIBOLD,
      marginTop: isVerySmallScreen ? 12 : 15,
      fontSize: isVerySmallScreen ? 12.2 : 13.2,
      lineHeight: isVerySmallScreen ? 20 : 22,
      color: COLORS.placeholder,
      textAlign: "center",
      maxWidth: clamp(width * 0.9, 300, 360),
      textShadowColor: COLORS.subtitleShadow,
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 10,
      includeFontPadding: false,
    },

    formArea: {
      width: "100%",
      paddingHorizontal: 2,
    },

    fieldGroup: {
      width: "100%",
    },

    inputLabel: {
      fontFamily: FONT_BOLD,
      color: COLORS.label,
      fontSize: isVerySmallScreen ? 12.6 : 13.6,
      textAlign: "right",
      marginBottom: 10,
      includeFontPadding: false,
      lineHeight: isVerySmallScreen ? 20 : 22,
    },

    inputWrapper: {
      width: "100%",
      height: inputHeight,
      borderRadius: inputRadius,
      backgroundColor: COLORS.inputBackground,
      borderWidth: 1,
      borderColor: COLORS.border,
      paddingHorizontal: isVerySmallScreen ? 14 : 16,
      alignItems: "center",
      shadowColor: COLORS.shadowGray,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: Platform.OS === "android" ? 0.05 : 0.035,
      shadowRadius: 6,
      elevation: 1,
    },

    inputWrapperError: {
      borderColor: COLORS.errorBorder,
      backgroundColor: COLORS.inputErrorBackground,
    },

    inputIcon: {
      marginLeft: 0,
      marginRight: 0,
    },

    input: {
      fontFamily: FONT_SEMIBOLD,
      flex: 1,
      fontSize: isVerySmallScreen ? 14.4 : 15.4,
      color: COLORS.inputText,
      paddingVertical: 0,
      minHeight: inputHeight - 8,
      textAlignVertical: "center",
      includeFontPadding: false,
    },

    messagePlaceholder: {
      minHeight: isVerySmallScreen ? 28 : 32,
      marginTop: 6,
    },

    messageBox: {
      width: "100%",
      minHeight: isVerySmallScreen ? 28 : 32,
      marginTop: 6,
      alignItems: "center",
      justifyContent: "flex-start",
      paddingHorizontal: 8,
    },

    messageTextError: {
      fontFamily: FONT_SEMIBOLD,
      flex: 1,
      color: COLORS.error,
      fontSize: isVerySmallScreen ? 12.2 : 13,
      textAlign: "right",
      lineHeight: isVerySmallScreen ? 18 : 20,
      includeFontPadding: false,
    },

    buttonsArea: {
      marginTop: "auto",
      width: "100%",
      alignItems: "center",
      paddingTop: isVerySmallScreen ? 14 : 20,
      paddingBottom: isVerySmallScreen ? 4 : 8,
    },

    resetButtonWrapper: {
      width: "100%",
      alignSelf: "center",
      height: buttonHeight,
      borderRadius: buttonRadius,
      overflow: "hidden",
      shadowColor: COLORS.overlayShadow,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: Platform.OS === "android" ? 0.18 : 0.24,
      shadowRadius: 14,
      elevation: 6,
      backgroundColor: COLORS.primary,
    },

    resetButtonDisabled: {
      opacity: 0.72,
    },

    resetGradient: {
      flex: 1,
      borderRadius: buttonRadius,
      justifyContent: "center",
      alignItems: "center",
      overflow: "hidden",
    },

    resetGlassTop: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: "48%",
      borderTopLeftRadius: buttonRadius,
      borderTopRightRadius: buttonRadius,
      backgroundColor: "rgba(255,255,255,0.10)",
      zIndex: 1,
    },

    loadingRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 5,
    },

    loadingSpinner: {
      marginRight: 8,
      transform: [{ scale: isVerySmallScreen ? 0.85 : 0.95 }],
    },

    resetText: {
      fontFamily: FONT_EXTRABOLD,
      color: COLORS.white,
      textAlign: "center",
      fontSize: isVerySmallScreen ? 17.4 : 18.4,
      zIndex: 5,
      includeFontPadding: false,
      lineHeight: isVerySmallScreen ? 28 : 30,
      letterSpacing: -0.15,
      textAlignVertical: "center",
      paddingTop: Platform.OS === "ios" ? 1 : 0,
      paddingBottom: Platform.OS === "ios" ? 1 : 0,
    },

    loadingStatusArea: {
      width: "100%",
      minHeight: isVerySmallScreen ? 30 : 34,
      alignItems: "center",
      justifyContent: "center",
      marginTop: isVerySmallScreen ? 6 : 8,
      marginBottom: isVerySmallScreen ? -2 : 0,
    },

    loadingStatusText: {
      marginTop: 0,
      width: "100%",
      fontFamily: FONT_BOLD,
      color: COLORS.muted,
      fontSize: isVerySmallScreen ? 12.8 : 13.8,
      lineHeight: isVerySmallScreen ? 20 : 22,
      textAlign: "center",
      includeFontPadding: true,
    },

    transitionOverlay: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 100,
      backgroundColor: COLORS.nextScreenBackground,
    },
  });
}
