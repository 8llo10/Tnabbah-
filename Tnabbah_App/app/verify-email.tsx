import React, { useEffect, useMemo, useRef, useState } from "react";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
  ActivityIndicator,
  Animated,
  Easing,
  StatusBar,
  ScrollView,
  PermissionsAndroid,
} from "react-native";
import { supabase } from "../lib/supabase";
import * as Notifications from "expo-notifications";
import { elmBluetoothService } from "@/services/elmBluetoothService";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import LottieView from "lottie-react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import {
  Alexandria_400Regular,
  Alexandria_600SemiBold,
  Alexandria_700Bold,
  Alexandria_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/alexandria";
import { useLanguage } from "../providers/LanguageProvider";
import { useAppSettings } from "../providers/AppSettingsProvider";

const OTP_DIGITS = 8;
const RESEND_COOLDOWN = 60;
const SUCCESS_ANIMATION_START_FRAME = 0;
const SUCCESS_ANIMATION_END_FRAME = 50;
const SUCCESS_ANIMATION_PLAY_DELAY_MS = 60;
const SUCCESS_ANIMATION_FALLBACK_MS = 3300;
const SUCCESS_HOLD_AFTER_ANIMATION_MS = 1200;

const LIGHT_COLORS = {
  screenBackground: "#FFFFFF",
  nextScreenBackground: "#FFFFFF",

  primary: "#9A211C",
  primaryDark: "#761713",
  primaryText: "#9A211C",

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

  inputBackground: "#FFFFFF",
  otpBackground: "#FFFFFF",
  otpFilledBackground: "rgba(154,33,28,0.055)",
  otpFocusedBackground: "rgba(154,33,28,0.08)",
  otpFilledBorder: "rgba(154,33,28,0.48)",

  timerBackground: "#F5F5F5",
  timerBorder: "rgba(170,170,170,0.45)",
  timerText: "#6C5B58",

  resendQuestion: "rgba(87, 87, 87, 1)",

  overlayBackground: "rgba(0,0,0,0.30)",
  successBoxBackground: "rgba(255,255,255,0.96)",
  successBoxBorder: "rgba(154,33,28,0.16)",
  blurTint: "light" as const,

  titleShadow: "rgba(255,255,255,0.95)",
  subtitleShadow: "rgba(255,255,255,0.90)",
};

const DARK_COLORS = {
  screenBackground: "#151515",
  nextScreenBackground: "#151515",

  primary: "#B63A34",
  primaryDark: "#871B17",
  primaryText: "#C8564E",

  title: "#FFFFFF",
  textDark: "#FFFFFF",
  inputText: "#FFFFFF",

  label: "#D6C7C3",
  muted: "#C7C7C7",
  placeholder: "#8E8E8E",
  border: "#383838",

  shadowGray: "#000000",
  white: "#FFFFFF",

  error: "#EF7676",
  errorSoft: "rgba(239,118,118,0.10)",
  errorBorder: "rgba(239,118,118,0.45)",

  success: "#66BB6A",

  inputBackground: "#202020",
  otpBackground: "#202020",
  otpFilledBackground: "rgba(182,58,52,0.14)",
  otpFocusedBackground: "rgba(182,58,52,0.20)",
  otpFilledBorder: "rgba(182,58,52,0.46)",

  timerBackground: "#202020",
  timerBorder: "#383838",
  timerText: "#D6C7C3",

  resendQuestion: "#C7C7C7",

  overlayBackground: "rgba(0,0,0,0.58)",
  successBoxBackground: "rgba(32,32,32,0.96)",
  successBoxBorder: "rgba(182,58,52,0.20)",
  blurTint: "dark" as const,

  titleShadow: "rgba(0,0,0,0)",
  subtitleShadow: "rgba(0,0,0,0)",
};

type AppColors = typeof LIGHT_COLORS | typeof DARK_COLORS;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const FONT_REGULAR = "Alexandria_400Regular";
const FONT_SEMIBOLD = "Alexandria_600SemiBold";
const FONT_BOLD = "Alexandria_700Bold";
const FONT_EXTRABOLD = "Alexandria_800ExtraBold";

