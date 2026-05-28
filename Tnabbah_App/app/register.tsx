import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  useWindowDimensions,
  ActivityIndicator,
  Animated,
  Easing,
  StatusBar,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { supabase } from "../lib/supabase";
import { LinearGradient } from "expo-linear-gradient";
import { Feather, Ionicons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useLanguage } from "../providers/LanguageProvider";

const COLORS = {
  screenBackground: "#FFFFFF",
  nextScreenBackground: "#FFFFFF",

  primary: "#9A211C",
  primaryDark: "#761713",
  primaryText: "#871B17",

  title: "#7B1714",
  textDark: "#2C2C2C",
  inputText: "#2E1D1D",

  label: "#6C5B58",
  muted: "#6C5B58",
  placeholder: "#A8A8A8",
  border: "#DCDCDC",

  shadowGray: "#000000",
  success: "#2E7D32",
  white: "#FFFFFF",

  rulesBackground: "#F5F5F5",
  rulesBorder: "rgba(170,170,170,0.55)",
  rulesText: "#6C5B58",
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

type RegisterRoute = "/login" | "/start";

type FieldErrors = {
  fullName?: string;
  email?: string;
  password?: string;
};

export default function RegisterScreen() {
  const router = useRouter();
  const { t, isArabic } = useLanguage();

  const textAlign = isArabic ? "right" : "left";
  const rowDirection = isArabic ? "row-reverse" : "row";
  const iconMargin = isArabic ? { marginLeft: 10 } : { marginRight: 10 };
  const eyeMargin = isArabic ? { marginRight: 8 } : { marginLeft: 8 };
  const ruleIconMargin = isArabic ? { marginLeft: 7 } : { marginRight: 7 };

  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const [loading, setLoading] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  const screenOpacity = useRef(new Animated.Value(0)).current;
  const screenTranslateY = useRef(new Animated.Value(10)).current;
  const transitionAnim = useRef(new Animated.Value(0)).current;
  const keyboardTranslateY = useRef(new Animated.Value(0)).current;

  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);

  const isSmallScreen = height < 720;
  const isVerySmallScreen = height < 650;
  const isTabletLike = width >= 768;

  const horizontalPadding = isTabletLike
    ? 24
    : clamp(width * 0.055, 18, 24);

  const backButtonSize = isVerySmallScreen ? 42 : 46;
  const backButtonRadius = backButtonSize / 2;

  const topSpacing = clamp(height * 0.01, 5, 10);
  const bottomSpacing = clamp(height * 0.018, 10, 18);

  const inputHeight = isVerySmallScreen ? 53 : 57;
  const inputRadius = inputHeight / 2;

  const buttonHeight = isVerySmallScreen ? 52 : 56;
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
        isTabletLike,
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
      isTabletLike,
      insets.top,
      width,
      height,
    ]
  );

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const keyboardShift = isVerySmallScreen ? -125 : isSmallScreen ? -108 : -90;

    const showSubscription = Keyboard.addListener(showEvent, () => {
      Animated.timing(keyboardTranslateY, {
        toValue: keyboardShift,
        duration: 180,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
    });

    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      Animated.timing(keyboardTranslateY, {
        toValue: 0,
        duration: 180,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [keyboardTranslateY, isSmallScreen, isVerySmallScreen]);

  const passwordChecks = useMemo(() => {
    const digitCount = (password.match(/[0-9]/g) || []).length;

    return {
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasSixDigits: digitCount >= 6,
      hasSpecialCharacter:
        /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password),
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
      label: t.passwordRuleUppercase,
      valid: passwordChecks.hasUpperCase,
    },
    {
      key: "lowercase",
      label: t.passwordRuleLowercase,
      valid: passwordChecks.hasLowerCase,
    },
    {
      key: "sixDigits",
      label: t.passwordRuleSixDigits,
      valid: passwordChecks.hasSixDigits,
    },
    {
      key: "special",
      label: t.passwordRuleSpecial,
      valid: passwordChecks.hasSpecialCharacter,
    },
  ];

  useFocusEffect(
    useCallback(() => {
      setIsNavigating(false);

      transitionAnim.setValue(0);
      screenOpacity.setValue(0);
      screenTranslateY.setValue(10);
      keyboardTranslateY.setValue(0);

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

      return () => {};
    }, [screenOpacity, screenTranslateY, transitionAnim, keyboardTranslateY])
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

  const clearFieldError = (field: keyof FieldErrors) => {
    setFieldErrors((prev) => ({
      ...prev,
      [field]: undefined,
    }));
  };

  const validateForm = () => {
    const errors: FieldErrors = {};

    if (!fullName.trim()) {
      errors.fullName = t.enterFullName;
    }

    if (!email.trim()) {
      errors.email = t.enterEmail;
    } else if (!email.includes("@") || !email.includes(".")) {
      errors.email = t.enterValidEmail;
    }

    if (!password.trim()) {
      errors.password = t.writePassword;
    } else if (!isPasswordValid) {
      errors.password = t.passwordRequirementsError;
    }

    setFieldErrors(errors);

    return Object.keys(errors).length === 0;
  };

  const handleRegister = async () => {
    try {
      if (!validateForm()) {
        return;
      }

      setLoading(true);

      const cleanName = fullName.trim();
      const cleanEmail = email.trim().toLowerCase();

      const { error } = await supabase.auth.signUp({
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

        setFieldErrors({
          email: error.message || t.registerEmailError,
        });

        return;
      }

      setPassword("");
      setFieldErrors({});

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
      setFieldErrors({
        password: t.registerUnexpectedError,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
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
            <View style={styles.screenContent}>
              <View style={styles.innerContent}>
                <Animated.View
                  style={[
                    styles.topArea,
                    {
                      transform: [{ translateY: keyboardTranslateY }],
                    },
                  ]}
                >
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

                  <View style={styles.titleArea}>
                    <Text style={styles.title}>{t.registerTitle}</Text>

                    <Text style={styles.subtitle}>{t.registerSubtitle}</Text>
                  </View>

                  <View style={styles.formArea}>
                    <View style={styles.fieldGroup}>
                      <Text style={[styles.inputLabel, { textAlign }]}>
                        {t.fullName}
                      </Text>

                      <View
                        style={[
                          styles.inputWrapper,
                          { flexDirection: rowDirection },
                          fieldErrors.fullName && styles.inputWrapperError,
                        ]}
                      >
                        <Feather
                          name="user"
                          size={isVerySmallScreen ? 19 : 20}
                          color={COLORS.primary}
                          style={[styles.inputIcon, iconMargin]}
                        />

                        <TextInput
                          style={[styles.input, { textAlign }]}
                          placeholder={t.fullNamePlaceholder}
                          placeholderTextColor={COLORS.placeholder}
                          value={fullName}
                          onChangeText={(text) => {
                            setFullName(text);
                            clearFieldError("fullName");
                          }}
                          returnKeyType="done"
                          editable={!loading && !isNavigating}
                          selectionColor={COLORS.primary}
                        />
                      </View>

                      {fieldErrors.fullName ? (
                        <View
                          style={[
                            styles.fieldErrorRow,
                            { flexDirection: rowDirection },
                          ]}
                        >
                          <Ionicons
                            name="alert-circle"
                            size={14}
                            color={COLORS.primary}
                            style={iconMargin}
                          />
                          <Text style={[styles.fieldErrorText, { textAlign }]}>
                            {fieldErrors.fullName}
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    <View style={styles.fieldGroup}>
                      <Text style={[styles.inputLabel, { textAlign }]}>
                        {t.email}
                      </Text>

                      <View
                        style={[
                          styles.inputWrapper,
                          { flexDirection: rowDirection },
                          fieldErrors.email && styles.inputWrapperError,
                        ]}
                      >
                        <Feather
                          name="mail"
                          size={isVerySmallScreen ? 19 : 20}
                          color={COLORS.primary}
                          style={[styles.inputIcon, iconMargin]}
                        />

                        <TextInput
                          ref={emailInputRef}
                          style={[styles.input, { textAlign }]}
                          placeholder="example@email.com"
                          placeholderTextColor={COLORS.placeholder}
                          keyboardType="email-address"
                          autoCapitalize="none"
                          autoCorrect={false}
                          value={email}
                          onChangeText={(text) => {
                            setEmail(text);
                            clearFieldError("email");
                          }}
                          returnKeyType="next"
                          blurOnSubmit={false}
                          onSubmitEditing={() =>
                            passwordInputRef.current?.focus()
                          }
                          editable={!loading && !isNavigating}
                          selectionColor={COLORS.primary}
                        />
                      </View>

                      {fieldErrors.email ? (
                        <View
                          style={[
                            styles.fieldErrorRow,
                            { flexDirection: rowDirection },
                          ]}
                        >
                          <Ionicons
                            name="alert-circle"
                            size={14}
                            color={COLORS.primary}
                            style={iconMargin}
                          />
                          <Text style={[styles.fieldErrorText, { textAlign }]}>
                            {fieldErrors.email}
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    <View style={styles.passwordSection}>
                      <Text style={[styles.inputLabel, { textAlign }]}>
                        {t.password}
                      </Text>

                      <View
                        style={[
                          styles.inputWrapper,
                          { flexDirection: rowDirection },
                          fieldErrors.password && styles.inputWrapperError,
                        ]}
                      >
                        <Feather
                          name="lock"
                          size={isVerySmallScreen ? 20 : 21}
                          color={COLORS.primary}
                          style={[styles.inputIcon, iconMargin]}
                        />

                        <TextInput
                          ref={passwordInputRef}
                          style={[styles.input, { textAlign }]}
                          placeholder="••••••••"
                          placeholderTextColor={COLORS.placeholder}
                          secureTextEntry={!showPassword}
                          value={password}
                          onChangeText={(text) => {
                            setPassword(text);
                            clearFieldError("password");
                          }}
                          autoCapitalize="none"
                          autoCorrect={false}
                          returnKeyType="done"
                          editable={!loading && !isNavigating}
                          selectionColor={COLORS.primary}
                        />

                        <TouchableOpacity
                          style={[styles.eyeButton, eyeMargin]}
                          activeOpacity={0.7}
                          onPress={() => setShowPassword(!showPassword)}
                          disabled={loading || isNavigating}
                        >
                          <Ionicons
                            name={
                              showPassword ? "eye-outline" : "eye-off-outline"
                            }
                            size={isVerySmallScreen ? 20 : 21}
                            color={COLORS.primary}
                          />
                        </TouchableOpacity>
                      </View>

                      {fieldErrors.password ? (
                        <View
                          style={[
                            styles.fieldErrorRow,
                            { flexDirection: rowDirection },
                          ]}
                        >
                          <Ionicons
                            name="alert-circle"
                            size={14}
                            color={COLORS.primary}
                            style={iconMargin}
                          />
                          <Text style={[styles.fieldErrorText, { textAlign }]}>
                            {fieldErrors.password}
                          </Text>
                        </View>
                      ) : null}

                      <View
                        style={[
                          styles.passwordRulesBox,
                          !showPasswordRules && styles.passwordRulesBoxHidden,
                        ]}
                        pointerEvents={showPasswordRules ? "auto" : "none"}
                      >
                        <Text style={[styles.passwordRulesTitle, { textAlign }]}>
                          {t.passwordRulesTitle}
                        </Text>

                        {passwordRules.map((rule) => (
                          <View
                            key={rule.key}
                            style={[
                              styles.passwordRuleRow,
                              { flexDirection: rowDirection },
                            ]}
                          >
                            <Ionicons
                              name={
                                rule.valid
                                  ? "checkmark-circle"
                                  : "close-circle-outline"
                              }
                              size={isVerySmallScreen ? 15 : 16}
                              color={
                                rule.valid ? COLORS.success : COLORS.rulesText
                              }
                              style={ruleIconMargin}
                            />

                            <Text
                              style={[
                                styles.passwordRuleText,
                                { textAlign },
                                rule.valid && styles.passwordRuleTextValid,
                              ]}
                            >
                              {rule.label}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </View>
                </Animated.View>

                <View style={styles.bottomArea}>
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
                      <View style={styles.loginShine} />
                      <View style={styles.loadingContent}>
                        {loading ? (
                          <ActivityIndicator
                            size="small"
                            color={COLORS.white}
                            style={styles.loadingSpinner}
                          />
                        ) : null}

                        <Text style={styles.registerButtonText}>
                          {loading ? t.registering : t.registerButton}
                        </Text>
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>

                  <View style={styles.orArea}>
                    <View style={styles.orLine} />
                    <Text style={styles.orText}>{t.or}</Text>
                    <View style={styles.orLine} />
                  </View>

                  <View
                    style={[
                      styles.loginTextArea,
                      { flexDirection: isArabic ? "row-reverse" : "row" },
                    ]}
                  >
                    <Text style={styles.loginLightText}>
                      {t.alreadyHaveAccount}{" "}
                    </Text>

                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => smoothPush("/login")}
                      disabled={isNavigating || loading}
                    >
                      <Text style={styles.loginBoldText}>{t.login}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
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
    </TouchableWithoutFeedback>
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
  isTabletLike,
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
  isTabletLike: boolean;
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

    screenContent: {
      flex: 1,
      paddingHorizontal: horizontalPadding,
      paddingTop: topSpacing,
      paddingBottom: bottomSpacing,
      backgroundColor: COLORS.screenBackground,
      alignItems: "center",
    },

    innerContent: {
      flex: 1,
      width: "100%",
      maxWidth: 430,
      alignSelf: "center",
      justifyContent: "space-between",
    },

    topArea: {
      width: "100%",
      flexShrink: 1,
    },

    backArea: {
      width: "100%",
      paddingTop: safeTop + 2,
      alignItems: "flex-start",
      justifyContent: "center",
      marginBottom: isVerySmallScreen ? 8 : 12,
    },

    backButtonWrapper: {
      width: backButtonSize,
      height: backButtonSize,
      borderRadius: backButtonRadius,
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
      marginBottom: isVerySmallScreen
        ? 18
        : isSmallScreen
        ? 22
        : isTabletLike
        ? 34
        : 28,
      paddingHorizontal: clamp(width * 0.02, 8, 14),
    },

    title: {
      fontSize: isVerySmallScreen ? 21 : isSmallScreen ? 23 : 24,
      fontWeight: "900",
      color: COLORS.title,
      textAlign: "center",
      letterSpacing: -0.4,
      lineHeight: isVerySmallScreen ? 29 : 32,
      textShadowColor: "rgba(255,255,255,0.95)",
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 12,
    },

    subtitle: {
      marginTop: isVerySmallScreen ? 5 : 7,
      fontSize: isVerySmallScreen ? 14.5 : 15.5,
      lineHeight: isVerySmallScreen ? 21 : 23,
      color: COLORS.placeholder,
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
      marginBottom: isVerySmallScreen ? 8 : 10,
    },

    inputLabel: {
      color: COLORS.label,
      fontSize: isVerySmallScreen ? 13.5 : 14.5,
      fontWeight: "800",
      textAlign: "right",
      marginBottom: 6,
    },

    inputWrapper: {
      width: "100%",
      height: inputHeight,
      borderRadius: 22,
      backgroundColor: COLORS.white,
      borderWidth: 1,
      borderColor: COLORS.border,
      paddingHorizontal: isVerySmallScreen ? 14 : 16,
      alignItems: "center",
      shadowColor: COLORS.shadowGray,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: Platform.OS === "android" ? 0.05 : 0.035,
      shadowRadius: 6,
      elevation: 1,
    },

    inputWrapperError: {
      borderColor: "rgba(135,27,23,0.42)",
      backgroundColor: "rgba(135,27,23,0.025)",
    },

    inputIcon: {
      marginLeft: 0,
      marginRight: 0,
    },

    input: {
      flex: 1,
      fontSize: isVerySmallScreen ? 15.5 : 16.5,
      color: COLORS.inputText,
      fontWeight: "700",
      paddingVertical: 0,
      minHeight: inputHeight - 8,
    },

    eyeButton: {
      width: isVerySmallScreen ? 30 : 32,
      height: isVerySmallScreen ? 30 : 32,
      borderRadius: isVerySmallScreen ? 15 : 16,
      justifyContent: "center",
      alignItems: "center",
    },

    fieldErrorRow: {
      marginTop: 6,
      alignItems: "center",
      justifyContent: "flex-start",
      paddingHorizontal: 8,
    },

    fieldErrorText: {
      flex: 1,
      color: COLORS.primary,
      fontSize: isVerySmallScreen ? 12.2 : 13,
      fontWeight: "800",
      textAlign: "right",
      lineHeight: isVerySmallScreen ? 17 : 19,
    },

    passwordSection: {
      width: "100%",
      marginBottom: 0,
    },

    passwordRulesBox: {
      width: "100%",
      height: isVerySmallScreen ? 116 : 126,
      marginTop: 7,
      paddingHorizontal: isVerySmallScreen ? 12 : 14,
      paddingVertical: isVerySmallScreen ? 7 : 8,
      borderRadius: 17,
      backgroundColor: COLORS.rulesBackground,
      borderWidth: 1.1,
      borderColor: COLORS.rulesBorder,
      overflow: "hidden",
    },

    passwordRulesBoxHidden: {
      opacity: 0,
    },

    passwordRulesTitle: {
      color: COLORS.rulesText,
      fontSize: isVerySmallScreen ? 12.2 : 13,
      fontWeight: "900",
      textAlign: "right",
      marginBottom: 5,
      lineHeight: isVerySmallScreen ? 17 : 19,
    },

    passwordRuleRow: {
      alignItems: "center",
      justifyContent: "flex-start",
      marginTop: 4,
    },

    passwordRuleText: {
      flex: 1,
      color: COLORS.rulesText,
      fontSize: isVerySmallScreen ? 11.3 : 12.1,
      fontWeight: "800",
      textAlign: "right",
      lineHeight: isVerySmallScreen ? 16 : 18,
    },

    passwordRuleTextValid: {
      color: COLORS.success,
    },

    bottomArea: {
      marginTop: isVerySmallScreen ? 10 : 16,
      width: "100%",
      paddingTop: isVerySmallScreen ? 10 : 14,
      paddingBottom: isVerySmallScreen ? 2 : 6,
    },

    registerButtonWrapper: {
      width: "100%",
      height: buttonHeight,
      borderRadius: buttonRadius,
      overflow: "hidden",
      shadowColor: "#6E1411",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: Platform.OS === "android" ? 0.18 : 0.24,
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
      fontSize: isVerySmallScreen ? 18 : 19.5,
      fontWeight: "900",
      textAlign: "center",
    },

    orArea: {
      marginTop: isVerySmallScreen ? 8 : 11,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
    },

    orLine: {
      flex: 1,
      height: 1,
      backgroundColor: "rgba(150, 150, 150, 1)",
    },

    orText: {
      marginHorizontal: 14,
      color: "rgba(113, 113, 113, 1)",
      fontSize: isVerySmallScreen ? 15.5 : 16.5,
      fontWeight: "900",
    },

    loginTextArea: {
      marginTop: isVerySmallScreen ? 12 : 16,
      flexDirection: "row-reverse",
      alignItems: "center",
      justifyContent: "center",
      flexWrap: "wrap",
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

    loginLightText: {
      color: COLORS.muted,
      fontSize: isVerySmallScreen ? 15 : 16,
      fontWeight: "700",
      textAlign: "center",
    },

    loginBoldText: {
      color: COLORS.primary,
      fontSize: isVerySmallScreen ? 13.8 : 14.7,
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