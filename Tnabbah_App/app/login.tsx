import { useCallback, useMemo, useRef, useState } from "react";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  useWindowDimensions,
  ActivityIndicator,
  Animated,
  Easing,
  StatusBar,
} from "react-native";
import { supabase } from "../lib/supabase";

import { LinearGradient } from "expo-linear-gradient";
import { Feather, Ionicons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

const COLORS = {
  screenBackground: "#FFFFFF",
  nextScreenBackground: "#FFFFFF",

  primary: "#9A211C",
  primaryDark: "#761713",
  primaryText: "#871B17",

  title: "#7B1714",
  textDark: "#2C2C2C",
  inputText: "#2E1D1D",

  label: "#8C7A76",
  muted: "#6C5B58",
  placeholder: "#B0A6A4",
  border: "rgba(205,205,205,0.95)",

  shadowGray: "#8E8E8E",
  white: "#FFFFFF",
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

type LoginRoute = "/register" | "/forgot-password" | "/connection-intro";

export default function LoginScreen() {
  const router = useRouter();

  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [loading, setLoading] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  const screenOpacity = useRef(new Animated.Value(0)).current;
  const screenTranslateY = useRef(new Animated.Value(10)).current;
  const transitionAnim = useRef(new Animated.Value(0)).current;
  const passwordInputRef = useRef<TextInput>(null);

  const isSmallScreen = height < 720;
  const isVerySmallScreen = height < 650;

  const horizontalPadding = clamp(width * 0.055, 18, 24);

  const backButtonSize = isVerySmallScreen ? 44 : 48;
  const backButtonRadius = backButtonSize / 2;

  const topSpacing = clamp(height * 0.012, 6, 12);
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
        width,
        height,
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
      width,
      height,
    ]
  );

  useFocusEffect(
    useCallback(() => {
      setIsNavigating(false);

      transitionAnim.setValue(0);
      screenOpacity.setValue(0);
      screenTranslateY.setValue(10);

      Animated.parallel([
        Animated.timing(screenOpacity, {
          toValue: 1,
          duration: 180,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(screenTranslateY, {
          toValue: 0,
          duration: 180,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();

      return () => { };
    }, [screenOpacity, screenTranslateY, transitionAnim])
  );

  const smoothPush = (path: LoginRoute) => {
    if (isNavigating) return;

    setIsNavigating(true);

    Animated.timing(transitionAnim, {
      toValue: 1,
      duration: 150,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      requestAnimationFrame(() => {
        router.push(path as any);
      });
    });
  };

  const smoothReplace = (path: LoginRoute) => {
    if (isNavigating) return;

    setIsNavigating(true);

    Animated.timing(transitionAnim, {
      toValue: 1,
      duration: 150,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      requestAnimationFrame(() => {
        router.replace(path as any);
      });
    });
  };

  const smoothBack = () => {
    if (isNavigating) return;

    setIsNavigating(true);

    Animated.timing(transitionAnim, {
      toValue: 1,
      duration: 150,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      requestAnimationFrame(() => {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace("/start" as any);
        }
      });
    });
  };

  const handleLogin = async () => {
    try {
      if (!email.trim()) {
        setErrorMessage("أدخلي البريد الإلكتروني");
        return;
      }

      if (!password.trim()) {
        setErrorMessage("أدخلي كلمة المرور");
        return;
      }

      setLoading(true);

      const cleanEmail = email.trim().toLowerCase();

      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        console.log("LOGIN ERROR:", error);

        const message = error.message?.toLowerCase() || "";
        const code = error.code?.toLowerCase() || "";
        const status = error.status;

        const isNotConfirmed =
          message.includes("email not confirmed") ||
          message.includes("email_not_confirmed") ||
          message.includes("not confirmed") ||
          code.includes("email_not_confirmed") ||
          status === 400;

        if (isNotConfirmed) {
          const { error: resendError } = await supabase.auth.resend({
            type: "signup",
            email: cleanEmail,
          });

          if (resendError) {
            console.log("RESEND VERIFY ERROR:", resendError);

            // حتى لو ما قدر يرسل كود جديد
            // دخليه صفحة التحقق عشان يستخدم الكود القديم
            router.push({
              pathname: "/verify-email",
              params: {
                email: cleanEmail,
                fullName: "",
                source: "login",
              },
            } as any);

            return;
          }

          router.push({
            pathname: "/verify-email",
            params: {
              email: cleanEmail,
              fullName: "",
              source: "login",
            },
          } as any);

          return;
        }

        setErrorMessage("البريد أو كلمة المرور غير صحيحة");
        return;
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        await supabase.auth.signOut();
        setErrorMessage("تعذر التحقق من الحساب، حاولي مرة أخرى");
        return;
      }

      if (!user.email_confirmed_at) {
        await supabase.auth.signOut();

        await supabase.auth.resend({
          type: "signup",
          email: cleanEmail,
        });

        router.push({
          pathname: "/verify-email",
          params: {
            email: cleanEmail,
            fullName: user.user_metadata?.full_name || "",
            source: "login",
          },
        } as any);

        return;
      }

      setErrorMessage("");

      if (data.session) {
        smoothReplace("/connection-intro");
      }
    } catch (err) {
      console.log("Login Error:", err);
      setErrorMessage("صار خطأ غير متوقع، حاولي مرة أخرى");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ gestureEnabled: false }} />

      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />

      <Animated.View
        style={[
          styles.animatedScreen,
          {
            opacity: screenOpacity,
            transform: [{ translateY: screenTranslateY }],
          },
        ]}
      >
        <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
          <KeyboardAvoidingView
            style={styles.keyboardAvoidingView}
            behavior="padding"
            keyboardVerticalOffset={0}
          >
            <View style={styles.screenContent}>
              {/* زر الرجوع فوق */}
              <View style={styles.backArea}>
                <TouchableOpacity
                  style={styles.backButtonWrapper}
                  activeOpacity={0.85}
                  onPress={smoothBack}
                  disabled={isNavigating || loading}
                >
                  <Ionicons
                    name="arrow-back-outline"
                    size={isVerySmallScreen ? 23 : 25}
                    color={COLORS.textDark}
                  />
                </TouchableOpacity>
              </View>

              {/* العنوان تحت زر الرجوع */}
              <View style={styles.titleArea}>
                <Text style={styles.title}>تسجيل الدخول</Text>

                <Text style={styles.subtitle}>مرحباً بك في تنبّه</Text>
              </View>

              {/* الفورم */}
              <View style={styles.formArea}>
                {/* البريد الإلكتروني */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.inputLabel}>البريد الإلكتروني</Text>

                  <View
                    style={[
                      styles.inputWrapper,
                      errorMessage.includes("البريد") &&
                      styles.inputWrapperError,
                    ]}
                  >
                    <Feather
                      name="mail"
                      size={isVerySmallScreen ? 20 : 21}
                      color={COLORS.primary}
                      style={styles.inputIcon}
                    />

                    <TextInput
                      style={styles.input}
                      placeholder="example@email.com"
                      placeholderTextColor={COLORS.placeholder}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      value={email}
                      onChangeText={(text) => {
                        setEmail(text);
                        setErrorMessage("");
                      }}
                      textAlign="right"
                      returnKeyType="next"
                      blurOnSubmit={false}
                      onSubmitEditing={() => passwordInputRef.current?.focus()}
                      editable={!loading && !isNavigating}
                      selectionColor={COLORS.primary}
                    />
                  </View>
                </View>

                {/* كلمة المرور */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.inputLabel}>كلمة المرور</Text>

                  <View
                    style={[
                      styles.inputWrapper,
                      errorMessage.includes("كلمة المرور") &&
                      styles.inputWrapperError,
                    ]}
                  >
                    <Feather
                      name="lock"
                      size={isVerySmallScreen ? 21 : 22}
                      color={COLORS.primary}
                      style={styles.inputIcon}
                    />

                    <TextInput
                      ref={passwordInputRef}
                      style={styles.input}
                      placeholder="••••••••"
                      placeholderTextColor={COLORS.placeholder}
                      secureTextEntry={!showPassword}
                      value={password}
                      onChangeText={(text) => {
                        setPassword(text);
                        setErrorMessage("");
                      }}
                      textAlign="right"
                      autoCapitalize="none"
                      autoCorrect={false}
                      returnKeyType="done"
                      onSubmitEditing={handleLogin}
                      editable={!loading && !isNavigating}
                      selectionColor={COLORS.primary}
                    />

                    <TouchableOpacity
                      style={styles.eyeButton}
                      activeOpacity={0.7}
                      onPress={() => setShowPassword(!showPassword)}
                      disabled={loading || isNavigating}
                    >
                      <Ionicons
                        name={
                          showPassword ? "eye-outline" : "eye-off-outline"
                        }
                        size={isVerySmallScreen ? 21 : 22}
                        color={COLORS.primary}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.forgotPasswordButton}
                  onPress={() => smoothPush("/forgot-password")}
                  disabled={isNavigating || loading}
                >
                  <Text style={styles.forgotPasswordText}>
                    نسيت كلمة المرور؟
                  </Text>
                </TouchableOpacity>

                {errorMessage ? (
                  <View style={styles.errorBox}>
                    <Ionicons
                      name="alert-circle"
                      size={isVerySmallScreen ? 18 : 19}
                      color={COLORS.primary}
                    />

                    <Text style={styles.errorText}>{errorMessage}</Text>
                  </View>
                ) : null}

                {/* زر تسجيل الدخول */}
                <TouchableOpacity
                  style={[
                    styles.loginButtonWrapper,
                    loading && styles.loginButtonDisabled,
                  ]}
                  onPress={handleLogin}
                  disabled={loading || isNavigating}
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

                    <View style={styles.loadingContent}>
                      {loading ? (
                        <ActivityIndicator
                          size="small"
                          color={COLORS.white}
                          style={styles.loadingSpinner}
                        />
                      ) : null}

                      <Text style={styles.loginText}>
                        {loading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
                      </Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {/* أو */}
              <View style={styles.orArea}>
                <View style={styles.orLine} />
                <Text style={styles.orText}>أو</Text>
                <View style={styles.orLine} />
              </View>

              {/* إنشاء حساب */}
              <View style={styles.registerTextArea}>
                <Text style={styles.registerText}>ليس لديك حساب؟ </Text>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => smoothPush("/register")}
                  disabled={isNavigating || loading}
                >
                  <Text style={styles.registerTextBold}>
                    إنشاء حساب جديد
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Animated.View>

      <Animated.View
        pointerEvents="none"
        style={[
          styles.transitionOverlay,
          {
            opacity: transitionAnim,
          },
        ]}
      />
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
  width,
  height,
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
  width: number;
  height: number;
}) {
  return StyleSheet.create({
    container: {
      flex: 1,
      overflow: "hidden",
      backgroundColor: COLORS.screenBackground,
    },

    animatedScreen: {
      flex: 1,
      backgroundColor: COLORS.screenBackground,
    },

    safeArea: {
      flex: 1,
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
      paddingHorizontal: horizontalPadding,
      paddingTop: topSpacing,
      paddingBottom: bottomSpacing,
      backgroundColor: COLORS.screenBackground,
    },

    backArea: {
      width: "100%",
      paddingTop: safeTop + 2,
      alignItems: "flex-start",
      justifyContent: "center",
      marginBottom: isVerySmallScreen ? 12 : 16,
    },

    backButtonWrapper: {
      width: backButtonSize,
      height: backButtonSize,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "transparent",
      borderWidth: 0,
      shadowOpacity: 0,
      elevation: 0,
    },

    titleArea: {
      width: "100%",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: isVerySmallScreen ? 20 : isSmallScreen ? 24 : 28,
      paddingHorizontal: clamp(width * 0.02, 8, 14),
    },

    title: {
      fontSize: isVerySmallScreen ? 22 : isSmallScreen ? 24 : 25,
      fontWeight: "900",
      color: COLORS.title,
      textAlign: "center",
      letterSpacing: -0.4,
      lineHeight: isVerySmallScreen ? 32 : 35,

      textShadowColor: "rgba(255,255,255,0.95)",
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 12,
      includeFontPadding: false,
    },

    subtitle: {
      marginTop: isVerySmallScreen ? 12 : 15,
      fontSize: isVerySmallScreen ? 16 : 17.5,
      lineHeight: isVerySmallScreen ? 25 : 28,
      color: COLORS.textDark,
      fontWeight: "800",
      textAlign: "center",
      textShadowColor: "rgba(255,255,255,0.90)",
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 10,
      includeFontPadding: false,
    },

    formArea: {
      width: "100%",
      paddingHorizontal: 2,
    },

    fieldGroup: {
      width: "100%",
      marginBottom: isVerySmallScreen ? 14 : 16,
    },

    inputLabel: {
      color: COLORS.label,
      fontSize: isVerySmallScreen ? 14.5 : 15.5,
      fontWeight: "800",
      textAlign: "right",
      marginBottom: 10,
      includeFontPadding: false,
    },

    inputWrapper: {
      width: "100%",
      height: inputHeight,
      borderRadius: inputRadius,

      backgroundColor: COLORS.white,

      borderWidth: 1.7,
      borderColor: COLORS.border,

      paddingHorizontal: isVerySmallScreen ? 16 : 18,
      flexDirection: "row-reverse",
      alignItems: "center",

      shadowColor: COLORS.shadowGray,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.18,
      shadowRadius: 4,
      elevation: 3,
    },

    inputWrapperError: {
      borderColor: "rgba(154,33,28,0.35)",
      backgroundColor: "rgba(154,33,28,0.015)",
    },

    inputIcon: {
      marginLeft: isVerySmallScreen ? 11 : 13,
    },

    input: {
      flex: 1,
      fontSize: isVerySmallScreen ? 16.5 : 17.5,
      color: COLORS.inputText,
      fontWeight: "700",
      paddingVertical: 0,
      minHeight: inputHeight - 8,
      textAlignVertical: "center",
      includeFontPadding: false,
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
      marginRight: 12,

      marginTop: isVerySmallScreen ? -5 : -7,
      marginBottom: isVerySmallScreen ? 14 : 16,

      paddingVertical: 6,
      zIndex: 20,
      elevation: 20,
    },

    forgotPasswordText: {
      color: COLORS.primary,
      fontSize: isVerySmallScreen ? 14.5 : 15.2,
      textAlign: "right",
      fontWeight: "900",
      includeFontPadding: false,
    },

    errorBox: {
      width: "100%",
      flexDirection: "row-reverse",
      alignItems: "center",
      justifyContent: "flex-start",

      marginTop: isVerySmallScreen ? -5 : -6,
      marginBottom: isVerySmallScreen ? 18 : 22,

      paddingHorizontal: isVerySmallScreen ? 14 : 16,
      paddingVertical: isVerySmallScreen ? 10 : 12,

      borderRadius: 22,

      backgroundColor: "rgba(154,33,28,0.07)",
      borderWidth: 1.2,
      borderColor: "rgba(154,33,28,0.16)",

      shadowColor: COLORS.shadowGray,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,

      gap: 8,
    },

    errorText: {
      flex: 1,
      color: COLORS.primary,
      fontSize: isVerySmallScreen ? 13.2 : 14,
      fontWeight: "800",
      textAlign: "right",
      lineHeight: isVerySmallScreen ? 20 : 22,
      includeFontPadding: false,
    },

    loginButtonWrapper: {
      width: "100%",
      height: buttonHeight,
      borderRadius: buttonRadius,
      overflow: "hidden",

      shadowColor: "#6E1411",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 14,
      elevation: 6,
      backgroundColor: COLORS.primary,
    },

    loginButtonDisabled: {
      opacity: 0.72,
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

    loadingContent: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 5,
    },

    loadingSpinner: {
      marginRight: 8,
      transform: [{ scale: isVerySmallScreen ? 0.85 : 0.95 }],
    },

    loginText: {
      color: COLORS.white,
      fontSize: isVerySmallScreen ? 19 : 21,
      fontWeight: "900",
      textAlign: "center",
      includeFontPadding: false,
    },

    orArea: {
      marginTop: isVerySmallScreen ? 22 : 26,
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
      color: COLORS.label,
      fontSize: isVerySmallScreen ? 15.5 : 16.5,
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
      color: COLORS.muted,
      fontSize: isVerySmallScreen ? 15 : 16,
      fontWeight: "700",
      textAlign: "center",
      includeFontPadding: false,
    },

    registerTextBold: {
      color: COLORS.primary,
      fontSize: isVerySmallScreen ? 15 : 16,
      fontWeight: "900",
      textAlign: "center",
      includeFontPadding: false,
    },

    transitionOverlay: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 100,
      backgroundColor: COLORS.nextScreenBackground,
    },
  });
}