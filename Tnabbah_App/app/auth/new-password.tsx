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
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  StatusBar,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";
import { Feather, Ionicons } from "@expo/vector-icons";

const { height } = Dimensions.get("window");

const COLORS = {
  screenBackground: "#FFFFFF",

  primary: "#9A211C",
  primaryDark: "#761713",
  primaryText: "#871B17",

  title: "#7B1714",
  textDark: "#2C2C2C",
  inputText: "#2E1D1D",

  label: "#8C7A76",
  placeholder: "#B0A6A4",
  border: "rgba(205,205,205,0.95)",

  shadowGray: "#8E8E8E",
  white: "#FFFFFF",

  error: "#D32F2F",
  success: "#2E7D32",
};

export default function NewPasswordScreen() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [loading, setLoading] = useState(false);

  const isVerySmallScreen = height < 650;
  const isSmallScreen = height < 720;

  const backButtonSize = isVerySmallScreen ? 44 : 48;
  const backButtonRadius = backButtonSize / 2;

  const inputHeight = isVerySmallScreen ? 61 : 66;
  const inputRadius = inputHeight / 2;

  const buttonHeight = isVerySmallScreen ? 58 : 64;
  const buttonRadius = 30;

  const clearMessages = () => {
    setErrorMessage("");
    setSuccessMessage("");
  };

  const handleUpdatePassword = async () => {
    const cleanPassword = password.trim();
    const cleanConfirmPassword = confirmPassword.trim();

    if (!cleanPassword) {
      setErrorMessage("اكتب كلمة المرور الجديدة");
      return;
    }

    if (cleanPassword.length < 6) {
      setErrorMessage("كلمة المرور لازم تكون 6 أحرف أو أكثر");
      return;
    }

    if (!cleanConfirmPassword) {
      setErrorMessage("أكد كلمة المرور الجديدة");
      return;
    }

    if (cleanPassword !== cleanConfirmPassword) {
      setErrorMessage("كلمة المرور وتأكيدها غير متطابقين");
      return;
    }

    try {
      setLoading(true);
      clearMessages();

      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError) {
        console.log("getSession error:", sessionError.message);
        setErrorMessage("صار خطأ في جلسة تغيير كلمة المرور، اطلب رمز جديد");
        return;
      }

      if (!sessionData.session) {
        console.log("No recovery session found");
        setErrorMessage("انتهت جلسة تغيير كلمة المرور، اطلب رمز جديد");
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: cleanPassword,
      });

      if (updateError) {
        console.log("update password error:", updateError.message);
        setErrorMessage("ما قدرنا نحفظ كلمة المرور الجديدة، حاول مرة ثانية");
        return;
      }

      setPassword("");
      setConfirmPassword("");
      setSuccessMessage("تم حفظ كلمة المرور بنجاح");

      await AsyncStorage.removeItem("password_recovery_flow");
      await setPasswordRecoveryMode(false);

      setTimeout(() => {
        router.replace("/login" as any);
      }, 800);
    } catch (error) {
      console.log("new password error:", error);
      setErrorMessage("حدث خطأ غير متوقع، حاول مرة ثانية");
    } finally {
      setLoading(false);
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

    if (successMessage) {
      return (
        <View style={styles.messageBoxInfo}>
          <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
          <Text style={styles.messageTextInfo}>{successMessage}</Text>
        </View>
      );
    }

    return null;
  };

  return (
    <View style={styles.container}>
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
              style={[
                styles.backButtonWrapper,
                {
                  width: backButtonSize,
                  height: backButtonSize,
                  borderRadius: backButtonRadius,
                },
              ]}
              activeOpacity={0.85}
              onPress={() => router.back()}
              disabled={loading}
            >
              <Ionicons
                name="chevron-back"
                size={isVerySmallScreen ? 21 : 23}
                color={COLORS.shadowGray}
              />
            </TouchableOpacity>

            <View style={styles.content}>
              <Text style={styles.title}>تعيين كلمة المرور</Text>

              <Text style={styles.subtitle}>
                أدخل كلمة المرور الجديدة ثم أعيد إدخالها للتأكيد
              </Text>

              <View style={styles.formArea}>
                <View
                  style={[
                    styles.inputBox,
                    {
                      height: inputHeight,
                      borderRadius: inputRadius,
                    },
                    errorMessage.includes("الجديدة") && styles.inputBoxError,
                  ]}
                >
                  <Feather
                    name="lock"
                    size={isVerySmallScreen ? 21 : 22}
                    color={COLORS.primary}
                    style={styles.inputIcon}
                  />

                  <TextInput
                    style={[
                      styles.input,
                      {
                        minHeight: inputHeight - 8,
                      },
                    ]}
                    placeholder="كلمة المرور الجديدة"
                    placeholderTextColor={COLORS.placeholder}
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      clearMessages();
                    }}
                    textAlign="right"
                    autoCapitalize="none"
                    autoCorrect={false}
                    selectionColor={COLORS.primary}
                    returnKeyType="next"
                    editable={!loading}
                  />

                  <TouchableOpacity
                    style={styles.eyeButton}
                    activeOpacity={0.7}
                    onPress={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    <Ionicons
                      name={showPassword ? "eye-outline" : "eye-off-outline"}
                      size={isVerySmallScreen ? 21 : 22}
                      color={COLORS.primary}
                    />
                  </TouchableOpacity>
                </View>

                <View
                  style={[
                    styles.inputBox,
                    {
                      height: inputHeight,
                      borderRadius: inputRadius,
                    },
                    errorMessage.includes("تأكيدها") && styles.inputBoxError,
                  ]}
                >
                  <Feather
                    name="lock"
                    size={isVerySmallScreen ? 21 : 22}
                    color={COLORS.primary}
                    style={styles.inputIcon}
                  />

                  <TextInput
                    style={[
                      styles.input,
                      {
                        minHeight: inputHeight - 8,
                      },
                    ]}
                    placeholder="تأكيد كلمة المرور الجديدة"
                    placeholderTextColor={COLORS.placeholder}
                    secureTextEntry={!showConfirmPassword}
                    value={confirmPassword}
                    onChangeText={(text) => {
                      setConfirmPassword(text);
                      clearMessages();
                    }}
                    textAlign="right"
                    autoCapitalize="none"
                    autoCorrect={false}
                    selectionColor={COLORS.primary}
                    returnKeyType="done"
                    editable={!loading}
                  />

                  <TouchableOpacity
                    style={styles.eyeButton}
                    activeOpacity={0.7}
                    onPress={() =>
                      setShowConfirmPassword(!showConfirmPassword)
                    }
                    disabled={loading}
                  >
                    <Ionicons
                      name={
                        showConfirmPassword
                          ? "eye-outline"
                          : "eye-off-outline"
                      }
                      size={isVerySmallScreen ? 21 : 22}
                      color={COLORS.primary}
                    />
                  </TouchableOpacity>
                </View>

                {renderMessage()}
              </View>
            </View>

            <View style={styles.bottomArea}>
              <TouchableOpacity
                style={[
                  styles.mainButtonWrapper,
                  {
                    height: buttonHeight,
                    borderRadius: buttonRadius,
                  },
                  loading && styles.mainButtonDisabled,
                ]}
                onPress={handleUpdatePassword}
                disabled={loading}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={["rgba(154,33,28,0.98)", "rgba(118,23,19,0.98)"]}
                  start={{ x: 0.15, y: 0 }}
                  end={{ x: 0.9, y: 1 }}
                  style={[
                    styles.buttonGradient,
                    {
                      borderRadius: buttonRadius,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.buttonGlassTop,
                      {
                        borderTopLeftRadius: buttonRadius,
                        borderTopRightRadius: buttonRadius,
                      },
                    ]}
                  />

                  {loading ? (
                    <View style={styles.loadingRow}>
                      <ActivityIndicator size="small" color={COLORS.white} />
                      <Text style={styles.buttonText}>جاري الحفظ...</Text>
                    </View>
                  ) : (
                    <Text style={styles.buttonText}>حفظ كلمة المرور</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "hidden",
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
    minHeight: height,
    paddingHorizontal: 24,
    paddingBottom: height * 0.064,
    backgroundColor: COLORS.screenBackground,
  },

  backButtonWrapper: {
    position: "absolute",
    top: height * 0.105,
    left: 24,
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
    paddingTop: height * 0.19,
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
    marginTop: 15,
    marginBottom: 48,
    fontSize: height < 650 ? 15.5 : 17,
    color: COLORS.textDark,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: height < 650 ? 24 : 28,

    textShadowColor: "rgba(255,255,255,0.90)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 10,
  },

  formArea: {
    width: "100%",
  },

  inputBox: {
    width: "100%",
    marginBottom: 18,
    paddingHorizontal: height < 650 ? 16 : 18,
    flexDirection: "row-reverse",
    alignItems: "center",

    backgroundColor: COLORS.white,

    borderWidth: 1.7,
    borderColor: COLORS.border,

    shadowColor: COLORS.shadowGray,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: Platform.OS === "android" ? 0.16 : 0.22,
    shadowRadius: 4,
    elevation: 3,
  },

  inputBoxError: {
    borderColor: "rgba(154,33,28,0.35)",
    backgroundColor: "rgba(154,33,28,0.015)",
  },

  inputIcon: {
    marginLeft: height < 650 ? 11 : 13,
  },

  input: {
    flex: 1,
    fontSize: height < 650 ? 16.5 : 17.5,
    color: COLORS.inputText,
    fontWeight: "700",
    paddingVertical: 0,
  },

  eyeButton: {
    width: height < 650 ? 32 : 34,
    height: height < 650 ? 32 : 34,
    borderRadius: height < 650 ? 16 : 17,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },

  bottomArea: {
    marginTop: "auto",
    paddingTop: 28,
    zIndex: 8,
  },

  mainButtonWrapper: {
    width: "100%",
    overflow: "hidden",
    marginBottom: 22,

    shadowColor: "#6E1411",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: Platform.OS === "android" ? 0.18 : 0.24,
    shadowRadius: 14,
    elevation: 6,

    backgroundColor: COLORS.primary,
  },

  mainButtonDisabled: {
    opacity: 0.75,
  },

  buttonGradient: {
    flex: 1,
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
    backgroundColor: "rgba(255,255,255,0.10)",
    zIndex: 1,
  },

  loadingRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    zIndex: 5,
  },

  buttonText: {
    color: COLORS.white,
    textAlign: "center",
    fontSize: height < 650 ? 19 : 21,
    fontWeight: "900",
    zIndex: 5,
  },

  messageBoxError: {
    width: "100%",
    flexDirection: "row-reverse",
    alignItems: "center",
    marginTop: 0,
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
    marginTop: 0,
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