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
  View,
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  StatusBar,
  useWindowDimensions,
  Animated,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

const OTP_DIGITS = 8;
const RESEND_COOLDOWN = 60;

const COLORS = {
  screenBackground: "#FFFFFF",

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

  error: "#D32F2F",
  success: "#2E7D32",
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

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

  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(RESEND_COOLDOWN);

  const isSmallScreen = height < 720;
  const isVerySmallScreen = height < 650;

  const horizontalPadding = clamp(width * 0.055, 18, 24);

  const backButtonSize = isVerySmallScreen ? 44 : 48;
  const backButtonRadius = backButtonSize / 2;

  const topSpacing = clamp(height * 0.012, 6, 12);
  const bottomSpacing = clamp(height * 0.025, 16, 24);

  const buttonHeight = isVerySmallScreen ? 58 : 64;
  const buttonRadius = 30;

  const otpBoxSize = clamp((width - horizontalPadding * 2 - 28) / 8, 36, 43);
  const otpBoxHeight = isVerySmallScreen ? 66 : 74;

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
      setErrorMessage(
        "لم يتم العثور على البريد الإلكتروني، ارجعي وأرسلي الكود من جديد"
      );
      return;
    }

    if (cleanOtp.length !== OTP_DIGITS) {
      setErrorMessage(`أدخلي رمز التحقق المكوّن من ${OTP_DIGITS} أرقام`);
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
        setErrorMessage("رمز التحقق غير صحيح أو انتهت صلاحيته");
        return;
      }

      console.log(
        "verifyOtp success:",
        data?.session ? "session exists" : "no session"
      );

      await setPasswordRecoveryMode(true);
      await AsyncStorage.setItem("password_recovery_flow", "true");

      router.replace("/auth/new-password" as any);
    } catch (error) {
      console.log("verify otp error:", error);
      setErrorMessage("حدث خطأ غير متوقع، حاولي مرة ثانية");
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setErrorMessage("البريد الإلكتروني غير موجود");
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
        setErrorMessage("ما قدرنا نعيد إرسال الرمز الآن، حاولي بعد قليل");
        return;
      }

      setOtpValues(Array(OTP_DIGITS).fill(""));
      setResendTimer(RESEND_COOLDOWN);
      setInfoMessage("تم إعادة إرسال رمز التحقق إلى بريدك الإلكتروني");

      setTimeout(() => {
        otpRefs.current[0]?.focus();
        setFocusedIndex(0);
      }, 100);
    } catch (error) {
      console.log("resend error:", error);
      setErrorMessage("حدث خطأ أثناء إعادة إرسال الرمز");
    } finally {
      setResendLoading(false);
    }
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

    if (infoMessage) {
      return (
        <View style={styles.messageBoxInfo}>
          <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
          <Text style={styles.messageTextInfo}>{infoMessage}</Text>
        </View>
      );
    }

    return null;
  };

  const renderResendArea = () => {
    if (resendTimer > 0) {
      return (
        <View style={styles.timerBox}>
          <Ionicons name="time-outline" size={16} color="#9A9A9A" />
          <Text style={styles.timerText}>
            يمكنك إعادة الإرسال بعد {resendTimer} ثانية
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.resendRow}>
        <Text style={styles.resendQuestion}>هل تريد إعادة الإرسال؟</Text>

        <TouchableOpacity
          activeOpacity={0.75}
          onPress={handleResendCode}
          disabled={resendLoading}
        >
          <Text style={styles.resendText}>
            {resendLoading ? "جاري الإرسال..." : "إعادة إرسال رمز التحقق"}
          </Text>
        </TouchableOpacity>
      </View>
    );
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
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            keyboardDismissMode="interactive"
          >
            <View style={styles.screenContent}>
              <View style={styles.backArea}>
                <TouchableOpacity
                  style={styles.backButtonWrapper}
                  activeOpacity={0.85}
                  onPress={() => router.replace("/forgot-password" as any)}
                  disabled={loading || resendLoading}
                >
                  <Ionicons
                    name="chevron-back"
                    size={isVerySmallScreen ? 21 : 23}
                    color={COLORS.shadowGray}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.titleArea}>
                <Text style={styles.title}>أدخل رمز التحقق</Text>

                <Text style={styles.subtitle}>
                  يرجى إدخال الرمز المكوّن من {OTP_DIGITS} أرقام المرسل إلى
                  بريدك الإلكتروني
                </Text>

                <Text style={styles.emailText}>
                  {email || "البريد الإلكتروني"}
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
                          ref={(ref) => {
                            otpRefs.current[index] = ref;
                          }}
                          style={[
                            styles.otpInput,
                            isFilled && styles.otpInputFilled,
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
                          selectionColor={COLORS.primaryDark}
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
                    colors={[
                      "rgba(154,33,28,0.98)",
                      "rgba(118,23,19,0.98)",
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
                      ) : null}

                      <Text style={styles.buttonText}>
                        {loading ? "جاري التحقق..." : "متابعة"}
                      </Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>

                {renderResendArea()}
              </View>
            </View>
          </ScrollView>
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

    scrollContent: {
      flexGrow: 1,
      backgroundColor: COLORS.screenBackground,
    },

    screenContent: {
      flex: 1,
      paddingHorizontal: horizontalPadding,
      paddingTop: topSpacing,
      paddingBottom: bottomSpacing,
      minHeight: height,
      backgroundColor: COLORS.screenBackground,
    },

    backArea: {
      width: "100%",
      paddingTop: safeTop + 2,
      alignItems: "flex-start",
      justifyContent: "center",
      marginBottom: isVerySmallScreen ? 26 : 32,
    },

    backButtonWrapper: {
      width: backButtonSize,
      height: backButtonSize,
      borderRadius: backButtonRadius,
      alignItems: "center",
      justifyContent: "center",

      backgroundColor: COLORS.white,

      borderWidth: 1.7,
      borderColor: COLORS.border,

      shadowColor: COLORS.shadowGray,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: Platform.OS === "android" ? 0.16 : 0.22,
      shadowRadius: 4,
      elevation: 3,
    },

    titleArea: {
      width: "100%",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: isVerySmallScreen ? 30 : isSmallScreen ? 36 : 42,
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
    },

    subtitle: {
      marginTop: isVerySmallScreen ? 12 : 15,
      fontSize: isVerySmallScreen ? 15 : 16,
      lineHeight: isVerySmallScreen ? 23 : 26,
      color: COLORS.textDark,
      fontWeight: "800",
      textAlign: "center",
      maxWidth: clamp(width * 0.9, 300, 360),

      textShadowColor: "rgba(255,255,255,0.90)",
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 10,
    },

    emailText: {
      marginTop: 9,
      fontSize: isVerySmallScreen ? 14.5 : 15.5,
      color: COLORS.primaryText,
      fontWeight: "900",
      textAlign: "center",
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
      marginBottom: 18,
    },

    otpBoxWrapper: {
      width: otpBoxSize,
      height: otpBoxHeight,
      borderRadius: 16,

      backgroundColor: COLORS.white,

      borderWidth: 1.7,
      borderColor: COLORS.border,

      justifyContent: "center",
      alignItems: "center",

      shadowColor: COLORS.shadowGray,
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
      borderColor: COLORS.primary,
      backgroundColor: "rgba(154,33,28,0.08)",
      shadowColor: COLORS.primaryDark,
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: Platform.OS === "android" ? 0.2 : 0.25,
      shadowRadius: 10,
      elevation: 6,
    },

    otpBoxError: {
      borderColor: "rgba(211,47,47,0.65)",
      backgroundColor: "rgba(211,47,47,0.055)",
    },

    otpInput: {
      width: "100%",
      height: "100%",
      fontSize: isVerySmallScreen ? 23 : 26,
      fontWeight: "900",
      color: COLORS.inputText,
      textAlign: "center",
      paddingVertical: 0,
      backgroundColor: "transparent",
    },

    otpInputFilled: {
      color: COLORS.primaryText,
    },

    messageBoxError: {
      width: "100%",
      flexDirection: "row-reverse",
      alignItems: "center",
      marginTop: 2,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 16,
      backgroundColor: "rgba(211,47,47,0.08)",
      borderWidth: 1,
      borderColor: "rgba(211,47,47,0.14)",
      gap: 7,
    },

    messageBoxInfo: {
      width: "100%",
      flexDirection: "row-reverse",
      alignItems: "center",
      marginTop: 2,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 16,
      backgroundColor: "rgba(46,125,50,0.08)",
      borderWidth: 1,
      borderColor: "rgba(46,125,50,0.14)",
      gap: 7,
    },

    messageTextError: {
      color: COLORS.error,
      fontSize: 13.5,
      fontWeight: "700",
      textAlign: "right",
      flex: 1,
    },

    messageTextInfo: {
      color: COLORS.success,
      fontSize: 13.5,
      fontWeight: "700",
      textAlign: "right",
      flex: 1,
    },

    bottomArea: {
      marginTop: isVerySmallScreen ? 24 : 30,
      alignItems: "center",
      paddingTop: 0,
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
      color: COLORS.white,
      textAlign: "center",
      fontSize: isVerySmallScreen ? 19 : 21,
      fontWeight: "900",
      zIndex: 5,
    },

    timerBox: {
      marginTop: 18,
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 18,
      backgroundColor: "rgba(255,255,255,0.78)",
      borderWidth: 1,
      borderColor: "rgba(135,27,23,0.10)",
      flexDirection: "row-reverse",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,

      shadowColor: COLORS.shadowGray,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: Platform.OS === "android" ? 0.08 : 0.11,
      shadowRadius: 4,
      elevation: 2,
    },

    timerText: {
      color: COLORS.label,
      fontSize: 14,
      fontWeight: "700",
    },

    resendRow: {
      marginTop: 18,
      flexDirection: "row-reverse",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      flexWrap: "wrap",
    },

    resendQuestion: {
      color: COLORS.label,
      fontSize: 14,
      fontWeight: "700",
    },

    resendText: {
      color: COLORS.primaryText,
      fontSize: 14,
      fontWeight: "900",
      textDecorationLine: "underline",
    },
  });
}