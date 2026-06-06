import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
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
  Platform,
  StatusBar,
  useWindowDimensions,
  Animated,
  Easing,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import LottieView from "lottie-react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
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

const APP_DARK_MODE_KEY = "app_dark_mode_enabled";

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
  placeholder: "#B0A6A4",
  border: "#DCDCDC",

  shadowGray: "#8E8E8E",
  white: "#FFFFFF",

  error: "#D32F2F",
  errorSoft: "rgba(211,47,47,0.045)",
  errorBorder: "rgba(211,47,47,0.55)",
  success: "#2E7D32",
  successSoft: "rgba(46,125,50,0.08)",

  rulesBackground: "#F5F5F5",
  rulesBorder: "rgba(170,170,170,0.45)",
  rulesText: "#6C5B58",
};

const DARK_COLORS = {
  screenBackground: "#151515",

  primary: "#C8564E",
  primaryDark: "#C8564E",
  primaryText: "#C8564E",
  buttonGradientStart: "#B63A34",
  buttonGradientEnd: "#871B17",

  title: "#C8564E",
  textDark: "#F2F2F2",
  inputText: "#FFFFFF",

  label: "#C9C0BD",
  placeholder: "#8F8F8F",
  border: "rgba(255,255,255,0.16)",

  shadowGray: "#000000",
  white: "#FFFFFF",

  error: "#EF7676",
  errorSoft: "rgba(239,118,118,0.10)",
  errorBorder: "rgba(239,118,118,0.45)",
  success: "#6EDB7B",
  successSoft: "rgba(110,219,123,0.12)",

  rulesBackground: "rgba(255,255,255,0.055)",
  rulesBorder: "rgba(255,255,255,0.14)",
  rulesText: "#D7D7D7",
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const FONT_SEMIBOLD = "Alexandria_600SemiBold";
const FONT_BOLD = "Alexandria_700Bold";
const FONT_EXTRABOLD = "Alexandria_800ExtraBold";

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const SUCCESS_LOTTIE_START_FRAME = 0;
const SUCCESS_LOTTIE_END_FRAME = 50;
const SUCCESS_NAVIGATION_DELAY_MS = 2350;

export default function NewPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ from?: string }>();
  const { t, isArabic } = useLanguage();
  const { darkModeEnabled } = useAppSettings();

  const from = String(params.from || "").toLowerCase().trim();

  const [shouldReturnToSettingsAfterSuccess, setShouldReturnToSettingsAfterSuccess] =
    useState(from === "settings");

  const [fontsLoaded] = useFonts({
    Alexandria_400Regular,
    Alexandria_600SemiBold,
    Alexandria_700Bold,
    Alexandria_800ExtraBold,
  });

  /**
   * مهم جدًا:
   * نفس المفتاح الموجود في AppSettingsProvider:
   * app_dark_mode_enabled
   *
   * لا نستخدم مفاتيح تخمين؛ لأنها ممكن تلقط false من مفتاح قديم
   * وتخلي New Password يطلع Light بالغلط.
   */
  const [storedDarkModePreference, setStoredDarkModePreference] =
    useState<boolean | null>(null);
  const [themePreferenceReady, setThemePreferenceReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadSavedDarkMode = async () => {
      try {
        const savedDarkMode = await AsyncStorage.getItem(APP_DARK_MODE_KEY);

        if (!mounted) return;

        if (savedDarkMode === "true") {
          setStoredDarkModePreference(true);
        } else if (savedDarkMode === "false") {
          setStoredDarkModePreference(false);
        } else {
          setStoredDarkModePreference(null);
        }

        setThemePreferenceReady(true);
      } catch (error) {
        console.log("Load NewPassword dark mode error:", error);

        if (mounted) {
          setStoredDarkModePreference(null);
          setThemePreferenceReady(true);
        }
      }
    };

    loadSavedDarkMode();

    return () => {
      mounted = false;
    };
  }, []);

  const isDarkMode =
    storedDarkModePreference !== null
      ? storedDarkModePreference
      : darkModeEnabled === true;

  const colors = isDarkMode ? DARK_COLORS : LIGHT_COLORS;

  const textAlign = isArabic ? "right" : "left";
  const rowDirection = isArabic ? "row-reverse" : "row";
  const iconMargin = isArabic ? { marginLeft: 11 } : { marginRight: 11 };
  const eyeMargin = isArabic ? { marginRight: 8 } : { marginLeft: 8 };

  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [showPasswordSuccess, setShowPasswordSuccess] = useState(false);

  const [loading, setLoading] = useState(false);

  const keyboardTranslateY = useRef(new Animated.Value(0)).current;
  const transitionAnim = useRef(new Animated.Value(0)).current;
  const successCardScale = useRef(new Animated.Value(0.92)).current;
  const successCardOpacity = useRef(new Animated.Value(0)).current;
  const successLottieRef = useRef<LottieView>(null);

  const isVerySmallScreen = height < 650;
  const isSmallScreen = height < 720;
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

  const digitCount = (password.match(/[0-9]/g) || []).length;

  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasSixDigits = digitCount >= 6;
  const hasSpecialCharacter =
    /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password);

  const passwordsMatch =
    password.length > 0 &&
    confirmPassword.length > 0 &&
    password === confirmPassword;

  const isPasswordValid =
    hasUpperCase && hasLowerCase && hasSixDigits && hasSpecialCharacter;

  const styles = useMemo(
    () =>
      createStyles({
        width,
        height,
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
        colors,
        isDarkMode,
        isArabic,
      }),
    [
      width,
      height,
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
      colors,
      isDarkMode,
      isArabic,
    ]
  );

  useEffect(() => {
    let mounted = true;

    const resolveReturnTarget = async () => {
      try {
        const [returnToSettingsFlag, startedFromSettingsFlag] =
          await Promise.all([
            AsyncStorage.getItem("password_change_return_to_settings"),
            AsyncStorage.getItem("password_change_started_from_settings"),
          ]);

        const shouldReturnToSettings =
          from === "settings" ||
          returnToSettingsFlag === "true" ||
          startedFromSettingsFlag === "true";

        if (mounted) {
          setShouldReturnToSettingsAfterSuccess(shouldReturnToSettings);
        }

        if (!shouldReturnToSettings) {
          await AsyncStorage.multiRemove([
            "password_change_return_to_settings",
            "password_change_started_from_settings",
          ]);
        }
      } catch (cleanupError) {
        console.log("Resolve password return target error:", cleanupError);
      }
    };

    resolveReturnTarget();

    return () => {
      mounted = false;
    };
  }, [from]);

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const keyboardShift = isVerySmallScreen ? -118 : isSmallScreen ? -100 : -82;

    const showSubscription = Keyboard.addListener(showEvent, () => {
      Animated.timing(keyboardTranslateY, {
        toValue: keyboardShift,
        duration: 180,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
    });

    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      Animated.timing(keyboardTranslateY, {
        toValue: 0,
        duration: 180,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [keyboardTranslateY, isSmallScreen, isVerySmallScreen]);

  const clearMessages = () => {
    setErrorMessage("");
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

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

  useEffect(() => {
    if (!showPasswordSuccess) return;

    successCardScale.setValue(0.96);
    successCardOpacity.setValue(0);
    successLottieRef.current?.reset();

    const playTimer = setTimeout(() => {
      successLottieRef.current?.play(
        SUCCESS_LOTTIE_START_FRAME,
        SUCCESS_LOTTIE_END_FRAME
      );
    }, 35);

    Animated.parallel([
      Animated.timing(successCardOpacity, {
        toValue: 1,
        duration: 90,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(successCardScale, {
        toValue: 1,
        friction: 8,
        tension: 120,
        useNativeDriver: true,
      }),
    ]).start();

    return () => clearTimeout(playTimer);
  }, [showPasswordSuccess, successCardScale, successCardOpacity]);

  const cleanupPasswordRecoveryFlags = async () => {
    try {
      await AsyncStorage.multiRemove([
        "password_recovery_flow",
        "password_change_return_to_settings",
        "password_change_started_from_settings",
      ]);
      await setPasswordRecoveryMode(false);
    } catch (cleanupError) {
      console.log("Password recovery cleanup error:", cleanupError);
    }
  };

  const handleUpdatePassword = async () => {
    const cleanPassword = password.trim();
    const cleanConfirmPassword = confirmPassword.trim();

    Keyboard.dismiss();

    if (!cleanPassword) {
      setErrorMessage(t.newPasswordRequired);
      return;
    }

    if (!isPasswordValid) {
      setErrorMessage(t.passwordRequirementsError);
      return;
    }

    if (!cleanConfirmPassword) {
      setErrorMessage(t.confirmNewPasswordRequired);
      return;
    }

    if (cleanPassword !== cleanConfirmPassword) {
      setErrorMessage(t.newPasswordMismatch);
      return;
    }

    try {
      setLoading(true);
      clearMessages();

      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError) {
        console.log("getSession error:", sessionError.message);
        setErrorMessage(t.newPasswordSessionExpired);
        return;
      }

      if (!sessionData.session) {
        console.log("No recovery session found");
        setErrorMessage(t.newPasswordSessionExpired);
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: cleanPassword,
      });

      if (updateError) {
        console.log("update password error:", updateError.message);
        setErrorMessage(t.newPasswordSessionExpired);
        return;
      }

      setPassword("");
      setConfirmPassword("");
      setShowPasswordSuccess(true);

      setTimeout(() => {
        if (shouldReturnToSettingsAfterSuccess) {
          router.replace("/(tabs)/settings" as any);

          setTimeout(() => {
            cleanupPasswordRecoveryFlags();
          }, 250);

          return;
        }

        cleanupPasswordRecoveryFlags().finally(() => {
          smoothReplace("/login");
        });
      }, SUCCESS_NAVIGATION_DELAY_MS);
    } catch (error) {
      console.log("new password error:", error);
      setErrorMessage(t.newPasswordUnexpectedError);
    } finally {
      setLoading(false);
    }
  };

  const renderRule = (isValid: boolean, text: string) => {
    return (
      <View style={[styles.passwordRuleRow, { flexDirection: rowDirection }]}>
        <Ionicons
          name={isValid ? "checkmark-circle" : "close-circle-outline"}
          size={isVerySmallScreen ? 15 : 16}
          color={isValid ? colors.success : colors.rulesText}
          style={
            isArabic ? styles.passwordRuleIconAr : styles.passwordRuleIconEn
          }
        />

        <Text
          style={[
            styles.passwordRuleText,
            { textAlign },
            isValid && styles.passwordRuleTextValid,
          ]}
          allowFontScaling={false}
        >
          {text}
        </Text>
      </View>
    );
  };

  const renderMessage = () => {
    if (errorMessage) {
      return (
        <View style={[styles.messageBoxError, { flexDirection: rowDirection }]}>
          <Ionicons
            name="alert-circle"
            size={14}
            color={colors.error}
            style={isArabic ? styles.messageIconAr : styles.messageIconEn}
          />

          <Text
            style={[styles.messageTextError, { textAlign }]}
            allowFontScaling={false}
          >
            {errorMessage}
          </Text>
        </View>
      );
    }

    return <View style={styles.messagePlaceholder} />;
  };

  if (!fontsLoaded || !themePreferenceReady) {
    return null;
  }

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard} accessible={false}>
      <View style={styles.container}>
        <StatusBar
          translucent
          backgroundColor="transparent"
          barStyle={isDarkMode ? "light-content" : "dark-content"}
        />

        <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
          <View style={styles.screenContent}>
            <Animated.View
              style={[
                styles.topContent,
                {
                  transform: [{ translateY: keyboardTranslateY }],
                },
              ]}
            >
              <View style={styles.backArea}>
                <TouchableOpacity
                  style={styles.backButtonWrapper}
                  activeOpacity={0.85}
                  onPress={() => {
                    if (shouldReturnToSettingsAfterSuccess) {
                      router.replace("/(tabs)/settings" as any);
                      return;
                    }

                    router.back();
                  }}
                  disabled={loading || showPasswordSuccess}
                >
                  <Ionicons
                    name={
                      isArabic
                        ? "arrow-forward-outline"
                        : "arrow-back-outline"
                    }
                    size={isVerySmallScreen ? 23 : 25}
                    color={colors.textDark}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.titleArea}>
                <Text style={styles.title} allowFontScaling={false}>
                  {t.newPasswordTitle}
                </Text>

                <Text style={styles.subtitle} allowFontScaling={false}>
                  {t.newPasswordSubtitle}
                </Text>
              </View>

              <View style={styles.formArea}>
                <View
                  style={[
                    styles.inputBox,
                    { flexDirection: rowDirection },
                    errorMessage && styles.inputBoxError,
                  ]}
                >
                  <Feather
                    name="lock"
                    size={isVerySmallScreen ? 20 : 21}
                    color={colors.primary}
                    style={[styles.inputIcon, iconMargin]}
                  />

                  <TextInput
                    allowFontScaling={false}
                    style={styles.input}
                    placeholder={t.newPasswordPlaceholder}
                    placeholderTextColor={colors.placeholder}
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      clearMessages();
                    }}
                    textAlign={textAlign}
                    autoCapitalize="none"
                    autoCorrect={false}
                    selectionColor={colors.primary}
                    returnKeyType="next"
                    editable={!loading && !showPasswordSuccess}
                  />

                  <TouchableOpacity
                    style={[styles.eyeButton, eyeMargin]}
                    activeOpacity={0.7}
                    onPress={() => setShowPassword(!showPassword)}
                    disabled={loading || showPasswordSuccess}
                  >
                    <Ionicons
                      name={showPassword ? "eye-outline" : "eye-off-outline"}
                      size={isVerySmallScreen ? 20 : 21}
                      color={colors.primary}
                    />
                  </TouchableOpacity>
                </View>

                <View
                  style={[
                    styles.inputBox,
                    { flexDirection: rowDirection },
                    errorMessage === t.newPasswordMismatch &&
                      styles.inputBoxError,
                  ]}
                >
                  <Feather
                    name="lock"
                    size={isVerySmallScreen ? 20 : 21}
                    color={colors.primary}
                    style={[styles.inputIcon, iconMargin]}
                  />

                  <TextInput
                    allowFontScaling={false}
                    style={styles.input}
                    placeholder={t.confirmNewPasswordPlaceholder}
                    placeholderTextColor={colors.placeholder}
                    secureTextEntry={!showConfirmPassword}
                    value={confirmPassword}
                    onChangeText={(text) => {
                      setConfirmPassword(text);
                      clearMessages();
                    }}
                    textAlign={textAlign}
                    autoCapitalize="none"
                    autoCorrect={false}
                    selectionColor={colors.primary}
                    returnKeyType="done"
                    editable={!loading && !showPasswordSuccess}
                    onSubmitEditing={handleUpdatePassword}
                  />

                  <TouchableOpacity
                    style={[styles.eyeButton, eyeMargin]}
                    activeOpacity={0.7}
                    onPress={() =>
                      setShowConfirmPassword(!showConfirmPassword)
                    }
                    disabled={loading || showPasswordSuccess}
                  >
                    <Ionicons
                      name={
                        showConfirmPassword
                          ? "eye-outline"
                          : "eye-off-outline"
                      }
                      size={isVerySmallScreen ? 20 : 21}
                      color={colors.primary}
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.passwordRulesBox}>
                  <Text
                    style={[styles.passwordRulesTitle, { textAlign }]}
                    allowFontScaling={false}
                  >
                    {t.passwordRulesTitle}
                  </Text>

                  {renderRule(hasUpperCase, t.passwordRuleUppercase)}
                  {renderRule(hasLowerCase, t.passwordRuleLowercase)}
                  {renderRule(hasSixDigits, t.passwordRuleSixDigits)}
                  {renderRule(hasSpecialCharacter, t.passwordRuleSpecial)}
                  {renderRule(passwordsMatch, t.newPasswordRuleMatch)}
                </View>

                {renderMessage()}
              </View>
            </Animated.View>

            <View style={styles.bottomArea}>
              <AnimatedTouchableOpacity
                style={[
                  styles.mainButtonWrapper,
                  animatedMainButtonStyle,
                  loading && styles.mainButtonDisabled,
                ]}
                onPress={handleUpdatePassword}
                disabled={loading || showPasswordSuccess}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={[
                    colors.buttonGradientStart,
                    colors.buttonGradientEnd,
                  ]}
                  start={{ x: 0.15, y: 0 }}
                  end={{ x: 0.9, y: 1 }}
                  style={styles.buttonGradient}
                >
                  <View style={styles.buttonGlassTop} />

                  <View style={styles.loadingRow}>
                    {loading ? (
                      <ActivityIndicator size="small" color={colors.white} />
                    ) : (
                      <Text style={styles.buttonText} allowFontScaling={false}>
                        {t.saveNewPassword}
                      </Text>
                    )}
                  </View>
                </LinearGradient>
              </AnimatedTouchableOpacity>

              <View style={styles.loadingStatusArea}>
                {loading ? (
                  <Text style={styles.loadingStatusText} allowFontScaling={false}>
                    {isArabic
                      ? "جاري تحديث كلمة المرور..."
                      : "Updating password..."}
                  </Text>
                ) : null}
              </View>
            </View>
          </View>
        </SafeAreaView>

        {showPasswordSuccess ? (
          <View style={styles.passwordSuccessOverlay} pointerEvents="none">
            <BlurView
              intensity={isDarkMode ? 42 : 58}
              tint={isDarkMode ? "dark" : "light"}
              style={StyleSheet.absoluteFillObject}
            />

            <Animated.View
              style={[
                styles.passwordSuccessContent,
                {
                  opacity: successCardOpacity,
                  transform: [{ scale: successCardScale }],
                },
              ]}
            >
              <LottieView
                ref={successLottieRef}
                source={require("../../assets/animations/success-check.json")}
                loop={false}
                autoPlay={false}
                speed={1.45}
                style={styles.passwordSuccessAnimation}
              />

              <Text style={styles.passwordSuccessTitle} allowFontScaling={false}>
                {t.newPasswordSavedSuccess}
              </Text>

              <Text
                style={styles.passwordSuccessSubtitle}
                allowFontScaling={false}
              >
                {isArabic ? "سيتم نقلك الآن" : "You will be redirected now"}
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
    </TouchableWithoutFeedback>
  );
}

