import React, { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";

import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Dimensions,
  ActivityIndicator,
  Alert,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";
import { Feather, Ionicons } from "@expo/vector-icons";

const { height } = Dimensions.get("window");

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const initialEmail =
    typeof params.email === "string"
      ? params.email
      : Array.isArray(params.email)
      ? params.email[0]
      : "";

  // الإيميل جاي تلقائيًا من صفحة Forgot Password
  // المستخدم ما يحتاج يكتبه مرة ثانية
  const [email] = useState(initialEmail || "");

  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpdatePassword = async () => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();
    const cleanPassword = password.trim();
    const cleanConfirmPassword = confirmPassword.trim();

    if (!cleanEmail) {
      setErrorMessage(
        "لم يتم العثور على البريد الإلكتروني. ارجعي لصفحة نسيت كلمة المرور وارسلي الكود من جديد"
      );
      return;
    }

    if (!cleanOtp) {
      setErrorMessage("اكتبي كود التحقق");
      return;
    }

    if (!cleanPassword) {
      setErrorMessage("اكتبي كلمة المرور الجديدة");
      return;
    }

    if (!cleanConfirmPassword) {
      setErrorMessage("أكدي كلمة المرور الجديدة");
      return;
    }

    if (cleanPassword !== cleanConfirmPassword) {
      setErrorMessage("كلمة المرور وتأكيدها غير متطابقين");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");

      console.log("VERIFY RECOVERY OTP START");

      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: cleanOtp,
        type: "recovery",
      });

      if (verifyError) {
        console.log("verifyOtp error:", verifyError.message);
        setErrorMessage("الكود غير صحيح أو انتهت صلاحيته");
        return;
      }

      const { data: sessionData } = await supabase.auth.getSession();

      console.log(
        "SESSION AFTER OTP:",
        sessionData.session ? "FOUND" : "MISSING"
      );

      if (!sessionData.session) {
        setErrorMessage("لم يتم إنشاء جلسة تغيير كلمة المرور، اطلبي كود جديد");
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: cleanPassword,
      });

      if (updateError) {
        console.log("update password error:", updateError.message);
        setErrorMessage("ما قدرنا نحفظ كلمة المرور الجديدة");
        return;
      }

      console.log("PASSWORD UPDATED SUCCESSFULLY");

      setOtp("");
      setPassword("");
      setConfirmPassword("");
      setErrorMessage("");

      await supabase.auth.signOut();

      Alert.alert("تم بنجاح", "تم تغيير كلمة المرور، سجلي دخولك الآن", [
        {
          text: "حسنًا",
          onPress: () => router.replace("/login" as any),
        },
      ]);
    } catch (error) {
      console.log("reset password error:", error);
      setErrorMessage("حدث خطأ غير متوقع، حاولي مرة أخرى");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        activeOpacity={0.8}
        onPress={() => router.replace("/login" as any)}
      >
        <Ionicons name="arrow-forward" size={24} color="#2E1D1D" />
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>إعادة تعيين كلمة المرور</Text>

        <Text style={styles.subtitle}>
          أدخلي كود التحقق المرسل إلى بريدك، ثم اكتبي كلمة المرور الجديدة
        </Text>

        <View style={[styles.inputBox, errorMessage && styles.inputBoxError]}>
          <Feather
            name="key"
            size={22}
            color={errorMessage ? "#D32F2F" : "#7C6A6A"}
            style={styles.inputIcon}
          />

          <TextInput
            style={styles.input}
            placeholder="كود التحقق"
            placeholderTextColor="#7C6A6A"
            keyboardType="number-pad"
            autoCapitalize="none"
            autoCorrect={false}
            value={otp}
            onChangeText={(text) => {
              setOtp(text);
              setErrorMessage("");
            }}
            textAlign="right"
          />
        </View>

        <View style={[styles.inputBox, errorMessage && styles.inputBoxError]}>
          <Feather
            name="lock"
            size={23}
            color={errorMessage ? "#D32F2F" : "#7C6A6A"}
            style={styles.inputIcon}
          />

          <TextInput
            style={styles.input}
            placeholder="كلمة المرور الجديدة"
            placeholderTextColor="#7C6A6A"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setErrorMessage("");
            }}
            textAlign="right"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TouchableOpacity
            style={styles.eyeButton}
            activeOpacity={0.7}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Ionicons
              name={showPassword ? "eye-outline" : "eye-off-outline"}
              size={22}
              color="#7C6A6A"
            />
          </TouchableOpacity>
        </View>

        <View style={[styles.inputBox, errorMessage && styles.inputBoxError]}>
          <Feather
            name="lock"
            size={23}
            color={errorMessage ? "#D32F2F" : "#7C6A6A"}
            style={styles.inputIcon}
          />

          <TextInput
            style={styles.input}
            placeholder="تأكيد كلمة المرور الجديدة"
            placeholderTextColor="#7C6A6A"
            secureTextEntry={!showConfirmPassword}
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              setErrorMessage("");
            }}
            textAlign="right"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TouchableOpacity
            style={styles.eyeButton}
            activeOpacity={0.7}
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            <Ionicons
              name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
              size={22}
              color="#7C6A6A"
            />
          </TouchableOpacity>
        </View>

        {errorMessage ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={18} color="#D32F2F" />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.buttonsArea}>
        <TouchableOpacity
          style={[styles.resetButton, loading && { opacity: 0.75 }]}
          onPress={handleUpdatePassword}
          disabled={loading}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={["#9A3A33", "#5F130F"]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.resetGradient}
          >
            <View style={styles.buttonHighlight} />

            {loading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={styles.resetText}>جاري الحفظ...</Text>
              </View>
            ) : (
              <Text style={styles.resetText}>حفظ كلمة المرور</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },

  backButton: {
    position: "absolute",
    top: height * 0.112,
    left: 24,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "rgba(248, 238, 238, 0.85)",
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
    zIndex: 5,
    paddingTop: height * 0.17,
  },

  title: {
    fontSize: 31,
    fontWeight: "900",
    color: "#2E1D1D",
    textAlign: "center",
    letterSpacing: -0.4,
    includeFontPadding: false,
  },

  subtitle: {
    marginTop: 18,
    marginBottom: 44,
    fontSize: 15.5,
    color: "#7C6A6A",
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 24,
    includeFontPadding: false,
  },

  inputBox: {
    width: "100%",
    height: 62,
    borderRadius: 31,
    borderWidth: 1.3,
    borderColor: "#E7C6C6",
    backgroundColor: "rgba(255,255,255,0.68)",
    marginBottom: 18,
    paddingHorizontal: 22,
    flexDirection: "row-reverse",
    alignItems: "center",
    shadowColor: "#5F130F",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.025,
    shadowRadius: 10,
    elevation: 1,
  },

  inputBoxError: {
    borderColor: "#D32F2F",
    backgroundColor: "rgba(255, 245, 245, 0.88)",
  },

  inputIcon: {
    marginLeft: 13,
  },

  input: {
    flex: 1,
    fontSize: 17,
    color: "#2E1D1D",
    fontWeight: "600",
    paddingVertical: 0,
    includeFontPadding: false,
  },

  eyeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },

  errorBox: {
    flexDirection: "row-reverse",
    alignItems: "center",
    alignSelf: "flex-end",
    marginTop: -4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: "rgba(211, 47, 47, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(211, 47, 47, 0.18)",
    gap: 7,
  },

  errorText: {
    color: "#D32F2F",
    fontSize: 13.5,
    fontWeight: "800",
    textAlign: "right",
    includeFontPadding: false,
  },

  buttonsArea: {
    position: "absolute",
    left: 24,
    right: 24,
    bottom: height * 0.064,
    zIndex: 8,
  },

  resetButton: {
    width: "100%",
    height: 62,
    borderRadius: 31,
    overflow: "hidden",
    marginBottom: 22,
    shadowColor: "#5F130F",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 4,
  },

  resetGradient: {
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

  loadingRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },

  resetText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 20,
    fontWeight: "900",
    includeFontPadding: false,
  },
});