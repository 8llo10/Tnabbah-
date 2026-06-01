import React, { useEffect, useMemo, useRef, useState } from "react";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";
import { setPasswordRecoveryMode } from "../../utils/passwordRecoveryFlag";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  useWindowDimensions,
  Animated,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import LottieView from "lottie-react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Alexandria_400Regular,
  Alexandria_600SemiBold,
  Alexandria_700Bold,
  Alexandria_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/alexandria";
import { useLanguage } from "../../providers/LanguageProvider";
import { useAppSettings } from "../../providers/AppSettingsProvider";

const OTP_DIGITS = 8;
const RESEND_COOLDOWN = 60;

const LIGHT_COLORS = {
  screenBackground: "#FFFFFF",

  primary: "#9A211C",
  primaryDark: "#761713",
  primaryText: "#871B17",
  buttonGradientStart: "#9A211C",
  buttonGradientEnd: "#761713",

  title: "#202020",
  textDark: "#2C2C2C",
  inputText: "#2E1D1D",

  label: "#8C7A76",
  muted: "#6C5B58",
  placeholder: "#B0A6A4",
  border: "rgba(205,205,205,0.95)",

  shadowGray: "#8E8E8E",
  white: "#FFFFFF",

  error: "#D32F2F",
  errorSoft: "rgba(211,47,47,0.075)",
  errorBorder: "rgba(211,47,47,0.68)",
  success: "#2E7D32",
};

