import React, { useState } from "react";
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
  Dimensions,
  ActivityIndicator,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";
import { Feather, Ionicons } from "@expo/vector-icons";

const { height } = Dimensions.get("window");

const TOP_RED = "#9A3A33";
const DARK_RED = "#5F130F";
const TEXT_DARK = "#2E1D1D";
const TEXT_MUTED = "#7C6A6A";
const SOFT_PINK = "rgba(248, 238, 238, 0.85)";

export default function NewPasswordScreen() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [loading, setLoading] = useState(false);

  const clearMessages = () => {
    setErrorMessage("");
    setSuccessMessage("");
  };

  const handleUpdatePassword = async () => {
    const cleanPassword = password.trim();
    const cleanConfirmPassword = confirmPassword.trim();

    if (!cleanPassword) {
      setErrorMessage("اكتبي كلمة المرور الجديدة");
      return;
    }

    if (cleanPassword.length < 6) {
      setErrorMessage("كلمة المرور لازم تكون 6 أحرف أو أكثر");
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
      clearMessages();

      const { data: sessionData } = await supabase.auth.getSession();

      if (!sessionData.session) {
        setErrorMessage("انتهت جلسة تغيير كلمة المرور، اطلبي رمز جديد");
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

      setPassword("");
setConfirmPassword("");
setSuccessMessage("تم حفظ كلمة المرور بنجاح");

await AsyncStorage.removeItem("password_recovery_flow");

const { error: signOutError } = await supabase.auth.signOut();

if (signOutError) {
  console.log("signOut error:", signOutError.message);
}

setTimeout(() => {
  router.replace("/login" as any);
}, 900);
   
    } catch (error) {
      console.log("new password error:", error);
      setErrorMessage("حدث خطأ غير متوقع، حاولي مرة ثانية");
    } finally {
      setLoading(false);
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

    if (successMessage) {
      return (
        <View style={styles.messageBoxInfo}>
          <Ionicons name="checkmark-circle" size={18} color="#2E7D32" />
          <Text style={styles.messageTextInfo}>{successMessage}</Text>
        </View>
      );
    }

    return null;
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
        <Text style={styles.title}>تعيين كلمة المرور</Text>

        <Text style={styles.subtitle}>
          أدخلي كلمة المرور الجديدة ثم أعيدي إدخالها للتأكيد
        </Text>

        <View style={styles.formArea}>
          <View style={styles.inputBox}>
            <Feather
              name="lock"
              size={22}
              color={TEXT_MUTED}
              style={styles.inputIcon}
            />

            <TextInput
              style={styles.input}
              placeholder="كلمة المرور الجديدة"
              placeholderTextColor={TEXT_MUTED}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                clearMessages();
              }}
              textAlign="right"
              autoCapitalize="none"
              autoCorrect={false}
              selectionColor={DARK_RED}
            />

            <TouchableOpacity
              style={styles.eyeButton}
              activeOpacity={0.7}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons
                name={showPassword ? "eye-outline" : "eye-off-outline"}
                size={22}
                color={TEXT_MUTED}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.inputBox}>
            <Feather
              name="lock"
              size={22}
              color={TEXT_MUTED}
              style={styles.inputIcon}
            />

            <TextInput
              style={styles.input}
              placeholder="تأكيد كلمة المرور الجديدة"
              placeholderTextColor={TEXT_MUTED}
              secureTextEntry={!showConfirmPassword}
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                clearMessages();
              }}
              textAlign="right"
              autoCapitalize="none"
              autoCorrect={false}
              selectionColor={DARK_RED}
            />

            <TouchableOpacity
              style={styles.eyeButton}
              activeOpacity={0.7}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <Ionicons
                name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                size={22}
                color={TEXT_MUTED}
              />
            </TouchableOpacity>
          </View>

          {renderMessage()}
        </View>
      </View>

      <View style={styles.bottomArea}>
        <TouchableOpacity
          style={[styles.mainButton, loading && { opacity: 0.75 }]}
          onPress={handleUpdatePassword}
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
                <Text style={styles.buttonText}>جاري الحفظ...</Text>
              </View>
            ) : (
              <Text style={styles.buttonText}>حفظ كلمة المرور</Text>
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
    zIndex: 5,
    paddingTop: height * 0.19,
    alignItems: "center",
  },

  title: {
    fontSize: 32,
    fontWeight: "900",
    color: TEXT_DARK,
    textAlign: "center",
    letterSpacing: -0.4,
    includeFontPadding: false,
    textDecorationLine: "none",
  },

  subtitle: {
    marginTop: 18,
    marginBottom: 48,
    fontSize: 16,
    color: TEXT_MUTED,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 24,
    includeFontPadding: false,
  },

  formArea: {
    width: "100%",
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
    shadowColor: DARK_RED,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.025,
    shadowRadius: 10,
    elevation: 1,
  },

  inputIcon: {
    marginLeft: 13,
  },

  input: {
    flex: 1,
    fontSize: 17,
    color: TEXT_DARK,
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

  bottomArea: {
    position: "absolute",
    left: 24,
    right: 24,
    bottom: height * 0.064,
    zIndex: 8,
  },

  mainButton: {
    width: "100%",
    height: 62,
    borderRadius: 31,
    overflow: "hidden",
    marginBottom: 22,
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

  loadingRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },

  buttonText: {
    color: "#FFFFFF",
    textAlign: "center",
    fontSize: 20,
    fontWeight: "900",
    includeFontPadding: false,
  },

  messageBoxError: {
    width: "100%",
    flexDirection: "row-reverse",
    alignItems: "center",
    marginTop: 0,
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
    marginTop: 0,
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