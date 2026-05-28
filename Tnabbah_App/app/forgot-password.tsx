import React, { useCallback, useMemo, useRef, useState } from "react";
import { Stack, useFocusEffect, useRouter } from "expo-router";
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
import { useLanguage } from "../providers/LanguageProvider";

const COLORS = {
  screenBackground: "#FFFFFF",
  nextScreenBackground: "#FFFFFF",

  primary: "#9A211C",
  primaryDark: "#761713",
  primaryText: "#871B17",

  title: "#7B1714",
  textDark: "#2C2C2C",
  inputText: "#2E1D1D",

  label: "#6C5B58",
  muted: "#6C5B58",
  placeholder: "#A8A8A8",
  border: "#DCDCDC",

  shadowGray: "#000000",
  white: "#FFFFFF",
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { t, isArabic } = useLanguage();

  const textAlign = isArabic ? "right" : "left";
  const rowDirection = isArabic ? "row-reverse" : "row";

  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [loading, setLoading] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  const screenOpacity = useRef(new Animated.Value(0)).current;
  const screenTranslateY = useRef(new Animated.Value(10)).current;
  const transitionAnim = useRef(new Animated.Value(0)).current;

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
        console.log("Forgot password error:", error.message);

        const message = error.message?.toLowerCase() || "";

        if (message.includes("rate limit") || message.includes("too many")) {
          setErrorMessage(t.forgotRateLimit);
          return;
        }

        setErrorMessage(t.forgotSendError);
        return;
      }

      smoothReplace("/auth/reset-password", { email: cleanEmail });
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
          <Ionicons name="alert-circle" size={18} color={COLORS.primaryText} />

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
                  <Text style={styles.title}>{t.forgotPasswordTitle}</Text>

                  <Text style={styles.subtitle}>
                    {t.forgotPasswordSubtitle}
                  </Text>
                </View>

                <View style={styles.formArea}>
                  <View style={styles.fieldGroup}>
                    <Text style={[styles.inputLabel, { textAlign }]}>
                      {t.email}
                    </Text>

                    <View
                      style={[
                        styles.inputWrapper,
                        errorMessage && styles.inputWrapperError,
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
                          {loading ? t.sending : t.sendCode}
                        </Text>
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
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
      color: "#6C5B58",
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
      borderRadius: 24,
      backgroundColor: COLORS.white,
      borderWidth: 1,
      borderColor: COLORS.border,
      paddingHorizontal: isVerySmallScreen ? 14 : 16,
      flexDirection: "row-reverse",
      alignItems: "center",
      shadowColor: COLORS.shadowGray,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: Platform.OS === "android" ? 0.05 : 0.035,
      shadowRadius: 6,
      elevation: 1,
    },

    inputWrapperError: {
      borderColor: "rgba(135,27,23,0.42)",
      backgroundColor: "rgba(135,27,23,0.025)",
    },

    inputIcon: {
      marginLeft: isVerySmallScreen ? 10 : 12,
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
      minHeight: isVerySmallScreen ? 48 : 52,
      marginTop: 8,
      alignItems: "center",
      paddingHorizontal: isVerySmallScreen ? 14 : 16,
      paddingVertical: isVerySmallScreen ? 9 : 10,
      borderRadius: 22,
      backgroundColor: "#F5F5F5",
      borderWidth: 1.1,
      borderColor: "rgba(170,170,170,0.45)",
      gap: 7,
    },

    messageTextError: {
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

    transitionOverlay: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 100,
      backgroundColor: COLORS.nextScreenBackground,
    },
  });
}