const DARK_COLORS = {
  screenBackground: "#151515",

  primary: "#B63A34",
  primaryDark: "#871B17",
  primaryText: "#C8564E",
  buttonGradientStart: "#B63A34",
  buttonGradientEnd: "#871B17",

  title: "#FFFFFF",
  textDark: "#F2F2F2",
  inputText: "#FFFFFF",

  label: "#C9C0BD",
  muted: "#D7D7D7",
  placeholder: "#8F8F8F",
  border: "rgba(255,255,255,0.16)",

  shadowGray: "#000000",
  white: "#FFFFFF",

  error: "#EF7676",
  errorSoft: "rgba(239,118,118,0.10)",
  errorBorder: "rgba(239,118,118,0.45)",
  success: "#6EDB7B",
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const FONT_REGULAR = "Alexandria_400Regular";
const FONT_SEMIBOLD = "Alexandria_600SemiBold";
const FONT_BOLD = "Alexandria_700Bold";
const FONT_EXTRABOLD = "Alexandria_800ExtraBold";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { t, isArabic } = useLanguage();
  const { darkModeEnabled } = useAppSettings();
  const [fontsLoaded] = useFonts({
    Alexandria_400Regular,
    Alexandria_600SemiBold,
    Alexandria_700Bold,
    Alexandria_800ExtraBold,
  });
  const isDarkMode = darkModeEnabled;
  const colors = isDarkMode ? DARK_COLORS : LIGHT_COLORS;

  const textAlign = isArabic ? "right" : "left";
  const rowDirection = isArabic ? "row-reverse" : "row";
  const iconMargin = isArabic ? { marginLeft: 10 } : { marginRight: 10 };

  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const initialEmail =
    typeof params.email === "string"
      ? params.email
      : Array.isArray(params.email)
      ? params.email[0]
      : "";

  const [email] = useState(initialEmail || "");

  const [otpValues, setOtpValues] = useState<string[]>(
    Array(OTP_DIGITS).fill("")
  );

  const otpRefs = useRef<Array<TextInput | null>>([]);

  const boxScales = useRef(
    Array.from({ length: OTP_DIGITS }, () => new Animated.Value(1))
  ).current;

  const emailSentLottieRef = useRef<LottieView>(null);

  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(RESEND_COOLDOWN);

  const isSmallScreen = height < 720;
  const isVerySmallScreen = height < 650;
  const isTabletLike = width >= 768;

  const horizontalPadding = isTabletLike ? 24 : clamp(width * 0.055, 18, 24);

  const backButtonSize = isVerySmallScreen ? 42 : 46;
  const backButtonRadius = backButtonSize / 2;

  const topSpacing = clamp(height * 0.008, 4, 8);
  const bottomSpacing = clamp(height * 0.014, 8, 14);

  const buttonHeight = isVerySmallScreen ? 54 : 58;
  const buttonRadius = 30;

  const otpBoxSize = clamp((width - horizontalPadding * 2 - 28) / 8, 34, 42);
  const otpBoxHeight = isVerySmallScreen ? 58 : 66;

  const styles = useMemo(
    () =>
      createStyles({
        horizontalPadding,
        backButtonSize,
        backButtonRadius,
        topSpacing,
        bottomSpacing,
        buttonHeight,
        buttonRadius,
        otpBoxSize,
        otpBoxHeight,
        isSmallScreen,
        isVerySmallScreen,
        safeTop: insets.top,
        width,
        height,
        colors,
        isDarkMode,
        isArabic,
      }),
    [
      horizontalPadding,
      backButtonSize,
      backButtonRadius,
      topSpacing,
      bottomSpacing,
      buttonHeight,
      buttonRadius,
      otpBoxSize,
      otpBoxHeight,
      isSmallScreen,
      isVerySmallScreen,
      insets.top,
      width,
      height,
      colors,
      isDarkMode,
      isArabic,
    ]
  );

  const otpCode = otpValues.join("");

  useEffect(() => {
    if (resendTimer <= 0) return;

    const interval: ReturnType<typeof setInterval> = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [resendTimer]);

  useEffect(() => {
    emailSentLottieRef.current?.reset();

    const playTimer = setTimeout(() => {
      emailSentLottieRef.current?.play();
    }, 120);

    return () => clearTimeout(playTimer);
  }, []);

  const dismissKeyboard = () => {
    Keyboard.dismiss();
    setFocusedIndex(null);
  };

  const animateBox = (index: number, toValue: number) => {
    Animated.spring(boxScales[index], {
      toValue,
      useNativeDriver: true,
      friction: 6,
      tension: 90,
    }).start();
  };

  const clearMessages = () => {
    setErrorMessage("");
    setInfoMessage("");
  };

  const handleOtpChange = (text: string, index: number) => {
    const onlyNumber = text.replace(/[^0-9]/g, "");

    if (!onlyNumber) {
      const updated = [...otpValues];
      updated[index] = "";
      setOtpValues(updated);
      clearMessages();
      return;
    }

    const updated = [...otpValues];

    if (onlyNumber.length > 1) {
      const pasted = onlyNumber.slice(0, OTP_DIGITS).split("");

      for (let i = 0; i < OTP_DIGITS; i++) {
        updated[i] = pasted[i] || "";
      }

      setOtpValues(updated);
      clearMessages();

      const nextEmpty = updated.findIndex((item) => item === "");

      if (nextEmpty !== -1) {
        otpRefs.current[nextEmpty]?.focus();
        setFocusedIndex(nextEmpty);
      } else {
        Keyboard.dismiss();
        setFocusedIndex(null);
      }

      return;
    }

    updated[index] = onlyNumber;
    setOtpValues(updated);
    clearMessages();

    animateBox(index, 1.08);

    setTimeout(() => {
      animateBox(index, focusedIndex === index ? 1.08 : 1);
    }, 120);

    if (index < OTP_DIGITS - 1) {
      otpRefs.current[index + 1]?.focus();
      setFocusedIndex(index + 1);
    } else {
      Keyboard.dismiss();
      setFocusedIndex(null);
    }
  };

  const handleOtpKeyPress = (key: string, index: number) => {
    if (key === "Backspace" && !otpValues[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
      setFocusedIndex(index - 1);

      const updated = [...otpValues];
      updated[index - 1] = "";
      setOtpValues(updated);
    }
  };

  const handleFocus = (index: number) => {
    setFocusedIndex(index);
    animateBox(index, 1.08);
  };

  const handleBlur = (index: number) => {
    setFocusedIndex((prev) => (prev === index ? null : prev));
    animateBox(index, 1);
  };

  const handleVerifyOtp = async () => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otpCode.trim();

    if (!cleanEmail) {
      setErrorMessage(t.resetOtpMissingEmail);
      return;
    }

    if (cleanOtp.length !== OTP_DIGITS) {
      setErrorMessage(t.resetOtpEnterCode);
      return;
    }

    try {
      setLoading(true);
      clearMessages();

      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: cleanOtp,
        type: "recovery",
      });

      if (verifyError) {
        console.log("verifyOtp error:", verifyError.message);
        setErrorMessage(t.resetOtpInvalidCode);
        return;
      }

      console.log(
        "verifyOtp success:",
        data?.session ? "session exists" : "no session"
      );

      await setPasswordRecoveryMode(true);
      await AsyncStorage.setItem("password_recovery_flow", "true");

      Keyboard.dismiss();
      setFocusedIndex(null);

      router.replace("/auth/new-password" as any);
    } catch (error) {
      console.log("verify otp error:", error);
      setErrorMessage(t.resetOtpUnexpectedError);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setErrorMessage(t.resetOtpEmailMissing);
      return;
    }

    if (resendTimer > 0 || resendLoading) {
      return;
    }

    try {
      setResendLoading(true);
      clearMessages();

      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail);

      if (error) {
        console.log("resend code error:", error.message);
        setErrorMessage(t.resetOtpResendFailedLater);
        return;
      }

      setOtpValues(Array(OTP_DIGITS).fill(""));
      setResendTimer(RESEND_COOLDOWN);
      setInfoMessage(t.resetOtpResentMessage);

      Keyboard.dismiss();
      setFocusedIndex(null);
    } catch (error) {
      console.log("resend error:", error);
      setErrorMessage(t.resetOtpResendError);
    } finally {
      setResendLoading(false);
    }
  };

  const renderMessage = () => {
    if (errorMessage) {
      return (
        <View style={[styles.messageBoxError, { flexDirection: rowDirection }]}>
          <Ionicons
            name="alert-circle"
            size={14}
            color={colors.error}
            style={iconMargin}
          />
          <Text style={[styles.messageTextError, { textAlign }]} allowFontScaling={false}>
            {errorMessage}
          </Text>
        </View>
      );
    }

    if (infoMessage) {
      return (
        <View style={[styles.messageBoxInfo, { flexDirection: rowDirection }]}>
          <Ionicons
            name="checkmark-circle"
            size={14}
            color={colors.success}
            style={iconMargin}
          />
          <Text style={[styles.messageTextInfo, { textAlign }]} allowFontScaling={false}>
            {infoMessage}
          </Text>
        </View>
      );
    }

    return <View style={styles.messagePlaceholder} />;
  };

  const renderResendArea = () => {
    if (resendTimer > 0) {
      return (
        <View style={[styles.timerBox, { flexDirection: rowDirection }]}>
          <Ionicons name="time-outline" size={24} color={colors.primary} />
          <Text style={styles.timerText} allowFontScaling={false}>
            {t.resetOtpResendAfter} {resendTimer} {t.resetOtpSeconds}
          </Text>
        </View>
      );
    }

    return (
      <View style={[styles.resendRow, { flexDirection: rowDirection }]}>
        <Text style={styles.resendQuestion} allowFontScaling={false}>{t.resetOtpWantResend}</Text>

        <TouchableOpacity
          activeOpacity={0.75}
          onPress={handleResendCode}
          disabled={resendLoading || loading}
        >
          <Text style={styles.resendText} allowFontScaling={false}>
            {resendLoading ? t.resetOtpSending : t.resetOtpResendCode}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ gestureEnabled: false }} />

      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={isDarkMode ? "light-content" : "dark-content"}
      />

      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 16}
        >
          <TouchableWithoutFeedback onPress={dismissKeyboard} accessible={false}>
            <View style={styles.screenContent}>
              <View style={styles.backArea}>
                <TouchableOpacity
                  style={styles.backButtonWrapper}
                  activeOpacity={0.85}
                  onPress={() => router.replace("/forgot-password" as any)}
                  disabled={loading || resendLoading}
                >
                  <Ionicons
                    name={isArabic ? "arrow-forward-outline" : "arrow-back-outline"}
                    size={isVerySmallScreen ? 23 : 25}
                    color={colors.textDark}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.emailSentAnimationWrapper}>
                <LottieView
                  ref={emailSentLottieRef}
                  source={require("../../assets/animations/email-sent.json")}
                  autoPlay
                  loop
                  style={styles.emailSentAnimation}
                />
              </View>

              <View style={styles.titleArea}>
                <Text style={styles.title} allowFontScaling={false}>{t.resetOtpTitle}</Text>

                <Text style={styles.subtitle} allowFontScaling={false}>{t.resetOtpSubtitle}</Text>

                <Text style={styles.emailText} allowFontScaling={false}>
                  {email || t.resetOtpEmailFallback}
                </Text>
              </View>

              <View style={styles.otpArea}>
                <View style={styles.otpRow}>
                  {otpValues.map((digit, index) => {
                    const isFocused = focusedIndex === index;
                    const isFilled = !!digit;
                    const hasError = !!errorMessage;

                    return (
                      <Animated.View
                        key={index}
                        style={[
                          styles.otpBoxWrapper,
                          {
                            transform: [{ scale: boxScales[index] }],
                          },
                          isFilled && styles.otpBoxFilled,
                          isFocused && styles.otpBoxFocused,
                          hasError && styles.otpBoxError,
                        ]}
                      >
                        <TextInput
                          allowFontScaling={false}
                          ref={(ref) => {
                            otpRefs.current[index] = ref;
                          }}
                          style={[
                            styles.otpInput,
                            isFilled && styles.otpInputFilled,
                            hasError && styles.otpInputError,
                          ]}
                          value={digit}
                          onChangeText={(text) => handleOtpChange(text, index)}
                          onKeyPress={({ nativeEvent }) =>
                            handleOtpKeyPress(nativeEvent.key, index)
                          }
                          onFocus={() => handleFocus(index)}
                          onBlur={() => handleBlur(index)}
                          keyboardType="number-pad"
                          maxLength={index === 0 ? OTP_DIGITS : 1}
                          textAlign="center"
                          autoCorrect={false}
                          autoCapitalize="none"
                          selectionColor={colors.primaryDark}
                          editable={!loading && !resendLoading}
                        />
                      </Animated.View>
                    );
                  })}
                </View>

                {renderMessage()}
              </View>

              <View style={styles.bottomArea}>
                <TouchableOpacity
                  style={[
                    styles.mainButtonWrapper,
                    loading && styles.mainButtonDisabled,
                  ]}
                  onPress={handleVerifyOtp}
                  disabled={loading || resendLoading}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={[colors.buttonGradientStart, colors.buttonGradientEnd]}
                    start={{ x: 0.15, y: 0 }}
                    end={{ x: 0.9, y: 1 }}
                    style={styles.buttonGradient}
                  >
                    <View style={styles.buttonGlassTop} />

                    <View style={styles.loadingRow}>
                      {loading ? (
                        <ActivityIndicator
                          size="small"
                          color={colors.white}
                          style={styles.loadingSpinner}
                        />
                      ) : null}

                      <Text style={styles.buttonText} allowFontScaling={false}>
                        {loading ? t.resetOtpVerifying : t.resetOtpContinue}
                      </Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>

                {renderResendArea()}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

