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

  primary: "#B63A34",
  primaryDark: "#871B17",
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

export default function NewPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ from?: string }>();
  const { t, isArabic } = useLanguage();
  const { darkModeEnabled } = useAppSettings();

  const from = String(params.from || "").toLowerCase().trim();

  /**
   * نحدد وجهة الرجوع بعد تغيير كلمة المرور:
   * - إذا المستخدم بدأ من الإعدادات نحفظ flag في AsyncStorage من settings.
   * - إذا المستخدم بدأ من Login / Forgot Password ما يكون فيه flag، ويرجع للـ Login.
   */
  const [shouldReturnToSettingsAfterSuccess, setShouldReturnToSettingsAfterSuccess] =
    useState(from === "settings");

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
  const successCardScale = useRef(new Animated.Value(0.88)).current;
  const successCardOpacity = useRef(new Animated.Value(0)).current;
  const successIconScale = useRef(new Animated.Value(0.35)).current;
  const successIconOpacity = useRef(new Animated.Value(0)).current;

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

        /**
         * لو الصفحة مفتوحة من Login / Forgot Password وما فيه flags للإعدادات،
         * نمسح أي قيمة قديمة احتياطًا.
         */
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

    successCardScale.setValue(0.88);
    successCardOpacity.setValue(0);
    successIconScale.setValue(0.35);
    successIconOpacity.setValue(0);

    Animated.parallel([
      Animated.timing(successCardOpacity, {
        toValue: 1,
        duration: 160,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(successCardScale, {
        toValue: 1,
        friction: 7,
        tension: 90,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(90),
        Animated.parallel([
          Animated.timing(successIconOpacity, {
            toValue: 1,
            duration: 120,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.spring(successIconScale, {
            toValue: 1,
            friction: 5,
            tension: 115,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start();
  }, [
    showPasswordSuccess,
    successCardScale,
    successCardOpacity,
    successIconScale,
    successIconOpacity,
  ]);

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
          /**
           * من الإعدادات:
           * نرجع للإعدادات أول، وبعدها نمسح flags الاستعادة.
           */
          router.replace("/(tabs)/settings" as any);

          setTimeout(() => {
            cleanupPasswordRecoveryFlags();
          }, 250);

          return;
        }

        /**
         * من Login / Forgot Password:
         * نمسح كل flags، ثم نرجع للـ Login.
         * هذا يمنع الرجوع للإعدادات بالغلط بسبب flags قديمة.
         */
        cleanupPasswordRecoveryFlags().finally(() => {
          smoothReplace("/login");
        });
      }, 1500);
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

  if (!fontsLoaded) {
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
              <TouchableOpacity
                style={[
                  styles.mainButtonWrapper,
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
                      <ActivityIndicator
                        size="small"
                        color={colors.white}
                        style={styles.loadingSpinner}
                      />
                    ) : null}

                    <Text style={styles.buttonText} allowFontScaling={false}>
                      {loading ? t.savingNewPassword : t.saveNewPassword}
                    </Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>

        {showPasswordSuccess ? (
          <View style={styles.passwordSuccessOverlay} pointerEvents="none">
            <Animated.View
              style={[
                styles.passwordSuccessBox,
                {
                  opacity: successCardOpacity,
                  transform: [{ scale: successCardScale }],
                },
              ]}
            >
              <Animated.View
                style={[
                  styles.passwordSuccessIconWrap,
                  {
                    opacity: successIconOpacity,
                    transform: [{ scale: successIconScale }],
                  },
                ]}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={74}
                  color={colors.success}
                />
              </Animated.View>

              <Text style={styles.passwordSuccessTitle} allowFontScaling={false}>
                {t.newPasswordSavedSuccess}
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
      color: colors.title,
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
        ? "rgba(0,0,0,0.55)"
        : "rgba(255,255,255,0.70)",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 28,
    },

    passwordSuccessBox: {
      width: "100%",
      maxWidth: 335,
      minHeight: 188,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 22,
      paddingTop: 26,
      paddingBottom: 24,
      borderRadius: 26,
      backgroundColor: isDarkMode ? "#242424" : "#F7F7F7",
      borderWidth: 1.2,
      borderColor: isDarkMode
        ? "rgba(255,255,255,0.18)"
        : "rgba(170,170,170,0.42)",
      shadowColor: isDarkMode ? "#000000" : colors.shadowGray,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: Platform.OS === "android" ? 0.22 : 0.28,
      shadowRadius: 22,
      elevation: 10,
      overflow: "visible",
    },

    passwordSuccessIconWrap: {
      width: 86,
      height: 86,
      borderRadius: 43,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: isDarkMode
        ? "rgba(110,219,123,0.12)"
        : "rgba(46,125,50,0.08)",
      overflow: "visible",
    },

    passwordSuccessTitle: {
      marginTop: 14,
      color: isDarkMode ? "#F6F6F6" : colors.primaryText,
      fontSize: isVerySmallScreen ? 16.5 : 17.5,
      textAlign: "center",
      lineHeight: isVerySmallScreen ? 23 : 25,
      includeFontPadding: false,
    },

    transitionOverlay: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 100,
      backgroundColor: colors.screenBackground,
    },
  });
}