import React, { useEffect, useRef, useState } from "react";
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
  Dimensions,
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  StatusBar,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

const { height, width } = Dimensions.get("window");

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
  border: "rgba(205,205,205,0.95)",
  shadowGray: "#8E8E8E",
  white: "#FFFFFF",
  error: "#D32F2F",
  success: "#2E7D32",
};

const boxSize = Math.min((width - 54) / 8, 44);

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

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

  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(RESEND_COOLDOWN);

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
    <LinearGradient
      colors={["#FFFFFF", "#FFF8F7", "#FFF1EE"]}
      locations={[0, 0.6, 1]}
      start={{ x: 0.15, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={styles.container}
    >
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />

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
            <TouchableOpacity
              style={styles.backButtonWrapper}
              activeOpacity={0.85}
              onPress={() => router.replace("/forgot-password" as any)}
            >
              <Ionicons
                name="chevron-back"
                size={height < 650 ? 21 : 23}
                color={COLORS.shadowGray}
              />
            </TouchableOpacity>

            <View style={styles.content}>
              <Text style={styles.title}>أدخل رمز التحقق</Text>

              <Text style={styles.subtitle}>
                يرجى إدخال الرمز المكوّن من {OTP_DIGITS} أرقام المرسل إلى
              </Text>

              <Text style={styles.emailText}>{email || "البريد الإلكتروني"}</Text>

              <View style={styles.otpRow}>
                {otpValues.map((digit, index) => {
                  const isFocused = focusedIndex === index;
                  const isFilled = !!digit;
                  const hasError = !!errorMessage;

                  return (
                    <View
                      key={index}
                      style={[
                        styles.otpBoxWrapper,
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
                        onFocus={() => setFocusedIndex(index)}
                        onBlur={() =>
                          setFocusedIndex((prev) =>
                            prev === index ? null : prev
                          )
                        }
                        keyboardType="number-pad"
                        maxLength={index === 0 ? OTP_DIGITS : 1}
                        textAlign="center"
                        autoCorrect={false}
                        autoCapitalize="none"
                        selectionColor={COLORS.primaryDark}
                      />
                    </View>
                  );
                })}
              </View>

              {renderMessage()}
            </View>

            <View style={styles.bottomArea}>
              <TouchableOpacity
                style={[styles.mainButtonWrapper, loading && { opacity: 0.75 }]}
                onPress={handleVerifyOtp}
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

                  {loading ? (
                    <View style={styles.loadingRow}>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text style={styles.buttonText}>جاري التحقق...</Text>
                    </View>
                  ) : (
                    <Text style={styles.buttonText}>متابعة</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {renderResendArea()}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "hidden",
  },

  keyboardAvoidingView: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
  },

  screenContent: {
    flex: 1,
    minHeight: height,
    paddingHorizontal: 18,
    paddingBottom: height * 0.09,
  },

  backButtonWrapper: {
    position: "absolute",
    top: height * 0.105,
    left: 24,
    width: height < 650 ? 44 : 48,
    height: height < 650 ? 44 : 48,
    borderRadius: height < 650 ? 22 : 24,
    zIndex: 10,

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

  content: {
    zIndex: 5,
    paddingTop: height * 0.18,
    alignItems: "center",
  },

  title: {
    fontSize: height < 650 ? 22 : height < 720 ? 24 : 25,
    fontWeight: "900",
    color: COLORS.title,
    textAlign: "center",
    letterSpacing: -0.4,
    lineHeight: height < 650 ? 32 : 35,
    textShadowColor: "rgba(255,255,255,0.95)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
  },

  subtitle: {
    marginTop: 12,
    fontSize: height < 650 ? 14.5 : 15.5,
    color: COLORS.label,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: height < 650 ? 21 : 23,
  },

  emailText: {
    marginTop: 7,
    marginBottom: 28,
    fontSize: 15,
    color: COLORS.primaryText,
    fontWeight: "900",
    textAlign: "center",
  },

  otpRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
  },

  otpBoxWrapper: {
    width: boxSize,
    height: 84,
    borderRadius: 14,

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
    borderColor: "rgba(154,33,28,0.45)",
    backgroundColor: "rgba(154,33,28,0.018)",
  },

  otpBoxFocused: {
    borderColor: COLORS.primary,
    backgroundColor: "rgba(154,33,28,0.035)",
    shadowColor: COLORS.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: Platform.OS === "android" ? 0.18 : 0.22,
    shadowRadius: 8,
    elevation: 5,
  },

  otpBoxError: {
    borderColor: "rgba(211,47,47,0.65)",
    backgroundColor: "rgba(211,47,47,0.035)",
  },

  otpInput: {
    width: "100%",
    height: "100%",
    fontSize: 28,
    fontWeight: "900",
    color: COLORS.inputText,
    textAlign: "center",
    paddingVertical: 0,
    backgroundColor: "transparent",
  },

  otpInputFilled: {
    color: COLORS.primaryText,
  },

  bottomArea: {
    marginTop: "auto",
    alignItems: "center",
    paddingTop: 28,
  },

  mainButtonWrapper: {
    width: "100%",
    height: 66,
    borderRadius: 33,
    overflow: "hidden",

    shadowColor: "#6E1411",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: Platform.OS === "android" ? 0.18 : 0.24,
    shadowRadius: 14,
    elevation: 6,
    backgroundColor: COLORS.primary,
  },

  buttonGradient: {
    flex: 1,
    borderRadius: 33,
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
    borderTopLeftRadius: 33,
    borderTopRightRadius: 33,
    backgroundColor: "rgba(255,255,255,0.10)",
    zIndex: 1,
  },

  buttonText: {
    color: "#FFFFFF",
    textAlign: "center",
    fontSize: 20,
    fontWeight: "900",
    zIndex: 5,
  },

  loadingRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    zIndex: 5,
  },

  timerBox: {
    marginTop: 18,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.70)",
    borderWidth: 1,
    borderColor: "rgba(135,27,23,0.10)",
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
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
    fontWeight: "600",
  },

  resendText: {
    color: COLORS.primaryText,
    fontSize: 14,
    fontWeight: "900",
    textDecorationLine: "underline",
  },

  messageBoxError: {
    width: "100%",
    flexDirection: "row-reverse",
    alignItems: "center",
    marginTop: 4,
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
    marginTop: 4,
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
});