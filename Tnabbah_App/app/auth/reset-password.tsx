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
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

const { height, width } = Dimensions.get("window");

const OTP_DIGITS = 8;
const RESEND_COOLDOWN = 60;

const TOP_RED = "#9A3A33";
const DARK_RED = "#5F130F";
const TEXT_DARK = "#2E1D1D";
const SOFT_PINK = "rgba(248, 238, 238, 0.85)";
const SOFT_PINK_SOLID = "#FCF7F7";
const LIGHT_BORDER = "#E6DADA";
const FILLED_BORDER = "#EADADA";
const SOFT_LINK_RED = "#9A3A33";

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
      } else {
        Keyboard.dismiss();
      }

      return;
    }

    updated[index] = onlyNumber;
    setOtpValues(updated);
    clearMessages();

    if (index < OTP_DIGITS - 1) {
      otpRefs.current[index + 1]?.focus();
    } else {
      Keyboard.dismiss();
    }
  };

  const handleOtpKeyPress = (key: string, index: number) => {
    if (key === "Backspace" && !otpValues[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();

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

      console.log("Start verify OTP:", cleanEmail, cleanOtp);

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
          <Ionicons name="alert-circle" size={18} color="#D32F2F" />
          <Text style={styles.messageTextError}>{errorMessage}</Text>
        </View>
      );
    }

    if (infoMessage) {
      return (
        <View style={styles.messageBoxInfo}>
          <Ionicons name="checkmark-circle" size={18} color="#2E7D32" />
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
      <TouchableOpacity
        style={styles.backButton}
        activeOpacity={0.8}
        onPress={() => router.replace("/login" as any)}
      >
        <Ionicons name="arrow-back" size={24} color={TEXT_DARK} />
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>أدخل رمز التحقق</Text>

        <Text style={styles.subtitle}>
          يرجى إدخال الرمز المكوّن من {OTP_DIGITS} أرقام المرسل إلى
        </Text>

        <Text style={styles.emailText}>{email || "البريد الإلكتروني"}</Text>

        <View style={styles.otpRow}>
          {otpValues.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => {
                otpRefs.current[index] = ref;
              }}
              style={[
                styles.otpBox,
                digit ? styles.otpBoxFilled : null,
                errorMessage ? styles.otpBoxError : null,
              ]}
              value={digit}
              onChangeText={(text) => handleOtpChange(text, index)}
              onKeyPress={({ nativeEvent }) =>
                handleOtpKeyPress(nativeEvent.key, index)
              }
              keyboardType="number-pad"
              maxLength={index === 0 ? OTP_DIGITS : 1}
              textAlign="center"
              autoCorrect={false}
              autoCapitalize="none"
              selectionColor={DARK_RED}
            />
          ))}
        </View>

        {renderMessage()}
      </View>

      <View style={styles.bottomArea}>
        <TouchableOpacity
          style={[styles.mainButton, loading && { opacity: 0.75 }]}
          onPress={handleVerifyOtp}
          disabled={loading}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={[TOP_RED, DARK_RED]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.buttonGradient}
          >
            <View style={styles.buttonHighlight} />

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
  );
}

const boxSize = Math.min((width - 54) / 8, 44);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 18,
    backgroundColor: "#FFFFFF",
  },

  backButton: {
    position: "absolute",
    top: height * 0.095,
    left: 24,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: SOFT_PINK,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },

  content: {
    flex: 1,
    paddingTop: height * 0.18,
    alignItems: "center",
  },

  title: {
    fontSize: 31,
    fontWeight: "900",
    color: "#000000",
    textAlign: "center",
    includeFontPadding: false,
    textDecorationLine: "none",
  },

  subtitle: {
    marginTop: 12,
    fontSize: 14.5,
    color: "#9A9A9A",
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 22,
    includeFontPadding: false,
  },

  emailText: {
    marginTop: 7,
    marginBottom: 28,
    fontSize: 15,
    color: SOFT_LINK_RED,
    fontWeight: "700",
    textAlign: "center",
    includeFontPadding: false,
  },

  otpRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
  },

  otpBox: {
    width: boxSize,
    height: 84,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: LIGHT_BORDER,
    backgroundColor: "#FFFFFF",
    fontSize: 28,
    fontWeight: "800",
    color: TEXT_DARK,
    textAlign: "center",
    paddingVertical: 0,
    includeFontPadding: false,
  },

  otpBoxFilled: {
    borderColor: FILLED_BORDER,
    backgroundColor: SOFT_PINK_SOLID,
  },

  otpBoxError: {
    borderColor: "#D8A5A5",
    backgroundColor: "#FFF7F7",
  },

  bottomArea: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: height * 0.09,
    alignItems: "center",
  },

  mainButton: {
    width: "100%",
    height: 62,
    borderRadius: 31,
    overflow: "hidden",
    shadowColor: DARK_RED,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 4,
  },

  buttonGradient: {
    flex: 1,
    borderRadius: 31,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },

  buttonHighlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "50%",
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  buttonText: {
    color: "#FFFFFF",
    textAlign: "center",
    fontSize: 20,
    fontWeight: "900",
    includeFontPadding: false,
  },

  loadingRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },

  timerBox: {
    marginTop: 18,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 18,
    backgroundColor: "#FAF7F7",
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  timerText: {
    color: "#9A9A9A",
    fontSize: 14,
    fontWeight: "600",
    includeFontPadding: false,
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
    color: "#9A9A9A",
    fontSize: 14,
    fontWeight: "500",
    includeFontPadding: false,
  },

  resendText: {
    color: SOFT_LINK_RED,
    fontSize: 14,
    fontWeight: "800",
    textDecorationLine: "underline",
    includeFontPadding: false,
  },

  messageBoxError: {
    width: "100%",
    flexDirection: "row-reverse",
    alignItems: "center",
    marginTop: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: "rgba(211, 47, 47, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(211, 47, 47, 0.14)",
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
    backgroundColor: "rgba(46, 125, 50, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(46, 125, 50, 0.14)",
    gap: 7,
  },

  messageTextError: {
    color: "#D32F2F",
    fontSize: 13.5,
    fontWeight: "700",
    textAlign: "right",
    includeFontPadding: false,
    flex: 1,
  },

  messageTextInfo: {
    color: "#2E7D32",
    fontSize: 13.5,
    fontWeight: "700",
    textAlign: "right",
    includeFontPadding: false,
    flex: 1,
  },
});