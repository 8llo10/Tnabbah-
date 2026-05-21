import { useCallback, useMemo, useRef, useState } from "react";
import { Stack, useFocusEffect, useRouter } from "expo-router";
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
  success: "#2E7D32",
  white: "#FFFFFF",
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

type RegisterRoute = "/login" | "/connection-intro" | "/start";

export default function RegisterScreen() {
  const router = useRouter();

  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const [fullName, setFullName] = useState("");
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

  const inputHeight = isVerySmallScreen ? 56 : 60;
  const inputRadius = inputHeight / 2;

  const buttonHeight = isVerySmallScreen ? 54 : 58;
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

  const passwordChecks = useMemo(() => {
    const digitCount = (password.match(/[0-9]/g) || []).length;

    return {
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasSixDigits: digitCount >= 6,
      hasSpecialCharacter: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password),
    };
  }, [password]);

  const isPasswordValid =
    passwordChecks.hasUpperCase &&
    passwordChecks.hasLowerCase &&
    passwordChecks.hasSixDigits &&
    passwordChecks.hasSpecialCharacter;

  const showPasswordRules = password.length > 0 && !isPasswordValid;

  const passwordRules = [
    {
      key: "uppercase",
      label: "حرف كبير واحد على الأقل A-Z",
      valid: passwordChecks.hasUpperCase,
    },
    {
      key: "lowercase",
      label: "حرف صغير واحد على الأقل a-z",
      valid: passwordChecks.hasLowerCase,
    },
    {
      key: "sixDigits",
      label: "6 أرقام على الأقل من 0-9",
      valid: passwordChecks.hasSixDigits,
    },
    {
      key: "special",
      label: "رمز خاص واحد على الأقل مثل @ # ! %",
      valid: passwordChecks.hasSpecialCharacter,
    },
  ];

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

  const smoothPush = (path: RegisterRoute) => {
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

  const smoothReplace = (path: RegisterRoute) => {
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

  const validatePassword = () => {
    if (!password.trim()) {
      setErrorMessage("اكتب كلمة المرور");
      return false;
    }

    if (!isPasswordValid) {
      setErrorMessage("كلمة المرور لا تحقق المتطلبات");
      return false;
    }

    setErrorMessage("");
    return true;
  };

  const handleRegister = async () => {
    try {
      if (!fullName.trim()) {
        setErrorMessage("أدخل الاسم الكامل");
        return;
      }

      if (!email.trim()) {
        setErrorMessage("أدخل البريد الإلكتروني");
        return;
      }

      if (!validatePassword()) {
        return;
      }

      setLoading(true);

      const cleanName = fullName.trim();
      const cleanEmail = email.trim().toLowerCase();

      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: cleanName,
          },
        },
      });

      if (error) {
        console.log("REGISTER ERROR:", error);

        const message = error.message?.toLowerCase() || "";

        // إذا الحساب موجود لكنه غير متحقق
        if (
          message.includes("already registered") ||
          message.includes("already exists") ||
          message.includes("user already registered")
        ) {
          await supabase.auth.resend({
            type: "signup",
            email: cleanEmail,
          });

          router.push({
            pathname: "/verify-email",
            params: {
              email: cleanEmail,
              fullName: cleanName,
              source: "register",
            },
          } as any);

          return;
        }

        setErrorMessage(error.message);
        return;
      }

      setPassword("");
      setErrorMessage("");

      router.push({
        pathname: "/verify-email",
        params: {
          email: cleanEmail,
          fullName: cleanName,
          source: "register",
        },
      } as any);

    } catch (err) {
      console.log(err);
      setErrorMessage("صار خطأ غير متوقع، حاول مرة أخرى");
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
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
          >
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              keyboardDismissMode="interactive"
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
                  <Text style={styles.title}>إنشاء حساب جديد</Text>

                  <Text style={styles.subtitle}>
                    انضمّ إلى تنبّه وابدء متابعة سيارتك
                  </Text>
                </View>

                <View style={styles.formArea}>
                  <View style={styles.fieldGroup}>
                    <Text style={styles.inputLabel}>الاسم الكامل</Text>

                    <View
                      style={[
                        styles.inputWrapper,
                        errorMessage.includes("الاسم") &&
                        styles.inputWrapperError,
                      ]}
                    >
                      <Feather
                        name="user"
                        size={isVerySmallScreen ? 20 : 21}
                        color={COLORS.primary}
                        style={styles.inputIcon}
                      />

                      <TextInput
                        style={styles.input}
                        placeholder="اكتب الاسم الكامل"
                        placeholderTextColor={COLORS.placeholder}
                        value={fullName}
                        onChangeText={(text) => {
                          setFullName(text);
                          setErrorMessage("");
                        }}
                        textAlign="right"
                        returnKeyType="next"
                        editable={!loading && !isNavigating}
                        selectionColor={COLORS.primary}
                      />
                    </View>
                  </View>

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

                    {showPasswordRules ? (
                      <View style={styles.passwordRulesBox}>
                        <Text style={styles.passwordRulesTitle}>
                          كلمة المرور يجب أن تحتوي على:
                        </Text>

                        {passwordRules.map((rule) => (
                          <View key={rule.key} style={styles.passwordRuleRow}>
                            <Ionicons
                              name={
                                rule.valid
                                  ? "checkmark-circle"
                                  : "close-circle-outline"
                              }
                              size={isVerySmallScreen ? 17 : 18}
                              color={
                                rule.valid
                                  ? COLORS.success
                                  : COLORS.primary
                              }
                              style={styles.passwordRuleIcon}
                            />

                            <Text
                              style={[
                                styles.passwordRuleText,
                                rule.valid && styles.passwordRuleTextValid,
                              ]}
                            >
                              {rule.label}
                            </Text>
                          </View>
                        ))}
                      </View>
                    ) : null}
                  </View>

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

                  <TouchableOpacity
                    style={[
                      styles.registerButtonWrapper,
                      loading && styles.registerButtonDisabled,
                    ]}
                    onPress={handleRegister}
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
                      style={styles.registerGradient}
                    >
                      <View style={styles.registerShine} />

                      <View style={styles.loadingContent}>
                        {loading ? (
                          <ActivityIndicator
                            size="small"
                            color={COLORS.white}
                            style={styles.loadingSpinner}
                          />
                        ) : null}

                        <Text style={styles.registerButtonText}>
                          {loading ? "جاري التسجيل..." : "تسجيل حساب جديد"}
                        </Text>
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>

                <View style={styles.orArea}>
                  <View style={styles.orLine} />
                  <Text style={styles.orText}>أو</Text>
                  <View style={styles.orLine} />
                </View>

                <View style={styles.loginTextArea}>
                  <Text style={styles.loginLightText}>لديك حساب بالفعل؟ </Text>

                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => smoothPush("/login")}
                    disabled={isNavigating || loading}
                  >
                    <Text style={styles.loginBoldText}>تسجيل الدخول</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
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

    fixedContent: {
      flex: 1,
      backgroundColor: COLORS.screenBackground,
    },

    screenContent: {
      flex: 1,
      paddingHorizontal: horizontalPadding,
      paddingTop: topSpacing,
      paddingBottom: bottomSpacing,
      minHeight: 0,
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
      marginBottom: isVerySmallScreen ? 18 : isSmallScreen ? 22 : 26,
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
    },

    subtitle: {
      marginTop: isVerySmallScreen ? 8 : 10,
      fontSize: isVerySmallScreen ? 16 : 17.5,
      lineHeight: isVerySmallScreen ? 25 : 28,
      color: COLORS.textDark,
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
      marginBottom: isVerySmallScreen ? 12 : 14,
    },

    inputLabel: {
      color: COLORS.label,
      fontSize: isVerySmallScreen ? 14.5 : 15.5,
      fontWeight: "800",
      textAlign: "right",
      marginBottom: 10,
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
    },

    eyeButton: {
      width: isVerySmallScreen ? 32 : 34,
      height: isVerySmallScreen ? 32 : 34,
      borderRadius: isVerySmallScreen ? 16 : 17,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 8,
    },

    passwordRulesBox: {
      width: "100%",
      marginTop: 8,
      paddingHorizontal: isVerySmallScreen ? 14 : 16,
      paddingVertical: isVerySmallScreen ? 9 : 10,
      borderRadius: 20,
      backgroundColor: "rgba(154,33,28,0.045)",
      borderWidth: 1.2,
      borderColor: "rgba(154,33,28,0.14)",
    },

    passwordRulesTitle: {
      color: COLORS.primary,
      fontSize: isVerySmallScreen ? 13.5 : 14.3,
      fontWeight: "900",
      textAlign: "right",
      marginBottom: 8,
      lineHeight: isVerySmallScreen ? 20 : 22,
    },

    passwordRuleRow: {
      flexDirection: "row-reverse",
      alignItems: "center",
      justifyContent: "flex-start",
      marginTop: 6,
    },

    passwordRuleIcon: {
      marginLeft: 8,
    },

    passwordRuleText: {
      flex: 1,
      color: COLORS.primary,
      fontSize: isVerySmallScreen ? 12.8 : 13.5,
      fontWeight: "800",
      textAlign: "right",
      lineHeight: isVerySmallScreen ? 19 : 21,
    },

    passwordRuleTextValid: {
      color: COLORS.success,
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
      shadowOpacity: 0.09,
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
    },

    registerButtonWrapper: {
      width: "100%",
      height: buttonHeight,
      borderRadius: buttonRadius,
      overflow: "hidden",
      shadowColor: "#6E1411",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.21,
      shadowRadius: 14,
      elevation: 6,
      backgroundColor: COLORS.primary,
    },

    registerButtonDisabled: {
      opacity: 0.72,
    },

    registerGradient: {
      flex: 1,
      borderRadius: buttonRadius,
      justifyContent: "center",
      alignItems: "center",
      overflow: "hidden",
    },

    registerShine: {
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

    registerButtonText: {
      color: COLORS.white,
      fontSize: isVerySmallScreen ? 19 : 21,
      fontWeight: "900",
      textAlign: "center",
    },

    orArea: {
      marginTop: isVerySmallScreen ? 18 : 22,
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

    loginTextArea: {
      marginTop: isVerySmallScreen ? 10 : 12,
      flexDirection: "row-reverse",
      alignItems: "center",
      justifyContent: "center",
      flexWrap: "wrap",
    },

    loginLightText: {
      color: COLORS.muted,
      fontSize: isVerySmallScreen ? 15 : 16,
      fontWeight: "700",
      textAlign: "center",
    },

    loginBoldText: {
      color: COLORS.primary,
      fontSize: isVerySmallScreen ? 15 : 16,
      fontWeight: "900",
      textAlign: "center",
    },

    transitionOverlay: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 100,
      backgroundColor: COLORS.nextScreenBackground,
    },
  });
}