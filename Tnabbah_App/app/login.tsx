import { useState, useMemo } from "react";
import { useRouter } from "expo-router";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  useWindowDimensions,
} from "react-native";
import { supabase } from "../lib/supabase";

import { LinearGradient } from "expo-linear-gradient";
import { Feather, Ionicons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export default function LoginScreen() {
  const router = useRouter();

  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const isSmallScreen = height < 720;
  const isVerySmallScreen = height < 650;

  const horizontalPadding = clamp(width * 0.055, 18, 24);

  const backButtonSize = isVerySmallScreen ? 44 : 48;
  const backButtonRadius = backButtonSize / 2;

  const topSpacing = clamp(height * 0.026, 12, 20);
  const bottomSpacing = clamp(height * 0.025, 16, 24);

  const inputHeight = isVerySmallScreen ? 61 : 66;
  const inputRadius = inputHeight / 2;

  const buttonHeight = isVerySmallScreen ? 58 : 64;
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
    ]
  );

  const handleLogin = async () => {
    try {
      if (!email.trim()) return Alert.alert("خطأ", "أدخلي البريد الإلكتروني");
      if (!password.trim()) return Alert.alert("خطأ", "أدخلي كلمة المرور");

      setLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        Alert.alert("خطأ", error.message);
        return;
      }

      if (data.session) {
        router.replace("/connection-intro" as any);
      }
    } catch (err) {
      console.log("Login Error:", err);
      Alert.alert("خطأ", "صار خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
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
              {/* الهيدر */}
              <View style={styles.topHeader}>
                <TouchableOpacity
                  style={styles.backButtonWrapper}
                  activeOpacity={0.85}
                  onPress={() => router.back()}
                >
                  <Ionicons
                    name="chevron-back"
                    size={isVerySmallScreen ? 21 : 23}
                    color="#871B17"
                  />
                </TouchableOpacity>

                <Text style={styles.title}>تسجيل الدخول</Text>

                <View style={styles.headerSpacer} />
              </View>

              <View style={styles.titleUnderline} />

              <View style={styles.welcomeArea}>
                <Text style={styles.subtitle}>مرحباً بك في تنبّه</Text>
              </View>

              {/* الفورم */}
              <View style={styles.formArea}>
                {/* البريد الإلكتروني */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.inputLabel}>البريد الإلكتروني</Text>

                  <View style={styles.inputWrapper}>
                    <Feather
                      name="mail"
                      size={isVerySmallScreen ? 20 : 21}
                      color="#871B17"
                      style={styles.inputIcon}
                    />

                    <TextInput
                      style={styles.input}
                      placeholder="example@email.com"
                      placeholderTextColor="#B0A6A4"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      value={email}
                      onChangeText={setEmail}
                      textAlign="right"
                      returnKeyType="next"
                    />
                  </View>
                </View>

                {/* كلمة المرور */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.inputLabel}>كلمة المرور</Text>

                  <View style={styles.inputWrapper}>
                    <Feather
                      name="lock"
                      size={isVerySmallScreen ? 21 : 22}
                      color="#871B17"
                      style={styles.inputIcon}
                    />

                    <TextInput
                      style={styles.input}
                      placeholder="••••••••"
                      placeholderTextColor="#B0A6A4"
                      secureTextEntry={!showPassword}
                      value={password}
                      onChangeText={setPassword}
                      textAlign="right"
                      autoCapitalize="none"
                      autoCorrect={false}
                      returnKeyType="done"
                    />

                    <TouchableOpacity
                      style={styles.eyeButton}
                      activeOpacity={0.7}
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <Ionicons
                        name={showPassword ? "eye-outline" : "eye-off-outline"}
                        size={isVerySmallScreen ? 21 : 22}
                        color="#7C6A6A"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.forgotPasswordButton}
                  onPress={() => router.push("/forgot-password" as any)}
                >
                  <Text style={styles.forgotPasswordText}>
                    نسيت كلمة المرور؟
                  </Text>
                </TouchableOpacity>

                {/* زر تسجيل الدخول نفس زر الستارت */}
                <TouchableOpacity
                  style={[
                    styles.loginButtonWrapper,
                    loading && { opacity: 0.55 },
                  ]}
                  onPress={handleLogin}
                  disabled={loading}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={[
                      "rgba(154,33,28,0.98)",
                      "rgba(118,23,19,0.98)",
                    ]}
                    start={{ x: 0.15, y: 0 }}
                    end={{ x: 0.9, y: 1 }}
                    style={styles.loginGradient}
                  >
                    <View style={styles.loginShine} />

                    <Text style={styles.loginText}>
                      {loading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {/* أو */}
              <View style={styles.orArea}>
                <View style={styles.orLine} />
                <Text style={styles.orText}>أو</Text>
                <View style={styles.orLine} />
              </View>

              {/* إنشاء حساب بدون زر */}
              <View style={styles.registerTextArea}>
                <Text style={styles.registerText}>ليس لديك حساب؟ </Text>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => router.push("/register")}
                >
                  <Text style={styles.registerTextBold}>
                    إنشاء حساب جديد
                  </Text>
                </TouchableOpacity>
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
  inputHeight,
  inputRadius,
  buttonHeight,
  buttonRadius,
  isSmallScreen,
  isVerySmallScreen,
  safeTop,
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
}) {
  return StyleSheet.create({
    container: {
      flex: 1,
      overflow: "hidden",
      backgroundColor: "#FFFFFF",
    },

    safeArea: {
      flex: 1,
      backgroundColor: "#FFFFFF",
    },

    keyboardAvoidingView: {
      flex: 1,
      backgroundColor: "#FFFFFF",
    },

    scrollContent: {
      flexGrow: 1,
      backgroundColor: "#FFFFFF",
    },

    screenContent: {
      flex: 1,
      paddingHorizontal: horizontalPadding,
      paddingTop: topSpacing,
      paddingBottom: bottomSpacing,
      minHeight: "100%",
      backgroundColor: "#FFFFFF",
    },

    topHeader: {
      width: "100%",
      paddingTop: safeTop + 10,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 8,
    },

    backButtonWrapper: {
      width: backButtonSize,
      height: backButtonSize,
      borderRadius: backButtonRadius,
      alignItems: "center",
      justifyContent: "center",

      backgroundColor: "#FFFFFF",
      borderWidth: 1.7,
      borderColor: "rgba(154,33,28,0.40)",

      // شلنا النور/الظل من زر الرجوع
      shadowColor: "transparent",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },

    title: {
      flex: 1,
      fontSize: isVerySmallScreen ? 25 : isSmallScreen ? 30 : 32,
      fontWeight: "900",
      color: "#7B1714",
      textAlign: "center",
      letterSpacing: -0.7,
      lineHeight: isVerySmallScreen ? 36 : 43,

      textShadowColor: "rgba(255,255,255,0.95)",
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 14,
    },

    headerSpacer: {
      width: backButtonSize,
      height: backButtonSize,
    },

    titleUnderline: {
      alignSelf: "center",
      marginTop: 2,
      marginBottom: 11,
      width: isVerySmallScreen ? 68 : 84,
      height: 4,
      borderRadius: 99,
      backgroundColor: "rgba(135,27,23,0.28)",
    },

    welcomeArea: {
      alignItems: "center",
      marginBottom: isVerySmallScreen ? 54 : isSmallScreen ? 66 : 78,
    },

    subtitle: {
      fontSize: isVerySmallScreen ? 15 : 17,
      lineHeight: isVerySmallScreen ? 24 : 29,
      color: "#2C2C2C",
      fontWeight: "800",
      textAlign: "center",

      textShadowColor: "rgba(255,255,255,0.90)",
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 10,
    },

    formArea: {
      width: "100%",
      paddingHorizontal: 2,
    },

    fieldGroup: {
      width: "100%",
      marginBottom: isVerySmallScreen ? 20 : 24,
    },

    inputLabel: {
      color: "#4A3C39",
      fontSize: isVerySmallScreen ? 15.5 : 16.5,
      fontWeight: "900",
      textAlign: "right",
      marginBottom: 11,
    },

    inputWrapper: {
      width: "100%",
      height: inputHeight,
      borderRadius: inputRadius,

      backgroundColor: "#FFFFFF",

      borderWidth: 1.9,
      borderColor: "rgba(154,33,28,0.42)",

      paddingHorizontal: isVerySmallScreen ? 16 : 18,
      flexDirection: "row-reverse",
      alignItems: "center",

      // شلنا النور/الظل من الإيميل وكلمة المرور
      shadowColor: "transparent",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },

    inputIcon: {
      marginLeft: isVerySmallScreen ? 11 : 13,
    },

    input: {
      flex: 1,
      fontSize: isVerySmallScreen ? 16 : 17,
      color: "#2E1D1D",
      fontWeight: "700",
      paddingVertical: 0,
    },

    eyeButton: {
      width: isVerySmallScreen ? 32 : 34,
      height: isVerySmallScreen ? 32 : 34,
      borderRadius: isVerySmallScreen ? 16 : 17,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 8,
    },

    forgotPasswordButton: {
      alignSelf: "flex-end",
      marginTop: isVerySmallScreen ? -6 : -8,
      marginBottom: isVerySmallScreen ? 25 : 31,
      paddingVertical: 6,
      zIndex: 999,
      elevation: 999,
    },

    forgotPasswordText: {
      color: "#6E1411",
      fontSize: isVerySmallScreen ? 14.5 : 15.2,
      textAlign: "right",
      fontWeight: "900",
    },

    loginButtonWrapper: {
      width: "100%",
      height: buttonHeight,
      borderRadius: buttonRadius,
      overflow: "hidden",

      shadowColor: "#6E1411",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.24,
      shadowRadius: 14,
      elevation: 6,
    },

    loginGradient: {
      flex: 1,
      borderRadius: buttonRadius,
      justifyContent: "center",
      alignItems: "center",
      overflow: "hidden",
    },

    loginShine: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: "48%",
      backgroundColor: "rgba(255,255,255,0.10)",
      borderTopLeftRadius: buttonRadius,
      borderTopRightRadius: buttonRadius,
    },

    loginText: {
      color: "#FFFFFF",
      fontSize: isVerySmallScreen ? 19 : 21,
      fontWeight: "900",
      textAlign: "center",
      zIndex: 5,
    },

    orArea: {
      marginTop: isVerySmallScreen ? 34 : 40,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
    },

    orLine: {
      flex: 1,
      height: 1,
      backgroundColor: "rgba(154,33,28,0.22)",
    },

    orText: {
      marginHorizontal: 16,
      color: "#8C7A76",
      fontSize: isVerySmallScreen ? 15 : 16,
      fontWeight: "800",
    },

    registerTextArea: {
      marginTop: isVerySmallScreen ? 16 : 18,
      flexDirection: "row-reverse",
      alignItems: "center",
      justifyContent: "center",
      flexWrap: "wrap",
    },

    registerText: {
      color: "#6C5B58",
      fontSize: isVerySmallScreen ? 14.5 : 15.5,
      fontWeight: "700",
      textAlign: "center",
    },

    registerTextBold: {
      color: "#9A211C",
      fontSize: isVerySmallScreen ? 14.5 : 15.5,
      fontWeight: "900",
      textAlign: "center",
    },
  });
}