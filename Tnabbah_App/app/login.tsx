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
import { BlurView } from "expo-blur";

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

  const horizontalPadding = clamp(width * 0.06, 18, 24);

  const backButtonSize = isVerySmallScreen ? 48 : 52;
  const backButtonRadius = backButtonSize / 2;

  const topSpacing = clamp(height * 0.045, 16, 34);
  const bottomSpacing = clamp(height * 0.035, 18, 30);

  const inputHeight = isVerySmallScreen ? 58 : 62;
  const inputRadius = inputHeight / 2;

  const buttonHeight = isVerySmallScreen ? 58 : 64;
  const buttonRadius = buttonHeight / 2;

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
    <LinearGradient
      colors={["#FFFFFF", "#FFF8F7", "#FFF1EE"]}
      locations={[0, 0.55, 1]}
      start={{ x: 0.15, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={styles.container}
    >
      {/* طبقة زجاج خفيفة على الخلفية */}
      <View pointerEvents="none" style={styles.backgroundGlassLayer}>
        <BlurView intensity={12} tint="light" style={StyleSheet.absoluteFillObject}>
          <LinearGradient
            colors={[
              "rgba(255,255,255,0.22)",
              "rgba(255,255,255,0.08)",
              "rgba(154,33,28,0.06)",
            ]}
            locations={[0, 0.52, 1]}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
        </BlurView>
      </View>

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
              {/* زر الرجوع الزجاجي */}
              <TouchableOpacity
                style={styles.backButtonWrapper}
                activeOpacity={0.85}
                onPress={() => router.back()}
              >
                <BlurView intensity={10} tint="light" style={styles.backBlur}>
                  <LinearGradient
                    colors={[
                      "rgba(255,255,255,0.50)",
                      "rgba(255,255,255,0.26)",
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.backButtonGradient}
                  >
                    <Ionicons
                      name="chevron-back"
                      size={isVerySmallScreen ? 22 : 24}
                      color="#871B17"
                    />
                  </LinearGradient>
                </BlurView>
              </TouchableOpacity>

              <View style={styles.content}>
                <Text style={styles.title}>تسجيل الدخول</Text>

                <View style={styles.titleUnderline} />

                <Text style={styles.subtitle}>مرحباً بك في تنبه</Text>

                <View style={styles.formArea}>
                  {/* البريد الإلكتروني */}
                  <View style={styles.inputWrapper}>
                    <BlurView intensity={10} tint="light" style={styles.inputBlur}>
                      <LinearGradient
                        colors={[
                          "rgba(255,255,255,0.58)",
                          "rgba(255,255,255,0.30)",
                        ]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.inputBox}
                      >
                        <Feather
                          name="mail"
                          size={isVerySmallScreen ? 20 : 21}
                          color="#871B17"
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
                          returnKeyType="next"
                        />
                      </LinearGradient>
                    </BlurView>
                  </View>

                  {/* كلمة المرور */}
                  <View style={styles.inputWrapper}>
                    <BlurView intensity={10} tint="light" style={styles.inputBlur}>
                      <LinearGradient
                        colors={[
                          "rgba(255,255,255,0.58)",
                          "rgba(255,255,255,0.30)",
                        ]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.inputBox}
                      >
                        <Feather
                          name="lock"
                          size={isVerySmallScreen ? 21 : 22}
                          color="#871B17"
                          style={styles.inputIcon}
                        />

                        <TextInput
                          style={styles.input}
                          placeholder="كلمة المرور"
                          placeholderTextColor="#7C6A6A"
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
                            color="#871B17"
                          />
                        </TouchableOpacity>
                      </LinearGradient>
                    </BlurView>
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
                </View>
              </View>

              <View style={styles.buttonsArea}>
                {/* زر تسجيل الدخول الأحمر */}
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

                {/* زر إنشاء حساب زجاجي */}
                <TouchableOpacity
                  style={styles.registerButtonWrapper}
                  onPress={() => router.push("/register")}
                  activeOpacity={0.9}
                >
                  <BlurView intensity={10} tint="light" style={styles.registerBlur}>
                    <LinearGradient
                      colors={[
                        "rgba(255,255,255,0.50)",
                        "rgba(255,255,255,0.28)",
                      ]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.registerGradient}
                    >
                      <Text style={styles.registerText}>
                        ليس لديك حساب؟{" "}
                        <Text style={styles.registerTextBold}>
                          إنشاء حساب جديد
                        </Text>
                      </Text>
                    </LinearGradient>
                  </BlurView>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
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
      backgroundColor: "#FFF8F7",
    },

    backgroundGlassLayer: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 1,
      backgroundColor: "transparent",
    },

    safeArea: {
      flex: 1,
      zIndex: 5,
    },

    keyboardAvoidingView: {
      flex: 1,
    },

    scrollContent: {
      flexGrow: 1,
    },

    screenContent: {
      flex: 1,
      paddingHorizontal: horizontalPadding,
      paddingTop: topSpacing,
      paddingBottom: bottomSpacing,
      minHeight: "100%",
    },

    backButtonWrapper: {
      position: "absolute",
      top: safeTop + topSpacing,
      left: horizontalPadding,
      width: backButtonSize,
      height: backButtonSize,
      borderRadius: backButtonRadius,
      overflow: "hidden",
      zIndex: 10,

      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.1,
      shadowRadius: 14,
      elevation: 5,

      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.58)",
    },

    backBlur: {
      flex: 1,
      width: backButtonSize,
      height: backButtonSize,
      borderRadius: backButtonRadius,
      overflow: "hidden",
    },

    backButtonGradient: {
      flex: 1,
      width: backButtonSize,
      height: backButtonSize,
      borderRadius: backButtonRadius,
      alignItems: "center",
      justifyContent: "center",
    },

    content: {
      zIndex: 5,
      paddingTop: isVerySmallScreen ? 92 : isSmallScreen ? 105 : 118,
    },

    title: {
      fontSize: isVerySmallScreen ? 27 : isSmallScreen ? 30 : 32,
      fontWeight: "900",
      color: "#7B1714",
      textAlign: "center",
      letterSpacing: -0.5,

      textShadowColor: "rgba(255,255,255,0.95)",
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 12,
    },

    titleUnderline: {
      alignSelf: "center",
      marginTop: 10,
      marginBottom: 12,
      width: isVerySmallScreen ? 64 : 78,
      height: 4,
      borderRadius: 99,
      backgroundColor: "rgba(135,27,23,0.28)",
    },

    subtitle: {
      marginBottom: isVerySmallScreen ? 34 : isSmallScreen ? 44 : 56,
      fontSize: isVerySmallScreen ? 15 : 16,
      color: "#2C2C2C",
      fontWeight: "800",
      textAlign: "center",

      textShadowColor: "rgba(255,255,255,0.9)",
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 8,
    },

    formArea: {
      width: "100%",
    },

    inputWrapper: {
      width: "100%",
      height: inputHeight,
      borderRadius: inputRadius,
      overflow: "hidden",
      marginBottom: isVerySmallScreen ? 14 : 18,

      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.08,
      shadowRadius: 14,
      elevation: 4,

      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.58)",
    },

    inputBlur: {
      flex: 1,
      borderRadius: inputRadius,
      overflow: "hidden",
    },

    inputBox: {
      flex: 1,
      width: "100%",
      height: inputHeight,
      borderRadius: inputRadius,
      paddingHorizontal: isVerySmallScreen ? 18 : 22,
      flexDirection: "row-reverse",
      alignItems: "center",
      overflow: "hidden",
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
      paddingVertical: isVerySmallScreen ? 8 : 10,
      zIndex: 999,
      elevation: 999,
    },

    forgotPasswordText: {
      color: "#871B17",
      fontSize: isVerySmallScreen ? 13.5 : 14,
      textAlign: "right",
      fontWeight: "900",
    },

    buttonsArea: {
      marginTop: "auto",
      paddingTop: isVerySmallScreen ? 20 : 28,
      zIndex: 8,
      gap: isVerySmallScreen ? 12 : 14,
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
      textAlign: "center",
      fontSize: isVerySmallScreen ? 18 : 20,
      fontWeight: "900",
      zIndex: 5,
    },

    registerButtonWrapper: {
      width: "100%",
      height: buttonHeight,
      borderRadius: buttonRadius,
      overflow: "hidden",

      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.1,
      shadowRadius: 15,
      elevation: 5,

      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.58)",
    },

    registerBlur: {
      flex: 1,
      borderRadius: buttonRadius,
      overflow: "hidden",
    },

    registerGradient: {
      flex: 1,
      borderRadius: buttonRadius,
      justifyContent: "center",
      alignItems: "center",
      overflow: "hidden",
      paddingHorizontal: 14,
    },

    registerText: {
      color: "#7C6A6A",
      fontSize: isVerySmallScreen ? 14.5 : 15.5,
      fontWeight: "700",
      textAlign: "center",
    },

    registerTextBold: {
      color: "#871B17",
      fontWeight: "900",
    },
  });
}