export default function VerifyEmailScreen() {
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

  const COLORS = darkModeEnabled ? DARK_COLORS : LIGHT_COLORS;

  const textAlign = isArabic ? "right" : "left";
  const rowDirection = isArabic ? "row-reverse" : "row";
  const iconMargin = isArabic ? { marginLeft: 10 } : { marginRight: 10 };

  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const email = String(params.email || "");
  const fullName = String(params.fullName || "");
  const source = String(params.source || "register");

  const [otpValues, setOtpValues] = useState<string[]>(
    Array(OTP_DIGITS).fill("")
  );

  const otpRefs = useRef<Array<TextInput | null>>([]);

  const boxScales = useRef(
    Array.from({ length: OTP_DIGITS }, () => new Animated.Value(1))
  ).current;

  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  const [errorMessage, setErrorMessage] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [showVerifySuccess, setShowVerifySuccess] = useState(false);

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendTimer, setResendTimer] = useState(RESEND_COOLDOWN);

  const transitionAnim = useRef(new Animated.Value(0)).current;
  const buttonMorphAnim = useRef(new Animated.Value(0)).current;
  const emailSentLottieRef = useRef<LottieView>(null);
  const successCheckLottieRef = useRef<LottieView>(null);
  const successNavigationStartedRef = useRef(false);

  const successCardScale = useRef(new Animated.Value(0.92)).current;
  const successCardOpacity = useRef(new Animated.Value(0)).current;
  const successIconScale = useRef(new Animated.Value(0.35)).current;
  const successIconOpacity = useRef(new Animated.Value(0)).current;

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

  const buttonFullWidth = Math.min(width - horizontalPadding * 2, 430);
  const animatedButtonWidth = buttonMorphAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [buttonFullWidth, buttonHeight],
  });
  const animatedButtonRadius = buttonMorphAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [buttonRadius, buttonHeight / 2],
  });

  const styles = useMemo(
    () =>
      createStyles({
        COLORS,
        darkModeEnabled,
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
        isArabic,
      }),
    [
      COLORS,
      darkModeEnabled,
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
    Animated.timing(buttonMorphAnim, {
      toValue: loading ? 1 : 0,
      duration: loading ? 220 : 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [loading, buttonMorphAnim]);

  useEffect(() => {
    if (!showVerifySuccess) return;

    successNavigationStartedRef.current = false;

    successCardScale.setValue(0.98);
    successCardOpacity.setValue(0);
    successIconScale.setValue(0.92);
    successIconOpacity.setValue(0);

    Animated.parallel([
      Animated.timing(successCardOpacity, {
        toValue: 1,
        duration: 130,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(successCardScale, {
        toValue: 1,
        duration: 170,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(successIconOpacity, {
        toValue: 1,
        duration: 120,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(successIconScale, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    const playTimer = setTimeout(() => {
      successCheckLottieRef.current?.reset();
      successCheckLottieRef.current?.play(
        SUCCESS_ANIMATION_START_FRAME,
        SUCCESS_ANIMATION_END_FRAME
      );
    }, SUCCESS_ANIMATION_PLAY_DELAY_MS);

    const fallbackTimer = setTimeout(() => {
      handleSuccessAnimationFinish();
    }, SUCCESS_ANIMATION_FALLBACK_MS);

    return () => {
      clearTimeout(playTimer);
      clearTimeout(fallbackTimer);
    };
  }, [
    showVerifySuccess,
    successCardScale,
    successCardOpacity,
    successIconScale,
    successIconOpacity,
  ]);

  useEffect(() => {
    emailSentLottieRef.current?.reset();

    const playTimer = setTimeout(() => {
      emailSentLottieRef.current?.play();
    }, 120);

    return () => clearTimeout(playTimer);
  }, []);

  const smoothReplace = (path: string) => {
    Animated.timing(transitionAnim, {
      toValue: 1,
      duration: 150,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      requestAnimationFrame(() => {
        router.replace(path as any);
      });
    });
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

  const dismissKeyboard = () => {
    Keyboard.dismiss();
    setFocusedIndex(null);
  };

  const handleOtpChange = (text: string, index: number) => {
    const onlyNumbers = text.replace(/[^0-9]/g, "");

    if (!onlyNumbers) {
      const updated = [...otpValues];
      updated[index] = "";
      setOtpValues(updated);
      clearMessages();
      return;
    }

    const updated = [...otpValues];

    if (onlyNumbers.length > 1) {
      const pasted = onlyNumbers.slice(0, OTP_DIGITS).split("");

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

    updated[index] = onlyNumbers;
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

  const requestAndroidBluetoothPermissions = async () => {
    if (Platform.OS !== "android") return;

    try {
      if (Number(Platform.Version) >= 31) {
        await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);

        return;
      }

      await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
    } catch (permissionError) {
      console.log("Android Bluetooth permission error:", permissionError);
    }
  };

  const requestPostVerifyPermissions = async () => {
    try {
      await Notifications.requestPermissionsAsync();
    } catch (notificationError) {
      console.log("Notification permission error:", notificationError);
    }

    try {
      if (Platform.OS === "android") {
        await requestAndroidBluetoothPermissions();
      }

      if (Platform.OS === "ios") {
        await elmBluetoothService.manager.state();
      }
    } catch (bluetoothError) {
      console.log("Bluetooth permission check error:", bluetoothError);
    }
  };

  const handleVerifyCode = async () => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = otpCode.trim();

    if (!cleanEmail) {
      setErrorMessage(t.emailMissingRegisterAgain);
      return;
    }

    if (cleanCode.length !== OTP_DIGITS) {
      setErrorMessage(t.enterOtpCode);
      return;
    }

    try {
      setLoading(true);
      clearMessages();

      const { data, error } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: cleanCode,
        type: "signup",
      });

      if (error) {
        setErrorMessage(t.invalidOtpCode);
        return;
      }

      // مهم: نثبت الجلسة بعد التحقق عشان ما يرجعك AuthProvider إلى Login
      if (data.session) {
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
      }

      if (data.user) {
        const { error: profileError } = await supabase.from("profiles").upsert({
          id: data.user.id,
          username: cleanEmail,
          full_name: fullName,
          avatar_url: null,
          website: null,
        });

        if (profileError) {
          console.log("Profile Upsert Error:", profileError);
        }
      }

      setOtpValues(Array(OTP_DIGITS).fill(""));
      Keyboard.dismiss();
      setFocusedIndex(null);
      setShowVerifySuccess(true);
    } catch (err) {
      console.log(err);
      setErrorMessage(t.verifyUnexpectedError);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setErrorMessage(t.emailMissing);
      return;
    }

    if (resendTimer > 0 || resending) {
      return;
    }

    try {
      setResending(true);
      clearMessages();

      const { error } = await supabase.auth.resend({
        type: "signup",
        email: cleanEmail,
      });

      if (error) {
        console.log("RESEND CODE ERROR:", error);

        const message = error.message?.toLowerCase() || "";

        if (message.includes("rate limit")) {
          setErrorMessage(t.codeAlreadySent);
          return;
        }

        setErrorMessage(t.resendCodeErrorLater);
        return;
      }

      setOtpValues(Array(OTP_DIGITS).fill(""));
      setResendTimer(RESEND_COOLDOWN);
      setInfoMessage(t.newCodeSent);

      Keyboard.dismiss();
      setFocusedIndex(null);
    } catch (err) {
      console.log(err);
      setErrorMessage(t.resendCodeErrorAgain);
    } finally {
      setResending(false);
    }
  };

  const handleSuccessAnimationFinish = () => {
    if (successNavigationStartedRef.current) return;

    successNavigationStartedRef.current = true;

    setTimeout(() => {
      if (source === "forgot-password") {
        smoothReplace("/forgot-password");
        return;
      }

      // بعد التسجيل والتحقق يروح مباشرة إلى واجهة الإنترو
      smoothReplace("/connection-intro");

      // نخلي طلب الصلاحيات بعد التنقل حتى ما يأخر الجلسة ويرجعك Login
      setTimeout(() => {
        requestPostVerifyPermissions().catch((error) => {
          console.log("Post verify permissions error:", error);
        });
      }, 700);
    }, SUCCESS_HOLD_AFTER_ANIMATION_MS);
  };

  const renderMessage = () => {
    if (errorMessage) {
      return (
        <View style={[styles.messageBoxError, { flexDirection: rowDirection }]}>
          <Ionicons
            name="alert-circle"
            size={isVerySmallScreen ? 17 : 18}
            color={COLORS.error}
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
            size={isVerySmallScreen ? 17 : 18}
            color={COLORS.success}
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
          <Ionicons name="time-outline" size={24} color={COLORS.primary} />
          <Text style={styles.timerText} allowFontScaling={false}>
            {t.resendAfter} {resendTimer} {t.seconds}
          </Text>
        </View>
      );
    }

    return (
      <View style={[styles.resendRow, { flexDirection: rowDirection }]}>
        <Text style={styles.resendQuestion} allowFontScaling={false}>{t.didNotReceiveCode}</Text>

        <TouchableOpacity
          activeOpacity={0.75}
          onPress={handleResendCode}
          disabled={loading || resending}
        >
          <Text style={styles.resendText} allowFontScaling={false}>
            {resending ? t.resendingCode : t.resendCode}
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
        barStyle={darkModeEnabled ? "light-content" : "dark-content"}
      />

      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 16}
        >
          <TouchableWithoutFeedback onPress={dismissKeyboard} accessible={false}>
            <ScrollView
              style={styles.screenScroll}
              contentContainerStyle={styles.screenScrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              <View style={styles.innerContent}>
                <View style={styles.backArea}>
                  <TouchableOpacity
                    style={styles.backButtonWrapper}
                    activeOpacity={0.85}
                    onPress={() => router.back()}
                    disabled={loading || resending}
                  >
                    <Ionicons
                      name={isArabic ? "arrow-forward-outline" : "arrow-back-outline"}
                      size={isVerySmallScreen ? 23 : 25}
                      color={COLORS.textDark}
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.emailSentAnimationWrapper}>
                  <LottieView
                    ref={emailSentLottieRef}
                    source={require("../assets/animations/email-sent.json")}
                    autoPlay
                    loop
                    style={styles.emailSentAnimation}
                  />
                </View>

                <View style={styles.titleArea}>
                  <Text style={styles.title} allowFontScaling={false}>{t.verifyEmailTitle}</Text>

                  <Text style={styles.subtitle} allowFontScaling={false}>{t.verifyEmailSubtitle}</Text>

                  <Text style={styles.emailText} allowFontScaling={false}>{email || t.emailFallback}</Text>
                </View>

                <View style={styles.otpArea}>
                  <Text style={[styles.inputLabel, { textAlign }]} allowFontScaling={false}>
                    {t.enterCode}
                  </Text>

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
                            selectionColor={COLORS.primary}
                            editable={!loading && !resending}
                          />
                        </Animated.View>
                      );
                    })}
                  </View>

                  {renderMessage()}
                </View>

                <View style={styles.bottomArea}>
                  <Animated.View
                    style={[
                      styles.mainButtonAnimatedWrapper,
                      {
                        width: animatedButtonWidth,
                        borderRadius: animatedButtonRadius,
                      },
                    ]}
                  >
                    <TouchableOpacity
                      style={[
                        styles.mainButtonWrapper,
                        loading && styles.mainButtonLoading,
                      ]}
                      onPress={handleVerifyCode}
                      disabled={loading || resending || showVerifySuccess}
                      activeOpacity={0.9}
                    >
                      <LinearGradient
                        colors={[
                          COLORS.primary,
                          COLORS.primaryDark,
                        ]}
                        start={{ x: 0.15, y: 0 }}
                        end={{ x: 0.9, y: 1 }}
                        style={styles.buttonGradient}
                      >
                        <View style={styles.buttonGlassTop} />

                        <View style={styles.loadingRow}>
                          {loading ? (
                            <ActivityIndicator
                              size="small"
                              color={COLORS.white}
                              style={styles.loadingSpinner}
                            />
                          ) : (
                            <Text style={styles.buttonText} allowFontScaling={false}>
                              {t.verifyCode}
                            </Text>
                          )}
                        </View>
                      </LinearGradient>
                    </TouchableOpacity>
                  </Animated.View>

                  {renderResendArea()}
                </View>
              </View>
            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {showVerifySuccess ? (
        <View style={styles.verifySuccessOverlay} pointerEvents="none">
          <BlurView
            intensity={darkModeEnabled ? 42 : 62}
            tint={darkModeEnabled ? "dark" : "light"}
            style={styles.successBlurLayer}
          />

          <View style={styles.successWhiteVeil} />

          <Animated.View
            style={[
              styles.verifySuccessContent,
              {
                opacity: successCardOpacity,
                transform: [
                  { translateY: isVerySmallScreen ? -34 : -54 },
                  { scale: successCardScale },
                ],
              },
            ]}
          >
            <Animated.View
              style={[
                styles.verifySuccessIconWrap,
                {
                  opacity: successIconOpacity,
                  transform: [{ scale: successIconScale }],
                },
              ]}
            >
              <LottieView
                ref={successCheckLottieRef}
                source={require("../assets/animations/success-check.json")}
                autoPlay={false}
                loop={false}
                speed={0.95}
                onAnimationFinish={handleSuccessAnimationFinish}
                style={styles.verifySuccessLottie}
              />
            </Animated.View>

            <Text style={styles.verifySuccessTitle} allowFontScaling={false}>
              {source === "forgot-password"
                ? "تم التحقق بنجاح"
                : "تم التحقق من بريدك"}
            </Text>

            <Text style={styles.verifySuccessSubtitle} allowFontScaling={false}>
              {source === "forgot-password"
                ? "سيتم نقلك لإعادة تعيين كلمة المرور"
                : "سيتم نقلك للخطوة التالية الآن"}
            </Text>
          </Animated.View>
        </View>
      ) : null}

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
  COLORS,
  darkModeEnabled,
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
  isArabic,
}: {
  COLORS: AppColors;
  darkModeEnabled: boolean;
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
  isArabic: boolean;
}) {
  return StyleSheet.create({
    container: {
      flex: 1,
      overflow: "hidden",
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

    screenScroll: {
      flex: 1,
      backgroundColor: COLORS.screenBackground,
    },

    screenScrollContent: {
      flexGrow: 1,
      paddingHorizontal: horizontalPadding,
      paddingTop: isVerySmallScreen ? 0 : 2,
      paddingBottom: bottomSpacing + 8,
      backgroundColor: COLORS.screenBackground,
      alignItems: "center",
    },

    innerContent: {
      flexGrow: 1,
      width: "100%",
      maxWidth: 430,
      alignSelf: "center",
    },

    backArea: {
      width: "100%",
      paddingTop: safeTop,
      alignItems: isArabic ? "flex-end" : "flex-start",
      justifyContent: "center",
      marginBottom: isVerySmallScreen ? -8 : -12,
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
      marginTop: isVerySmallScreen ? -10 : -16,
      marginBottom: isVerySmallScreen ? -6 : -8,
    },

    emailSentAnimation: {
      width: isVerySmallScreen ? 138 : 160,
      height: isVerySmallScreen ? 138 : 160,
    },

    titleArea: {
      width: "100%",
      alignItems: "center",
      justifyContent: "center",
      marginTop: isVerySmallScreen ? -2 : -4,
      marginBottom: isVerySmallScreen ? 10 : isSmallScreen ? 13 : 15,
      paddingHorizontal: clamp(width * 0.02, 8, 14),
    },

    title: {
      fontFamily: FONT_EXTRABOLD,
      fontSize: isVerySmallScreen ? 23 : isSmallScreen ? 25 : 27,
      color: COLORS.primaryDark,
      textAlign: "center",
      letterSpacing: -0.35,
      lineHeight: isVerySmallScreen ? 32 : isSmallScreen ? 35 : 38,
      textShadowColor: COLORS.titleShadow,
      textShadowOffset: { width: 0, height: darkModeEnabled ? 0 : 2 },
      textShadowRadius: darkModeEnabled ? 0 : 12,
    },

    subtitle: {
      fontFamily: FONT_SEMIBOLD,
      marginTop: isVerySmallScreen ? 7 : 9,
      fontSize: isVerySmallScreen ? 12.2 : 13.2,
      lineHeight: isVerySmallScreen ? 20 : 22,
      color: COLORS.placeholder,
      textAlign: "center",
      maxWidth: clamp(width * 0.9, 300, 360),
      textShadowColor: COLORS.subtitleShadow,
      textShadowOffset: { width: 0, height: darkModeEnabled ? 0 : 1 },
      textShadowRadius: darkModeEnabled ? 0 : 10,
    },

    emailText: {
      fontFamily: FONT_BOLD,
      marginTop: 6,
      fontSize: isVerySmallScreen ? 13 : 14,
      color: COLORS.primary,
      textAlign: "center",
      lineHeight: isVerySmallScreen ? 20 : 22,
    },

    otpArea: {
      width: "100%",
      paddingHorizontal: 2,
      marginTop: isVerySmallScreen ? -4 : -8,
    },

    inputLabel: {
      fontFamily: FONT_BOLD,
      color: COLORS.label,
      fontSize: isVerySmallScreen ? 12.6 : 13.6,
      textAlign: "right",
      marginBottom: 9,
      lineHeight: isVerySmallScreen ? 20 : 22,
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
      backgroundColor: COLORS.otpBackground,
      borderWidth: 1.7,
      borderColor: COLORS.border,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: COLORS.shadowGray,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: darkModeEnabled ? 0.1 : Platform.OS === "android" ? 0.14 : 0.2,
      shadowRadius: 4,
      elevation: darkModeEnabled ? 1 : 3,
    },

    otpBoxFilled: {
      borderColor: COLORS.otpFilledBorder,
      backgroundColor: COLORS.otpFilledBackground,
    },

    otpBoxFocused: {
      borderColor: COLORS.primary,
      backgroundColor: COLORS.otpFocusedBackground,
      shadowColor: COLORS.primaryDark,
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: darkModeEnabled ? 0.14 : Platform.OS === "android" ? 0.2 : 0.25,
      shadowRadius: 10,
      elevation: 6,
    },

    otpBoxError: {
      borderColor: COLORS.errorBorder,
      backgroundColor: COLORS.errorSoft,
      shadowColor: COLORS.error,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: darkModeEnabled ? 0.1 : Platform.OS === "android" ? 0.13 : 0.16,
      shadowRadius: 8,
      elevation: 4,
    },

    otpInput: {
      fontFamily: FONT_EXTRABOLD,
      width: "100%",
      height: "100%",
      fontSize: isVerySmallScreen ? 21 : 23,
      color: COLORS.primary,
      textAlign: "center",
      paddingVertical: 0,
      backgroundColor: "transparent",
      letterSpacing: -0.2,
    },

    otpInputFilled: {
      color: COLORS.primary,
    },

    otpInputError: {
      color: COLORS.error,
    },

    messagePlaceholder: {
      minHeight: isVerySmallScreen ? 34 : 38,
    },

    messageBoxError: {
      width: "100%",
      minHeight: isVerySmallScreen ? 34 : 38,
      alignItems: "center",
      justifyContent: "flex-start",
      marginTop: 1,
      paddingHorizontal: 8,
    },

    messageBoxInfo: {
      width: "100%",
      minHeight: isVerySmallScreen ? 34 : 38,
      alignItems: "center",
      justifyContent: "flex-start",
      marginTop: 1,
      paddingHorizontal: 8,
    },

    messageTextInfo: {
      fontFamily: FONT_BOLD,
      color: COLORS.success,
      fontSize: isVerySmallScreen ? 13.8 : 14.8,
      textAlign: "right",
      flex: 1,
      lineHeight: isVerySmallScreen ? 21 : 23,
      includeFontPadding: true,
    },

    messageTextError: {
      fontFamily: FONT_BOLD,
      color: COLORS.error,
      fontSize: isVerySmallScreen ? 13.8 : 14.8,
      textAlign: "right",
      flex: 1,
      lineHeight: isVerySmallScreen ? 21 : 23,
      includeFontPadding: true,
    },

    bottomArea: {
      marginTop: "auto",
      alignItems: "center",
      paddingTop: isVerySmallScreen ? 14 : 20,
      paddingBottom: isVerySmallScreen ? 4 : 8,
    },

    mainButtonAnimatedWrapper: {
      height: buttonHeight,
      alignSelf: "center",
      overflow: "hidden",
      shadowColor: COLORS.primaryDark,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: darkModeEnabled ? 0.14 : Platform.OS === "android" ? 0.18 : 0.24,
      shadowRadius: 14,
      elevation: 6,
      backgroundColor: COLORS.primary,
    },

    mainButtonWrapper: {
      width: "100%",
      height: buttonHeight,
      borderRadius: buttonRadius,
      overflow: "hidden",
      shadowColor: COLORS.primaryDark,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: darkModeEnabled ? 0.14 : Platform.OS === "android" ? 0.18 : 0.24,
      shadowRadius: 14,
      elevation: 6,
      backgroundColor: COLORS.primary,
    },

    mainButtonLoading: {
      opacity: 1,
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
      marginRight: 0,
      transform: [{ scale: isVerySmallScreen ? 0.9 : 1 }],
    },

    buttonText: {
      fontFamily: FONT_EXTRABOLD,
      color: COLORS.white,
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
      minHeight: isVerySmallScreen ? 30 : 34,
      paddingHorizontal: isVerySmallScreen ? 6 : 8,
      paddingVertical: isVerySmallScreen ? 4 : 5,
      borderRadius: 0,
      backgroundColor: "transparent",
      borderWidth: 0,
      borderColor: "transparent",
      flexDirection: "row-reverse",
      alignItems: "center",
      justifyContent: "center",
      gap: 7,
    },

    timerText: {
      fontFamily: FONT_BOLD,
      flexShrink: 1,
      color: COLORS.timerText,
      fontSize: isVerySmallScreen ? 13.8 : 15,
      textAlign: "center",
      lineHeight: isVerySmallScreen ? 21 : 23,
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
      color: COLORS.resendQuestion,
      fontSize: isVerySmallScreen ? 14.6 : 15.6,
      lineHeight: isVerySmallScreen ? 22 : 24,
    },

    resendText: {
      fontFamily: FONT_BOLD,
      color: COLORS.primary,
      fontSize: isVerySmallScreen ? 14.6 : 15.6,
      textDecorationLine: "none",
      lineHeight: isVerySmallScreen ? 22 : 24,
    },

    verifySuccessOverlay: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 90,
      backgroundColor: "transparent",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 28,
    },

    successBlurLayer: {
      ...StyleSheet.absoluteFillObject,
    },

    successWhiteVeil: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: darkModeEnabled
        ? "rgba(255,255,255,0.20)"
        : "rgba(255,255,255,0.88)",
    },

    verifySuccessContent: {
      width: "100%",
      maxWidth: 360,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 18,
      backgroundColor: "transparent",
    },

    verifySuccessIconWrap: {
      width: isVerySmallScreen ? 138 : 154,
      height: isVerySmallScreen ? 138 : 154,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "transparent",
      overflow: "visible",
    },

    verifySuccessLottie: {
      width: isVerySmallScreen ? 138 : 154,
      height: isVerySmallScreen ? 138 : 154,
    },

    verifySuccessTitle: {
      fontFamily: FONT_EXTRABOLD,
      marginTop: 18,
      color: darkModeEnabled ? COLORS.white : COLORS.primaryDark,
      fontSize: isVerySmallScreen ? 22 : 24,
      textAlign: "center",
      lineHeight: isVerySmallScreen ? 30 : 32,
      includeFontPadding: true,
      textShadowColor: darkModeEnabled ? "rgba(0,0,0,0.45)" : "rgba(255,255,255,0.85)",
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 7,
    },

    verifySuccessSubtitle: {
      fontFamily: FONT_SEMIBOLD,
      marginTop: 8,
      color: darkModeEnabled ? "rgba(255,255,255,0.84)" : COLORS.muted,
      fontSize: isVerySmallScreen ? 13.8 : 14.8,
      textAlign: "center",
      lineHeight: isVerySmallScreen ? 21 : 23,
      includeFontPadding: true,
      textShadowColor: darkModeEnabled ? "rgba(0,0,0,0.42)" : "rgba(255,255,255,0.75)",
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 6,
    },

    transitionOverlay: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 100,
      backgroundColor: COLORS.screenBackground,
    },
  });
}