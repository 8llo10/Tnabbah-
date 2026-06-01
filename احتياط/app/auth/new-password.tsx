import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "expo-router";
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
import { useLanguage } from "../../providers/LanguageProvider";

const COLORS = {
  screenBackground: "#FFFFFF",

  primary: "#9A211C",
  primaryDark: "#761713",
  primaryText: "#871B17",

  title: "#7B1714",
  textDark: "#2C2C2C",
  inputText: "#2E1D1D",

  label: "#8C7A76",
  placeholder: "#B0A6A4",
  border: "rgba(205,205,205,0.95)",

  shadowGray: "#8E8E8E",
  white: "#FFFFFF",

  error: "#D32F2F",
  success: "#2E7D32",
  successSoft: "rgba(46,125,50,0.08)",

  rulesBackground: "#F5F5F5",
  rulesBorder: "rgba(170,170,170,0.45)",
  rulesText: "#6C5B58",
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export default function NewPasswordScreen() {
  const router = useRouter();
  const { t, isArabic } = useLanguage();

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

  const isVerySmallScreen = height < 650;
  const isSmallScreen = height < 720;

  const horizontalPadding = clamp(width * 0.055, 18, 24);

  const backButtonSize = isVerySmallScreen ? 42 : 46;
  const backButtonRadius = backButtonSize / 2;

  const topSpacing = clamp(height * 0.008, 4, 8);
  const bottomSpacing = clamp(height * 0.014, 8, 14);

  const inputHeight = isVerySmallScreen ? 58 : 62;
  const inputRadius = inputHeight / 2;

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
    ]
  );

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

      await AsyncStorage.removeItem("password_recovery_flow");
      await setPasswordRecoveryMode(false);

      setShowPasswordSuccess(true);

      setTimeout(() => {
        smoothReplace("/login");
      }, 1400);
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
          color={isValid ? COLORS.success : COLORS.rulesText}
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
          <Ionicons name="alert-circle" size={24} color={COLORS.primaryText} />

          <Text style={[styles.messageTextError, { textAlign }]}>
            {errorMessage}
          </Text>
        </View>
      );
    }

    return <View style={styles.messagePlaceholder} />;
  };

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard} accessible={false}>
      <View style={styles.container}>
        <StatusBar
          translucent
          backgroundColor="transparent"
          barStyle="dark-content"
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
                  onPress={() => router.back()}
                  disabled={loading || showPasswordSuccess}
                >
                  <Ionicons
                    name="arrow-back-outline"
                    size={isVerySmallScreen ? 23 : 25}
                    color={COLORS.textDark}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.titleArea}>
                <Text style={styles.title}>{t.newPasswordTitle}</Text>

                <Text style={styles.subtitle}>{t.newPasswordSubtitle}</Text>
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
                    color={COLORS.primary}
                    style={[styles.inputIcon, iconMargin]}
                  />

                  <TextInput
                    style={styles.input}
                    placeholder={t.newPasswordPlaceholder}
                    placeholderTextColor={COLORS.placeholder}
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      clearMessages();
                    }}
                    textAlign={textAlign}
                    autoCapitalize="none"
                    autoCorrect={false}
                    selectionColor={COLORS.primary}
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
                      size={isVerySmallScreen ? 21 : 22}
                      color={COLORS.primary}
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
                    color={COLORS.primary}
                    style={[styles.inputIcon, iconMargin]}
                  />

                  <TextInput
                    style={styles.input}
                    placeholder={t.confirmNewPasswordPlaceholder}
                    placeholderTextColor={COLORS.placeholder}
                    secureTextEntry={!showConfirmPassword}
                    value={confirmPassword}
                    onChangeText={(text) => {
                      setConfirmPassword(text);
                      clearMessages();
                    }}
                    textAlign={textAlign}
                    autoCapitalize="none"
                    autoCorrect={false}
                    selectionColor={COLORS.primary}
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
                      size={isVerySmallScreen ? 21 : 22}
                      color={COLORS.primary}
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.passwordRulesBox}>
                  <Text style={[styles.passwordRulesTitle, { textAlign }]}>
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
                  colors={["rgba(154,33,28,0.98)", "rgba(118,23,19,0.98)"]}
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
                    ) : null}

                    <Text style={styles.buttonText}>
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
            <View style={styles.passwordSuccessBox}>
              <Ionicons
                name="checkmark-circle"
                size={58}
                color={COLORS.success}
              />

              <Text style={styles.passwordSuccessTitle}>
                {t.newPasswordSavedSuccess}
              </Text>
            </View>
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

    screenContent: {
      flex: 1,
      height,
      paddingHorizontal: horizontalPadding,
      paddingTop: topSpacing,
      paddingBottom: bottomSpacing,
      backgroundColor: COLORS.screenBackground,
      justifyContent: "space-between",
    },

    topContent: {
      width: "100%",
      flexShrink: 1,
    },

    backArea: {
      width: "100%",
      paddingTop: safeTop + 2,
      alignItems: "flex-start",
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
      fontSize: isVerySmallScreen ? 22 : isSmallScreen ? 24 : 25,
      fontWeight: "900",
      color: COLORS.title,
      textAlign: "center",
      letterSpacing: -0.4,
      lineHeight: isVerySmallScreen ? 32 : 35,
      textShadowColor: "rgba(255,255,255,0.95)",
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 12,
      includeFontPadding: false,
    },

    subtitle: {
      marginTop: isVerySmallScreen ? 12 : 15,
      fontSize: isVerySmallScreen ? 15 : 16.5,
      lineHeight: isVerySmallScreen ? 23 : 27,
      color: COLORS.textDark,
      fontWeight: "800",
      textAlign: "center",
      maxWidth: clamp(width * 0.9, 300, 360),
      textShadowColor: "rgba(255,255,255,0.9)",
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
      paddingHorizontal: isVerySmallScreen ? 16 : 18,
      alignItems: "center",
      backgroundColor: COLORS.white,
      borderWidth: 1.7,
      borderColor: COLORS.border,
      shadowColor: COLORS.shadowGray,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: Platform.OS === "android" ? 0.14 : 0.2,
      shadowRadius: 4,
      elevation: 3,
    },

    inputBoxError: {
      borderColor: "rgba(154,33,28,0.45)",
      backgroundColor: "rgba(154,33,28,0.015)",
    },

    inputIcon: {
      marginLeft: isVerySmallScreen ? 11 : 13,
    },

    input: {
      flex: 1,
      minHeight: inputHeight - 8,
      fontSize: isVerySmallScreen ? 16 : 17,
      color: COLORS.inputText,
      fontWeight: "700",
      paddingVertical: 0,
      textAlignVertical: "center",
      includeFontPadding: false,
    },

    eyeButton: {
      width: isVerySmallScreen ? 32 : 34,
      height: isVerySmallScreen ? 32 : 34,
      borderRadius: isVerySmallScreen ? 16 : 17,
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
      backgroundColor: COLORS.rulesBackground,
      borderWidth: 1.1,
      borderColor: COLORS.rulesBorder,
      overflow: "hidden",
    },

    passwordRulesTitle: {
      color: COLORS.rulesText,
      fontSize: isVerySmallScreen ? 12.2 : 13,
      fontWeight: "900",
      textAlign: "right",
      marginBottom: 5,
      lineHeight: isVerySmallScreen ? 17 : 19,
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
      flex: 1,
      color: COLORS.rulesText,
      fontSize: isVerySmallScreen ? 11.3 : 12.1,
      fontWeight: "800",
      textAlign: "right",
      lineHeight: isVerySmallScreen ? 16 : 18,
      includeFontPadding: false,
    },

    passwordRuleTextValid: {
      color: COLORS.success,
    },

    messagePlaceholder: {
      minHeight: isVerySmallScreen ? 40 : 44,
      marginTop: 0,
    },

    messageBoxError: {
      width: "100%",
      minHeight: isVerySmallScreen ? 40 : 44,
      flexDirection: "row-reverse",
      alignItems: "center",
      marginTop: 0,
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 16,
      backgroundColor: "#F5F5F5",
      borderWidth: 1.1,
      borderColor: "rgba(170,170,170,0.45)",
      gap: 7,
    },

    messageTextError: {
      color: COLORS.primaryText,
      fontSize: isVerySmallScreen ? 12.8 : 13.5,
      fontWeight: "900",
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
      backgroundColor: COLORS.primary,
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
      color: COLORS.white,
      textAlign: "center",
      fontSize: isVerySmallScreen ? 18.5 : 20,
      fontWeight: "900",
      zIndex: 5,
      includeFontPadding: false,
    },

    passwordSuccessOverlay: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 90,
      backgroundColor: "rgba(255,255,255,0.72)",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 28,
    },

    passwordSuccessBox: {
      width: "100%",
      maxWidth: 330,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 22,
      paddingVertical: 24,
      borderRadius: 24,
      backgroundColor: "#F5F5F5",
      borderWidth: 1.1,
      borderColor: "rgba(170,170,170,0.45)",
      shadowColor: COLORS.shadowGray,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: Platform.OS === "android" ? 0.12 : 0.18,
      shadowRadius: 16,
      elevation: 8,
    },

    passwordSuccessTitle: {
      marginTop: 12,
      color: COLORS.primaryText,
      fontSize: isVerySmallScreen ? 16 : 17,
      fontWeight: "900",
      textAlign: "center",
      lineHeight: isVerySmallScreen ? 22 : 24,
      includeFontPadding: false,
    },

    transitionOverlay: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 100,
      backgroundColor: COLORS.screenBackground,
    },
  });
}