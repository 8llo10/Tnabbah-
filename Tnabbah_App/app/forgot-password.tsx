import React, { useState } from "react";
import { useRouter } from "expo-router";
import { supabase } from "../lib/supabase";

import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  Dimensions,
  ActivityIndicator,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";
import { Feather, Ionicons } from "@expo/vector-icons";

const { height } = Dimensions.get("window");

function TnabbahBackground() {
  return <View style={styles.background} />;
}

export default function ForgotPasswordScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      Alert.alert("تنبيه", "الرجاء إدخال البريد الإلكتروني");
      return;
    }

    try {
      setLoading(true);

      // هنا ما نستخدم redirectTo
      // لأننا بنستخدم كود OTP بدل رابط يفتح التطبيق
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail);
      

      if (error) {
        console.log("Forgot password error:", error.message);
        Alert.alert("خطأ", error.message);
        return;
      }

      Alert.alert(
        "تم الإرسال",
        "تم إرسال كود إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.",
        [
          {
            text: "حسنًا",
            onPress: () =>
              router.push({
                pathname: "/auth/reset-password" as any,
                params: { email: cleanEmail },
              }),
          },
        ]
      );
    } catch (err) {
      console.log("Forgot password unexpected error:", err);
      Alert.alert("خطأ", "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TnabbahBackground />

      <TouchableOpacity
        style={styles.backButton}
        activeOpacity={0.8}
        onPress={() => router.replace("/login")}
      >
        <Ionicons name="arrow-forward" size={24} color="#2E1D1D" />
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>نسيت كلمة المرور؟</Text>

        <Text style={styles.subtitle}>
          أدخلي البريد الإلكتروني المرتبط بحسابك لإرسال كود إعادة تعيين كلمة المرور
        </Text>

        <View style={styles.formArea}>
          <View style={styles.inputBox}>
            <Feather
              name="mail"
              size={22}
              color="#7C6A6A"
              style={styles.inputIcon}
            />

            <TextInput
              style={styles.input}
              placeholder="البريد الإلكتروني"
              placeholderTextColor="#7C6A6A"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
              textAlign="right"
            />
          </View>
        </View>
      </View>

      <View style={styles.buttonsArea}>
        <TouchableOpacity
          style={[styles.resetButton, loading && { opacity: 0.6 }]}
          onPress={handleSubmit}
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
                <Text style={styles.resetText}>جاري الإرسال...</Text>
              </View>
            ) : (
              <Text style={styles.resetText}>إرسال الكود</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },

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