function createStyles({
  width,
  height,
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
  colors,
  isDarkMode,
  isArabic,
}: {
  width: number;
  height: number;
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

    screenContent: {
      flex: 1,
      height,
      paddingHorizontal: horizontalPadding,
      paddingTop: topSpacing,
      paddingBottom: bottomSpacing,
      backgroundColor: colors.screenBackground,
      justifyContent: "space-between",
      width: "100%",
      maxWidth: 430,
      alignSelf: "center",
    },

    topContent: {
      width: "100%",
      flexShrink: 1,
    },

    backArea: {
      width: "100%",
      paddingTop: safeTop + 2,
      alignItems: isArabic ? "flex-end" : "flex-start",
      justifyContent: "center",
      marginBottom: isVerySmallScreen ? 16 : 20,
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
      marginBottom: isVerySmallScreen ? 24 : isSmallScreen ? 30 : 34,
      paddingHorizontal: clamp(width * 0.02, 8, 14),
    },

    title: {
      fontFamily: FONT_EXTRABOLD,
      fontSize: isVerySmallScreen ? 23 : isSmallScreen ? 25 : 27,
      color: colors.primaryText,
      textAlign: "center",
      letterSpacing: -0.35,
      lineHeight: isVerySmallScreen ? 32 : isSmallScreen ? 35 : 38,
      textShadowColor: isDarkMode
        ? "rgba(0,0,0,0.35)"
        : "rgba(255,255,255,0.95)",
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 12,
      includeFontPadding: false,
    },

    subtitle: {
      fontFamily: FONT_SEMIBOLD,
      marginTop: isVerySmallScreen ? 12 : 15,
      fontSize: isVerySmallScreen ? 12.2 : 13.2,
      lineHeight: isVerySmallScreen ? 20 : 22,
      color: colors.placeholder,
      textAlign: "center",
      maxWidth: clamp(width * 0.9, 300, 360),
      textShadowColor: isDarkMode
        ? "rgba(0,0,0,0.35)"
        : "rgba(255,255,255,0.9)",
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 10,
      includeFontPadding: false,
    },

    formArea: {
      width: "100%",
    },

    inputBox: {
      width: "100%",
      height: inputHeight,
      borderRadius: inputRadius,
      marginBottom: isVerySmallScreen ? 12 : 14,
      paddingHorizontal: isVerySmallScreen ? 14 : 16,
      alignItems: "center",
      backgroundColor: isDarkMode
        ? "rgba(255,255,255,0.055)"
        : colors.white,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.shadowGray,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: Platform.OS === "android" ? 0.05 : 0.035,
      shadowRadius: 6,
      elevation: 1,
    },

    inputBoxError: {
      borderColor: colors.errorBorder,
      backgroundColor: colors.errorSoft,
    },

    inputIcon: {
      marginLeft: 0,
      marginRight: 0,
    },

    input: {
      fontFamily: FONT_SEMIBOLD,
      flex: 1,
      minHeight: inputHeight - 8,
      fontSize: isVerySmallScreen ? 14.4 : 15.4,
      color: colors.inputText,
      paddingVertical: 0,
      textAlignVertical: "center",
      includeFontPadding: false,
    },

    eyeButton: {
      width: isVerySmallScreen ? 30 : 32,
      height: isVerySmallScreen ? 30 : 32,
      borderRadius: isVerySmallScreen ? 15 : 16,
      justifyContent: "center",
      alignItems: "center",
    },

    passwordRulesBox: {
      width: "100%",
      height: isVerySmallScreen ? 138 : 148,
      marginTop: 2,
      marginBottom: isVerySmallScreen ? 10 : 12,
      paddingHorizontal: isVerySmallScreen ? 12 : 14,
      paddingVertical: isVerySmallScreen ? 7 : 8,
      borderRadius: 17,
      backgroundColor: colors.rulesBackground,
      borderWidth: 1.1,
      borderColor: colors.rulesBorder,
      overflow: "hidden",
    },

    passwordRulesTitle: {
      fontFamily: FONT_BOLD,
      color: colors.rulesText,
      fontSize: isVerySmallScreen ? 12.2 : 13,
      textAlign: "right",
      marginBottom: 5,
      lineHeight: isVerySmallScreen ? 18 : 20,
      includeFontPadding: false,
    },

    passwordRuleRow: {
      alignItems: "center",
      justifyContent: "flex-start",
      marginTop: 4,
    },

    passwordRuleIconAr: {
      marginLeft: 7,
    },

    passwordRuleIconEn: {
      marginRight: 7,
    },

    passwordRuleText: {
      fontFamily: FONT_SEMIBOLD,
      flex: 1,
      color: colors.rulesText,
      fontSize: isVerySmallScreen ? 11.3 : 12.1,
      textAlign: "right",
      lineHeight: isVerySmallScreen ? 17 : 19,
      includeFontPadding: false,
    },

    passwordRuleTextValid: {
      color: colors.success,
    },

    messagePlaceholder: {
      minHeight: isVerySmallScreen ? 28 : 32,
      marginTop: 6,
    },

    messageBoxError: {
      width: "100%",
      minHeight: isVerySmallScreen ? 28 : 32,
      alignItems: "center",
      justifyContent: "flex-start",
      marginTop: 6,
      paddingHorizontal: 8,
    },

    messageIconAr: {
      marginLeft: 10,
    },

    messageIconEn: {
      marginRight: 10,
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

    bottomArea: {
      width: "100%",
      alignItems: "center",
      paddingTop: isVerySmallScreen ? 12 : 16,
      paddingBottom: isVerySmallScreen ? 4 : 8,
    },

    mainButtonWrapper: {
      width: "100%",
      alignSelf: "center",
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
      backgroundColor: "rgba(255,255,255,0.1)",
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
      includeFontPadding: false,
      lineHeight: isVerySmallScreen ? 28 : 30,
      letterSpacing: -0.15,
      textAlignVertical: "center",
      paddingTop: Platform.OS === "ios" ? 1 : 0,
      paddingBottom: Platform.OS === "ios" ? 1 : 0,
    },

    passwordSuccessOverlay: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 90,
      backgroundColor: isDarkMode
        ? "rgba(0,0,0,0.44)"
        : "rgba(255,255,255,0.62)",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 28,
    },

    passwordSuccessContent: {
      width: "100%",
      maxWidth: 335,
      alignItems: "center",
      justifyContent: "center",
      marginTop: -44,
    },

    passwordSuccessAnimation: {
      width: isVerySmallScreen ? 150 : 172,
      height: isVerySmallScreen ? 150 : 172,
    },

    passwordSuccessTitle: {
      fontFamily: FONT_EXTRABOLD,
      marginTop: isVerySmallScreen ? 2 : 4,
      color: isDarkMode ? "#FFFFFF" : colors.primaryText,
      fontSize: isVerySmallScreen ? 17 : 18.5,
      textAlign: "center",
      lineHeight: isVerySmallScreen ? 24 : 27,
      includeFontPadding: false,
      textShadowColor: isDarkMode
        ? "rgba(0,0,0,0.24)"
        : "rgba(255,255,255,0.9)",
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 8,
    },

    passwordSuccessSubtitle: {
      fontFamily: FONT_SEMIBOLD,
      marginTop: 8,
      color: isDarkMode ? "rgba(255,255,255,0.86)" : colors.textDark,
      fontSize: isVerySmallScreen ? 13.2 : 14.2,
      textAlign: "center",
      lineHeight: isVerySmallScreen ? 20 : 22,
      includeFontPadding: false,
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
      color: colors.label,
      fontSize: isVerySmallScreen ? 12.8 : 13.8,
      lineHeight: isVerySmallScreen ? 20 : 22,
      textAlign: "center",
      includeFontPadding: true,
    },

    transitionOverlay: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 100,
      backgroundColor: colors.screenBackground,
    },
  });
}