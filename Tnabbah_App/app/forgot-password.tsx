import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { supabase } from "../lib/supabase";

import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
  useWindowDimensions,
  Animated,
  Easing,
  StatusBar,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";
import { Feather, Ionicons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

const COLORS = {
  screenBackground: "#FFFFFF",
  nextScreenBackground: "#FFFFFF",

  primary: "#9A211C",
  primaryDark: "#761713",
  primaryText: "#871B17",

  title: "#7B1714",
  textDark: "#2C2C2C",
  inputText: "#2E1D1D",

  label: "#8C7A76",
  muted: "#6C5B58",
  placeholder: "#B0A6A4",
  border: "rgba(205,205,205,0.95)",

  shadowGray: "#8E8E8E",
  white: "#FFFFFF",

  successGreen: "#3F7F52",
  successGreenSoft: "rgba(63,127,82,0.10)",
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export default function ForgotPasswordScreen() {
  const router = useRouter();

  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  const screenOpacity = useRef(new Animated.Value(0)).current;
  const screenTranslateY = useRef(new Animated.Value(10)).current;
  const transitionAnim = useRef(new Animated.Value(0)).current;

  const checkShortWidthAnim = useRef(new Animated.Value(0)).current;
  const checkLongWidthAnim = useRef(new Animated.Value(0)).current;
  const checkScaleAnim = useRef(new Animated.Value(0.92)).current;

  const isSmallScreen = height < 720;
  const isVerySmallScreen = height < 650;

  const horizontalPadding = clamp(width * 0.055, 18, 24);

  const backButtonSize = isVerySmallScreen ? 42 : 46;
  const backButtonRadius = backButtonSize / 2;

  const topSpacing = clamp(height * 0.008, 4, 8);
  const bottomSpacing = clamp(height * 0.014, 8, 14);

  const inputHeight = isVerySmallScreen ? 58 : 62;
  const inputRadius = inputHeight / 2;

  const buttonHeight = isVerySmallScreen ? 54 : 58;
  const buttonRadius = 30;

  const styles = useMemo(
    () =>
      createStyles({
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
      }),
    [
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
    ]
  );

  const checkShortWidth = checkShortWidthAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 18],
  });

  const checkLongWidth = checkLongWidthAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 34],
  });

  useEffect(() => {
    if (!showSuccessModal) return;

    checkShortWidthAnim.setValue(0);
    checkLongWidthAnim.setValue(0);
    checkScaleAnim.setValue(0.92);

    Animated.sequence([
      Animated.timing(checkShortWidthAnim, {
        toValue: 1,
        duration: 230,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(checkLongWidthAnim, {
        toValue: 1,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.spring(checkScaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 90,
        useNativeDriver: true,
      }),
    ]).start();
  }, [showSuccessModal, checkShortWidthAnim, checkLongWidthAnim, checkScaleAnim]);

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

      return () => {};
    }, [screenOpacity, screenTranslateY, transitionAnim])
  );

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
        router.replace("/login" as any);
      });
    });
  };

  const handleSubmit = async () => {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setErrorMessage("الرجاء إدخال البريد الإلكتروني");
      setInfoMessage("");
      return;
    }

    if (!cleanEmail.includes("@") || !cleanEmail.includes(".")) {
      setErrorMessage("الرجاء إدخال بريد إلكتروني صحيح");
      setInfoMessage("");
      return;
    }

    setErrorMessage("");
    setInfoMessage("");

    try {
      setLoading(true);

      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail);

      if (error) {
        console.log("Forgot password error:", error.message);
        setErrorMessage("لم نتمكن من إرسال كود إعادة التعيين، حاول مرة أخرى");
        return;
      }

      setShowSuccessModal(true);
    } catch (err) {
      console.log("Forgot password unexpected error:", err);
      setErrorMessage("حدث خطأ غير متوقع، حاول مرة أخرى");
    } finally {
      setLoading(false);
    }
  };

  const goToResetPassword = () => {
    const cleanEmail = email.trim().toLowerCase();

    setShowSuccessModal(false);

    setTimeout(() => {
      smoothReplace("/auth/reset-password", { email: cleanEmail });
    }, 120);
  };

  const renderMessage = () => {
    if (errorMessage) {
      return (
        <View style={styles.messageBox}>
          <Ionicons name="alert-circle" size={17} color={COLORS.primary} />
          <Text style={styles.messageText}>{errorMessage}</Text>
        </View>
      );
    }

    if (infoMessage) {
      return (
        <View style={styles.messageBox}>
          <Ionicons name="information-circle" size={17} color={COLORS.primary} />
          <Text style={styles.messageText}>{infoMessage}</Text>
        </View>
      );
    }

    return <View style={styles.messagePlaceholder} />;
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ gestureEnabled: false }} />

      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
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
                    name="arrow-back-outline"
                    size={isVerySmallScreen ? 23 : 25}
                    color={COLORS.textDark}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.titleArea}>
                <Text style={styles.title}>نسيت كلمة المرور؟</Text>

                <Text style={styles.subtitle}>
                  أدخل البريد الإلكتروني المرتبط بحسابك لإرسال كود إعادة تعيين كلمة المرور
                </Text>
              </View>

              <View style={styles.formArea}>
                <View style={styles.fieldGroup}>
                  <Text style={styles.inputLabel}>البريد الإلكتروني</Text>

                  <View
                    style={[
                      styles.inputWrapper,
                      errorMessage.includes("البريد") && styles.inputWrapperError,
                    ]}
                  >
                    <Feather
                      name="mail"
                      size={isVerySmallScreen ? 20 : 21}
                      color={COLORS.primary}
                      style={styles.inputIcon}
                    />

                    <TextInput
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
                        setInfoMessage("");
                      }}
                      textAlign="right"
                      returnKeyType="done"
                      editable={!loading && !isNavigating}
                      selectionColor={COLORS.primary}
                    />
                  </View>

                  {renderMessage()}
                </View>
              </View>

              <View style={styles.buttonsArea}>
                <TouchableOpacity
                  style={[
                    styles.resetButtonWrapper,
                    loading && styles.resetButtonDisabled,
                  ]}
                  onPress={handleSubmit}
                  disabled={loading || isNavigating}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={[
                      "rgba(154,33,28,0.98)",
                      "rgba(118,23,19,0.98)",
                    ]}
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
                          style={styles.loadingSpinner}
                        />
                      ) : null}

                      <Text style={styles.resetText}>
                        {loading ? "جاري الإرسال..." : "إرسال الكود"}
                      </Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Animated.View>

      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.successModal}>
            <Animated.View
              style={[
                styles.animatedCheckCircle,
                {
                  transform: [{ scale: checkScaleAnim }],
                },
              ]}
            >
              <View style={styles.checkCanvas}>
                <Animated.View
                  style={[
                    styles.checkLineShort,
                    {
                      width: checkShortWidth,
                    },
                  ]}
                />

                <Animated.View
                  style={[
                    styles.checkLineLong,
                    {
                      width: checkLongWidth,
                    },
                  ]}
                />
              </View>
            </Animated.View>

            <Text style={styles.successTitle}>تم إرسال الكود</Text>

            <Text style={styles.successMessage}>
              أرسلنا كود إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.
            </Text>

            <TouchableOpacity
              style={styles.modalButtonWrapper}
              activeOpacity={0.9}
              onPress={goToResetPassword}
            >
              <LinearGradient
                colors={[
                  "rgba(154,33,28,0.98)",
                  "rgba(118,23,19,0.98)",
                ]}
                start={{ x: 0.15, y: 0 }}
                end={{ x: 0.9, y: 1 }}
                style={styles.modalButtonGradient}
              >
                <View style={styles.modalButtonGlassTop} />

                <Text style={styles.modalButtonText}>إدخال الكود</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
}: {
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
    },

    backArea: {
      width: "100%",
      paddingTop: safeTop + 2,
      alignItems: "flex-start",
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
      textShadowColor: "rgba(255,255,255,0.90)",
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
      color: COLORS.label,
      fontSize: isVerySmallScreen ? 14.5 : 15.5,
      fontWeight: "800",
      textAlign: "right",
      marginBottom: 10,
      includeFontPadding: false,
    },

    inputWrapper: {
      width: "100%",
      height: inputHeight,
      borderRadius: inputRadius,
      backgroundColor: COLORS.white,
      borderWidth: 1.7,
      borderColor: COLORS.border,
      paddingHorizontal: isVerySmallScreen ? 16 : 18,
      flexDirection: "row-reverse",
      alignItems: "center",
      shadowColor: COLORS.shadowGray,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: Platform.OS === "android" ? 0.14 : 0.2,
      shadowRadius: 4,
      elevation: 3,
    },

    inputWrapperError: {
      borderColor: "rgba(154,33,28,0.45)",
      backgroundColor: "rgba(154,33,28,0.015)",
    },

    inputIcon: {
      marginLeft: isVerySmallScreen ? 11 : 13,
    },

    input: {
      flex: 1,
      fontSize: isVerySmallScreen ? 16 : 17,
      color: COLORS.inputText,
      fontWeight: "700",
      paddingVertical: 0,
      minHeight: inputHeight - 8,
      textAlignVertical: "center",
      includeFontPadding: false,
    },

    messagePlaceholder: {
      height: isVerySmallScreen ? 42 : 46,
      marginTop: 8,
    },

    messageBox: {
      width: "100%",
      minHeight: isVerySmallScreen ? 42 : 46,
      marginTop: 8,
      flexDirection: "row-reverse",
      alignItems: "center",
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 18,
      backgroundColor: "rgba(154,33,28,0.065)",
      borderWidth: 1.1,
      borderColor: "rgba(154,33,28,0.16)",
      gap: 7,
    },

    messageText: {
      flex: 1,
      color: COLORS.primary,
      fontSize: isVerySmallScreen ? 12.8 : 13.5,
      fontWeight: "800",
      textAlign: "right",
      lineHeight: isVerySmallScreen ? 18 : 20,
      includeFontPadding: false,
    },

    buttonsArea: {
      marginTop: "auto",
      width: "100%",
      paddingTop: isVerySmallScreen ? 14 : 20,
      paddingBottom: isVerySmallScreen ? 4 : 8,
    },

    resetButtonWrapper: {
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
      color: COLORS.white,
      textAlign: "center",
      fontSize: isVerySmallScreen ? 18.5 : 20,
      fontWeight: "900",
      zIndex: 5,
      includeFontPadding: false,
    },

    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(46, 29, 29, 0.28)",
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 28,
    },

    successModal: {
      width: "100%",
      borderRadius: 28,
      paddingHorizontal: 24,
      paddingTop: 28,
      paddingBottom: 24,
      alignItems: "center",
      backgroundColor: COLORS.white,
      borderWidth: 1,
      borderColor: "rgba(135, 27, 23, 0.14)",
      shadowColor: "#6E1411",
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.16,
      shadowRadius: 24,
      elevation: 8,
    },

    animatedCheckCircle: {
      width: 70,
      height: 70,
      borderRadius: 35,
      backgroundColor: COLORS.successGreenSoft,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 18,
      borderWidth: 1.2,
      borderColor: "rgba(63,127,82,0.18)",
    },

    checkCanvas: {
      width: 48,
      height: 38,
      position: "relative",
    },

    checkLineShort: {
      position: "absolute",
      left: 8,
      top: 20,
      height: 5,
      borderRadius: 5,
      backgroundColor: COLORS.successGreen,
      transform: [{ rotate: "45deg" }],
    },

    checkLineLong: {
      position: "absolute",
      left: 20,
      top: 15,
      height: 5,
      borderRadius: 5,
      backgroundColor: COLORS.successGreen,
      transform: [{ rotate: "-45deg" }],
    },

    successTitle: {
      fontSize: 22,
      fontWeight: "900",
      color: COLORS.primaryText,
      textAlign: "center",
      includeFontPadding: false,
    },

    successMessage: {
      marginTop: 12,
      marginBottom: 24,
      fontSize: 15.5,
      lineHeight: 24,
      fontWeight: "700",
      color: COLORS.label,
      textAlign: "center",
      includeFontPadding: false,
    },

    modalButtonWrapper: {
      width: "100%",
      height: 56,
      borderRadius: 28,
      overflow: "hidden",
      shadowColor: "#6E1411",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.16,
      shadowRadius: 16,
      elevation: 5,
      backgroundColor: COLORS.primary,
    },

    modalButtonGradient: {
      flex: 1,
      borderRadius: 28,
      justifyContent: "center",
      alignItems: "center",
      overflow: "hidden",
    },

    modalButtonGlassTop: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: "46%",
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      backgroundColor: "rgba(255,255,255,0.10)",
      zIndex: 1,
    },

    modalButtonText: {
      color: COLORS.white,
      fontSize: 18,
      fontWeight: "900",
      textAlign: "center",
      zIndex: 5,
      includeFontPadding: false,
    },

    transitionOverlay: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 100,
      backgroundColor: COLORS.nextScreenBackground,
    },
  });
}