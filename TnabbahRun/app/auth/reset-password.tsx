import React, { useEffect, useRef, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";

import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather, Ionicons } from "@expo/vector-icons";

const { height } = Dimensions.get("window");

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const hasProcessedRecovery = useRef(false);

  const [sessionReady, setSessionReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const prepareSession = async () => {
      try {
        console.log("RESET PASSWORD PARAMS:", params);

        if (sessionReady || hasProcessedRecovery.current) {
          setReady(true);
          return;
        }

        const tokenHash =
          typeof params.token_hash === "string"
            ? params.token_hash
            : Array.isArray(params.token_hash)
            ? params.token_hash[0]
            : null;

        if (!tokenHash) {
          setReady(true);
          return;
        }

        hasProcessedRecovery.current = true;

        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: "recovery",
        });

        if (error) {
          console.log("verifyOtp recovery error:", error.message);
          Alert.alert("خطأ", "رابط إعادة التعيين غير صالح أو منتهي");
          setSessionReady(false);
        } else {
          console.log("Password recovery session created from token_hash");
          setSessionReady(true);
        }
      } catch (error) {
        console.log("Reset password token_hash error:", error);
        setSessionReady(false);
      } finally {
        setReady(true);
      }
    };

    prepareSession();
  }, [params, sessionReady]);

  const goToLoginAfterReset = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.log("Sign out after reset error:", e);
    } finally {
      router.replace("/login" as any);
    }
  };

  const handleUpdatePassword = async () => {
    if (!sessionReady) {
      Alert.alert(
        "تنبيه",
        "افتحي صفحة إعادة التعيين من رابط الإيميل الجديد، وليس من زر داخل التطبيق"
      );
      return;
    }

    if (!password.trim() || !confirmPassword.trim()) {
      Alert.alert("تنبيه", "الرجاء إدخال كلمة المرور وتأكيدها");
      return;
    }

    if (password.length < 6) {
      Alert.alert("تنبيه", "كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("تنبيه", "كلمة المرور غير متطابقة");
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.auth.updateUser({
        password: password,
      });

     if (error) {
  Alert.alert("خطأ", error.message);
  return;
}

setPassword("");
setConfirmPassword("");
setSessionReady(false);

try {
  await supabase.auth.signOut();
} catch (e) {
  console.log("Sign out after reset error:", e);
}

Alert.alert("تم", "تم تغيير كلمة المرور بنجاح", [
  {
    text: "تسجيل الدخول",
    onPress: () => {
      router.replace("/login" as any);
    },
  },
]);
    } catch (error) {
      Alert.alert("خطأ", "حدث خطأ غير متوقع");
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

        <View style={styles.inputBox}>
          <Feather
            name="lock"
            size={23}
            color="#7C6A6A"
            style={styles.inputIcon}
          />

          <TextInput
            style={styles.input}
            placeholder="كلمة المرور الجديدة"
            placeholderTextColor="#7C6A6A"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            textAlign="right"
          />
        </View>

        <View style={styles.inputBox}>
          <Feather
            name="lock"
            size={23}
            color="#7C6A6A"
            style={styles.inputIcon}
          />

          <TextInput
            style={styles.input}
            placeholder="تأكيد كلمة المرور"
            placeholderTextColor="#7C6A6A"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            textAlign="right"
          />
        </View>
      </View>

      <View style={styles.buttonsArea}>
        <TouchableOpacity
          style={[styles.resetButton, loading && { opacity: 0.5 }]}
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

            <Text style={styles.resetText}>
              {loading ? "جاري التحديث..." : "تحديث كلمة المرور"}
            </Text>
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

  resetText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 20,
    fontWeight: "900",
    includeFontPadding: false,
  },
});