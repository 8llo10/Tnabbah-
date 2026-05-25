import React, { useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";
import { setPasswordRecoveryMode } from "../../utils/passwordRecoveryFlag";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  useWindowDimensions,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";
import { Feather, Ionicons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

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
  primarySoft: "rgba(154,33,28,0.065)",
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export default function NewPasswordScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [loading, setLoading] = useState(false);

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

  const hasMinLength = password.length >= 8;
  const hasLetter = /[A-Za-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const passwordsMatch =
    password.length > 0 &&
    confirmPassword.length > 0 &&
    password === confirmPassword;

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

  const clearMessages = () => {
    setErrorMessage("");
    setSuccessMessage("");
  };

  const handleUpdatePassword = async () => {
    const cleanPassword = password.trim();
    const cleanConfirmPassword = confirmPassword.trim();

    if (!cleanPassword) {
      setErrorMessage("اكتب كلمة المرور الجديدة");
      return;
    }

    if (!hasMinLength || !hasLetter || !hasNumber) {
      setErrorMessage("كلمة المرور لا تحقق الشروط المطلوبة");
      return;
    }

    if (!cleanConfirmPassword) {
      setErrorMessage("أكد كلمة المرور الجديدة");
      return;
    }

    if (cleanPassword !== cleanConfirmPassword) {
      setErrorMessage("كلمة المرور وتأكيدها غير متطابقين");
      return;
    }

    try {
      setLoading(true);
      clearMessages();

      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError) {
        console.log("getSession error:", sessionError.message);
        setErrorMessage("صار خطأ في جلسة تغيير كلمة المرور، اطلب رمز جديد");
        return;
      }

      if (!sessionData.session) {
        console.log("No recovery session found");
        setErrorMessage("انتهت جلسة تغيير كلمة المرور، اطلب رمز جديد");
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: cleanPassword,
      });

      if (updateError) {
        console.log("update password error:", updateError.message);
        setErrorMessage("ما قدرنا نحفظ كلمة المرور الجديدة، حاول مرة ثانية");
        return;
      }

      setPassword("");
      setConfirmPassword("");
      setSuccessMessage("تم حفظ كلمة المرور بنجاح");

      await AsyncStorage.removeItem("password_recovery_flow");
      await setPasswordRecoveryMode(false);

      setTimeout(() => {
        router.replace("/login" as any);
      }, 900);
    } catch (error) {
      console.log("new password error:", error);
      setErrorMessage("حدث خطأ غير متوقع، حاول مرة ثانية");
    } finally {
      setLoading(false);
    }
  };

  const renderRule = (isValid: boolean, text: string) => {
    return (
      <View style={styles.ruleRow}>
        <View
          style={[
            styles.ruleIconCircle,
            isValid ? styles.ruleIconCircleValid : styles.ruleIconCircleDefault,
          ]}
        >
          <Ionicons
            name={isValid ? "checkmark" : "ellipse-outline"}
            size={isValid ? 14 : 12}
            color={isValid ? COLORS.success : COLORS.label}
          />
        </View>

        <Text style={[styles.ruleText, isValid && styles.ruleTextValid]}>
          {text}
        </Text>
      </View>
    );
  };

  const renderMessage = () => {
    if (errorMessage) {
      return (
        <View style={styles.messageBoxError}>
          <Ionicons name="alert-circle" size={18} color={COLORS.error} />
          <Text style={styles.messageTextError}>{errorMessage}</Text>
        </View>
      );
    }

    if (successMessage) {
      return (
        <View style={styles.messageBoxInfo}>
          <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
          <Text style={styles.messageTextInfo}>{successMessage}</Text>
        </View>
      );
    }

    return <View style={styles.messagePlaceholder} />;
  };

  return (
    <View style={styles.container}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />

      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.screenContent}>
            <View style={styles.topContent}>
              <View style={styles.backArea}>
                <TouchableOpacity
                  style={styles.backButtonWrapper}
                  activeOpacity={0.85}
                  onPress={() => router.back()}
                  disabled={loading}
                >
                  <Ionicons
                    name="arrow-back-outline"
                    size={isVerySmallScreen ? 23 : 25}
                    color={COLORS.textDark}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.titleArea}>
                <Text style={styles.title}>تعيين كلمة المرور</Text>

                <Text style={styles.subtitle}>
                  أدخل كلمة مرور جديدة آمنة ثم أعد كتابتها للتأكيد
                </Text>
              </View>

              <View style={styles.formArea}>
                <View
                  style={[
                    styles.inputBox,
                    errorMessage.includes("كلمة المرور") &&
                      !passwordsMatch &&
                      styles.inputBoxError,
                  ]}
                >
                  <Feather
                    name="lock"
                    size={isVerySmallScreen ? 20 : 21}
                    color={COLORS.primary}
                    style={styles.inputIcon}
                  />

                  <TextInput
                    style={styles.input}
                    placeholder="كلمة المرور الجديدة"
                    placeholderTextColor={COLORS.placeholder}
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      clearMessages();
                    }}
                    textAlign="right"
                    autoCapitalize="none"
                    autoCorrect={false}
                    selectionColor={COLORS.primary}
                    returnKeyType="next"
                    editable={!loading}
                  />

                  <TouchableOpacity
                    style={styles.eyeButton}
                    activeOpacity={0.7}
                    onPress={() => setShowPassword(!showPassword)}
                    disabled={loading}
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
                    errorMessage.includes("غير متطابقين") &&
                      styles.inputBoxError,
                  ]}
                >
                  <Feather
                    name="lock"
                    size={isVerySmallScreen ? 20 : 21}
                    color={COLORS.primary}
                    style={styles.inputIcon}
                  />

                  <TextInput
                    style={styles.input}
                    placeholder="تأكيد كلمة المرور الجديدة"
                    placeholderTextColor={COLORS.placeholder}
                    secureTextEntry={!showConfirmPassword}
                    value={confirmPassword}
                    onChangeText={(text) => {
                      setConfirmPassword(text);
                      clearMessages();
                    }}
                    textAlign="right"
                    autoCapitalize="none"
                    autoCorrect={false}
                    selectionColor={COLORS.primary}
                    returnKeyType="done"
                    editable={!loading}
                  />

                  <TouchableOpacity
                    style={styles.eyeButton}
                    activeOpacity={0.7}
                    onPress={() =>
                      setShowConfirmPassword(!showConfirmPassword)
                    }
                    disabled={loading}
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

                <View style={styles.rulesBox}>
                  <Text style={styles.rulesTitle}>شروط كلمة المرور</Text>

                  {renderRule(hasMinLength, "تكون 8 أحرف أو أكثر")}
                  {renderRule(hasLetter, "تحتوي على حرف واحد على الأقل")}
                  {renderRule(hasNumber, "تحتوي على رقم واحد على الأقل")}
                  {renderRule(passwordsMatch, "تطابق تأكيد كلمة المرور")}
                </View>

                {renderMessage()}
              </View>
            </View>

            <View style={styles.bottomArea}>
              <TouchableOpacity
                style={[
                  styles.mainButtonWrapper,
                  loading && styles.mainButtonDisabled,
                ]}
                onPress={handleUpdatePassword}
                disabled={loading}
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
                      {loading ? "جاري الحفظ..." : "حفظ كلمة المرور"}
                    </Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
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

    keyboardAvoidingView: {
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
      flexDirection: "row-reverse",
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
      marginRight: 8,
    },

    rulesBox: {
      width: "100%",
      borderRadius: 20,
      backgroundColor: "rgba(154,33,28,0.035)",
      borderWidth: 1,
      borderColor: "rgba(154,33,28,0.12)",
      paddingHorizontal: isVerySmallScreen ? 14 : 16,
      paddingVertical: isVerySmallScreen ? 12 : 14,
      marginTop: isVerySmallScreen ? 2 : 4,
      marginBottom: isVerySmallScreen ? 10 : 12,
    },

    rulesTitle: {
      color: COLORS.primaryText,
      fontSize: isVerySmallScreen ? 13.5 : 14.5,
      fontWeight: "900",
      textAlign: "right",
      marginBottom: 9,
      includeFontPadding: false,
    },

    ruleRow: {
      flexDirection: "row-reverse",
      alignItems: "center",
      marginBottom: 7,
      gap: 8,
    },

    ruleIconCircle: {
      width: 22,
      height: 22,
      borderRadius: 11,
      alignItems: "center",
      justifyContent: "center",
    },

    ruleIconCircleDefault: {
      backgroundColor: "rgba(140,122,118,0.09)",
      borderWidth: 1,
      borderColor: "rgba(140,122,118,0.18)",
    },

    ruleIconCircleValid: {
      backgroundColor: COLORS.successSoft,
      borderWidth: 1,
      borderColor: "rgba(46,125,50,0.18)",
    },

    ruleText: {
      flex: 1,
      color: COLORS.label,
      fontSize: isVerySmallScreen ? 12.8 : 13.5,
      fontWeight: "800",
      textAlign: "right",
      includeFontPadding: false,
    },

    ruleTextValid: {
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
      backgroundColor: "rgba(211,47,47,0.08)",
      borderWidth: 1,
      borderColor: "rgba(211,47,47,0.14)",
      gap: 7,
    },

    messageBoxInfo: {
      width: "100%",
      minHeight: isVerySmallScreen ? 40 : 44,
      flexDirection: "row-reverse",
      alignItems: "center",
      marginTop: 0,
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 16,
      backgroundColor: COLORS.successSoft,
      borderWidth: 1,
      borderColor: "rgba(46,125,50,0.14)",
      gap: 7,
    },

    messageTextError: {
      color: COLORS.error,
      fontSize: isVerySmallScreen ? 12.8 : 13.5,
      fontWeight: "800",
      textAlign: "right",
      flex: 1,
      lineHeight: isVerySmallScreen ? 18 : 20,
      includeFontPadding: false,
    },

    messageTextInfo: {
      color: COLORS.success,
      fontSize: isVerySmallScreen ? 12.8 : 13.5,
      fontWeight: "800",
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
  });
}