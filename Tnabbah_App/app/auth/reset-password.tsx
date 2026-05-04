import React, { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";
import * as Linking from "expo-linking";

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

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [tokenHash, setTokenHash] = useState<string | null>(null);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  const getStringParam = (value: unknown) => {
    if (typeof value === "string") return value;
    if (Array.isArray(value) && typeof value[0] === "string") return value[0];
    return null;
  };

  const getParamsFromUrl = (url: string | null) => {
    const result: Record<string, string> = {};

    if (!url) return result;

    try {
      const queryPart = url.includes("?") ? url.split("?")[1]?.split("#")[0] : "";
      const hashPart = url.includes("#") ? url.split("#")[1] : "";

      const queryParams = new URLSearchParams(queryPart || "");
      const hashParams = new URLSearchParams(hashPart || "");

      queryParams.forEach((value, key) => {
        result[key] = value;
      });

      hashParams.forEach((value, key) => {
        result[key] = value;
      });

      return result;
    } catch {
      return result;
    }
  };

  useEffect(() => {
    const preparePage = async () => {
      const initialUrl = await Linking.getInitialURL();
      const urlParams = getParamsFromUrl(initialUrl);

      const tokenFromParams = getStringParam(params.token_hash);
      const tokenFromUrl = urlParams.token_hash;

      setTokenHash(tokenFromParams || tokenFromUrl || null);
      setReady(true);
    };

    preparePage();
  }, [params]);

  const validatePassword = () => {
    const hasMinLength = password.length >= 6;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    if (!password.trim() || !confirmPassword.trim()) {
      setErrorMessage("اكتبي كلمة المرور وتأكيدها");
      return false;
    }

    if (!hasMinLength) {
      setErrorMessage("كلمة المرور لازم تكون 6 خانات على الأقل");
      return false;
    }

    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      setErrorMessage("كلمة المرور لازم تحتوي على حرف كبير، حرف صغير، ورقم");
      return false;
    }

    if (password !== confirmPassword) {
      setErrorMessage("كلمة المرور وتأكيدها غير متطابقين");
      return false;
    }

    setErrorMessage("");
    return true;
  };

  const handleUpdatePassword = async () => {
    if (!validatePassword()) {
      return;
    }

    if (!tokenHash) {
      setErrorMessage("الرابط غير صالح، اطلبي رابط جديد");
      return;
    }

    try {
      setLoading(true);

      const { error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: "recovery",
      });

      if (verifyError) {
        console.log("verifyOtp error:", verifyError.message);
        setErrorMessage("الرابط غير صالح أو تم استخدامه من قبل، اطلبي رابط جديد");
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        console.log("update password error:", updateError.message);
        setErrorMessage("تعذر تحديث كلمة المرور، حاولي مرة أخرى");
        return;
      }

      setPassword("");
      setConfirmPassword("");
      setErrorMessage("");

      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.log("signOut error:", e);
      }

      router.replace("/login" as any);
    } catch (error) {
      console.log("reset password error:", error);
      setErrorMessage("حدث خطأ غير متوقع، حاولي مرة أخرى");
    } finally {
      setLoading(false);
    }
  };

  if (!ready) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>جاري تجهيز الصفحة...</Text>
      </View>
    );
  }

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
          أدخلي كلمة مرور جديدة لحسابك، ثم أكديها لإتمام التغيير
        </Text>

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
            placeholder="تأكيد كلمة المرور"
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
                <Text style={styles.resetText}>جاري التحديث...</Text>
              </View>
            ) : (
              <Text style={styles.resetText}>تحديث كلمة المرور</Text>
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

  loadingText: {
    marginTop: height * 0.45,
    textAlign: "center",
    color: "#7C6A6A",
    fontSize: 16,
    fontWeight: "700",
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
    paddingTop: height * 0.19,
  },

  title: {
    fontSize: 32,
    fontWeight: "900",
    color: "#2E1D1D",
    textAlign: "center",
    letterSpacing: -0.4,
    includeFontPadding: false,
  },

  subtitle: {
    marginTop: 18,
    marginBottom: 58,
    fontSize: 16,
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
    marginTop: -6,
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