function createStyles({
  horizontalPadding,
  backButtonSize,
  backButtonRadius,
  topSpacing,
  bottomSpacing,
  buttonHeight,
  buttonRadius,
  otpBoxSize,
  otpBoxHeight,
  isSmallScreen,
  isVerySmallScreen,
  safeTop,
  width,
  height,
  colors,
  isDarkMode,
  isArabic,
}: {
  horizontalPadding: number;
  backButtonSize: number;
  backButtonRadius: number;
  topSpacing: number;
  bottomSpacing: number;
  buttonHeight: number;
  buttonRadius: number;
  otpBoxSize: number;
  otpBoxHeight: number;
  isSmallScreen: boolean;
  isVerySmallScreen: boolean;
  safeTop: number;
  width: number;
  height: number;
  colors: typeof LIGHT_COLORS;
  isDarkMode: boolean;
  isArabic: boolean;
}) {
  return StyleSheet.create({
    container: {
      flex: 1,
      overflow: "hidden",
      backgroundColor: colors.screenBackground,
    },

    safeArea: {
      flex: 1,
      backgroundColor: colors.screenBackground,
    },

    keyboardAvoidingView: {
      flex: 1,
      backgroundColor: colors.screenBackground,
    },

    screenContent: {
      flex: 1,
      paddingHorizontal: horizontalPadding,
      paddingTop: topSpacing,
      paddingBottom: bottomSpacing,
      backgroundColor: colors.screenBackground,
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

    emailSentAnimationWrapper: {
      width: "100%",
      height: isVerySmallScreen ? 104 : 118,
      alignItems: "center",
      justifyContent: "center",
      marginTop: isVerySmallScreen ? -12 : -16,
      marginBottom: isVerySmallScreen ? -8 : -10,
    },

    emailSentAnimation: {
      width: isVerySmallScreen ? 138 : 160,
      height: isVerySmallScreen ? 138 : 160,
    },

    titleArea: {
      width: "100%",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: isVerySmallScreen ? 24 : isSmallScreen ? 30 : 34,
      paddingHorizontal: clamp(width * 0.02, 8, 14),
    },

    title: {
      fontFamily: FONT_EXTRABOLD,
      fontSize: isVerySmallScreen ? 23 : isSmallScreen ? 25 : 27,
      color: colors.title,
      textAlign: "center",
      letterSpacing: -0.35,
      lineHeight: isVerySmallScreen ? 32 : isSmallScreen ? 35 : 38,
      textShadowColor: isDarkMode ? "rgba(0,0,0,0.35)" : "rgba(255,255,255,0.95)",
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 12,
    },

    subtitle: {
      fontFamily: FONT_SEMIBOLD,
      marginTop: isVerySmallScreen ? 9 : 12,
      fontSize: isVerySmallScreen ? 12.2 : 13.2,
      lineHeight: isVerySmallScreen ? 20 : 22,
      color: colors.muted,
      textAlign: "center",
      maxWidth: clamp(width * 0.9, 300, 360),
      textShadowColor: isDarkMode ? "rgba(0,0,0,0.35)" : "rgba(255,255,255,0.90)",
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 10,
    },

    emailText: {
      fontFamily: FONT_BOLD,
      marginTop: 8,
      fontSize: isVerySmallScreen ? 13 : 14,
      color: colors.primaryText,
      textAlign: "center",
      lineHeight: isVerySmallScreen ? 20 : 22,
    },

    otpArea: {
      width: "100%",
      paddingHorizontal: 2,
    },

    otpRow: {
      width: "100%",
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: isVerySmallScreen ? 12 : 14,
    },

    otpBoxWrapper: {
      width: otpBoxSize,
      height: otpBoxHeight,
      borderRadius: 16,
      backgroundColor: isDarkMode ? "rgba(255,255,255,0.055)" : colors.white,
      borderWidth: 1.7,
      borderColor: colors.border,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: colors.shadowGray,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: Platform.OS === "android" ? 0.14 : 0.2,
      shadowRadius: 4,
      elevation: 3,
    },

    otpBoxFilled: {
      borderColor: "rgba(154,33,28,0.48)",
      backgroundColor: "rgba(154,33,28,0.055)",
    },

    otpBoxFocused: {
      borderColor: colors.primary,
      backgroundColor: "rgba(154,33,28,0.08)",
      shadowColor: colors.primaryDark,
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: Platform.OS === "android" ? 0.2 : 0.25,
      shadowRadius: 10,
      elevation: 6,
    },

    otpBoxError: {
      borderColor: colors.errorBorder,
      backgroundColor: colors.errorSoft,
      shadowColor: colors.error,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: Platform.OS === "android" ? 0.13 : 0.16,
      shadowRadius: 8,
      elevation: 4,
    },

    otpInput: {
      fontFamily: FONT_EXTRABOLD,
      width: "100%",
      height: "100%",
      fontSize: isVerySmallScreen ? 21 : 23,
      color: colors.inputText,
      textAlign: "center",
      paddingVertical: 0,
      backgroundColor: "transparent",
      letterSpacing: -0.2,
    },

    otpInputFilled: {
      color: colors.primaryText,
    },

    otpInputError: {
      color: colors.error,
    },

    messagePlaceholder: {
      minHeight: isVerySmallScreen ? 28 : 32,
    },

    messageBoxError: {
      width: "100%",
      minHeight: isVerySmallScreen ? 28 : 32,
      alignItems: "center",
      justifyContent: "flex-start",
      marginTop: 0,
      paddingHorizontal: 8,
    },

    messageBoxInfo: {
      width: "100%",
      minHeight: isVerySmallScreen ? 28 : 32,
      alignItems: "center",
      justifyContent: "flex-start",
      marginTop: 0,
      paddingHorizontal: 8,
    },

    messageTextError: {
      fontFamily: FONT_SEMIBOLD,
      color: colors.error,
      fontSize: isVerySmallScreen ? 12.2 : 13,
      textAlign: "right",
      flex: 1,
      lineHeight: isVerySmallScreen ? 18 : 20,
      includeFontPadding: false,
    },

    messageTextInfo: {
      fontFamily: FONT_SEMIBOLD,
      color: colors.success,
      fontSize: isVerySmallScreen ? 12.2 : 13,
      textAlign: "right",
      flex: 1,
      lineHeight: isVerySmallScreen ? 18 : 20,
      includeFontPadding: false,
    },

    bottomArea: {
      marginTop: "auto",
      alignItems: "center",
      paddingTop: isVerySmallScreen ? 14 : 20,
      paddingBottom: isVerySmallScreen ? 4 : 8,
    },

    mainButtonWrapper: {
      width: "100%",
      height: buttonHeight,
      borderRadius: buttonRadius,
      overflow: "hidden",
      shadowColor: "#6E1411",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: Platform.OS === "android" ? 0.18 : 0.24,
      shadowRadius: 14,
      elevation: 6,
      backgroundColor: colors.primary,
    },

    mainButtonDisabled: {
      opacity: 0.72,
    },

    buttonGradient: {
      flex: 1,
      borderRadius: buttonRadius,
      justifyContent: "center",
      alignItems: "center",
      overflow: "hidden",
    },

    buttonGlassTop: {
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

    buttonText: {
      fontFamily: FONT_EXTRABOLD,
      color: colors.white,
      textAlign: "center",
      fontSize: isVerySmallScreen ? 17.4 : 18.4,
      zIndex: 5,
      lineHeight: isVerySmallScreen ? 28 : 30,
      letterSpacing: -0.15,
      textAlignVertical: "center",
      paddingTop: Platform.OS === "ios" ? 1 : 0,
      paddingBottom: Platform.OS === "ios" ? 1 : 0,
    },

    timerBox: {
      marginTop: isVerySmallScreen ? 12 : 14,
      width: "100%",
      minHeight: isVerySmallScreen ? 48 : 52,
      paddingHorizontal: isVerySmallScreen ? 14 : 16,
      paddingVertical: isVerySmallScreen ? 9 : 10,
      borderRadius: 22,
      backgroundColor: isDarkMode ? "rgba(255,255,255,0.055)" : "#F5F5F5",
      borderWidth: 1.1,
      borderColor: isDarkMode ? "rgba(255,255,255,0.14)" : "rgba(170,170,170,0.45)",
      flexDirection: "row-reverse",
      alignItems: "center",
      justifyContent: "center",
      gap: 7,
    },

    timerText: {
      fontFamily: FONT_SEMIBOLD,
      flexShrink: 1,
      color: colors.muted,
      fontSize: isVerySmallScreen ? 12.8 : 14,
      textAlign: "center",
      lineHeight: isVerySmallScreen ? 19 : 21,
    },

    resendRow: {
      marginTop: isVerySmallScreen ? 12 : 14,
      flexDirection: "row-reverse",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      flexWrap: "wrap",
    },

    resendQuestion: {
      fontFamily: FONT_REGULAR,
      color: isDarkMode ? "rgba(255,255,255,0.68)" : "rgba(87,87,87,1)",
      fontSize: isVerySmallScreen ? 14.2 : 15.2,
      lineHeight: isVerySmallScreen ? 22 : 24,
    },

    resendText: {
      fontFamily: FONT_BOLD,
      color: colors.primaryText,
      fontSize: isVerySmallScreen ? 14.2 : 15.2,
      textDecorationLine: "none",
      lineHeight: isVerySmallScreen ? 22 : 24,
    },
  });
}
