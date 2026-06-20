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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../lib/supabase";
import { LinearGradient } from "expo-linear-gradient";
import { Feather, Ionicons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Alexandria_400Regular,
  Alexandria_600SemiBold,
  Alexandria_700Bold,
  Alexandria_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/alexandria";
import { useLanguage } from "../providers/LanguageProvider";
import { useAppSettings } from "../providers/AppSettingsProvider";

const LIGHT_COLORS = {
  screenBackground: "#FFFFFF",
  nextScreenBackground: "rgba(255,255,255,0.34)",

  primary: "#9A211C",
  primaryDark: "#761713",
  buttonGradientStart: "#9A211C",
  buttonGradientEnd: "#761713",
  primaryText: "#871B17",
  authLink: "#202020",

  title: "#202020",
  textDark: "#2C2C2C",
  inputText: "#2E1D1D",

  label: "#6C5B58",
  muted: "#6C5B58",
  placeholder: "#A8A8A8",
  border: "#DCDCDC",

  shadowGray: "#000000",
  success: "#2E7D32",
  white: "#FFFFFF",

  error: "#D32F2F",
  errorSoft: "rgba(211,47,47,0.045)",
  errorBorder: "rgba(211,47,47,0.55)",

  rulesBackground: "#F5F5F5",
  rulesBorder: "rgba(170,170,170,0.55)",
  rulesText: "#6C5B58",

  inputBackground: "#FFFFFF",
  inputBorder: "#DCDCDC",
  inputShadowOpacity: 0.04,
  titleShadow: "rgba(255,255,255,0.95)",
  subtitleShadow: "rgba(255,255,255,0.90)",
  line: "#DCDCDC",
};

const DARK_COLORS = {
  screenBackground: "#151515",
  nextScreenBackground: "rgba(21,21,21,0.38)",

  primary: "#C8564E",
  primaryDark: "#C8564E",
  buttonGradientStart: "#B63A34",
  buttonGradientEnd: "#871B17",
  primaryText: "#C8564E",
  authLink: "#FFFFFF",

  title: "#FFFFFF",
  textDark: "#FFFFFF",
  inputText: "#FFFFFF",

  label: "#D7D7D7",
  muted: "#C7C7C7",
  placeholder: "#8E8E8E",
  border: "#383838",

  shadowGray: "#000000",
  success: "#66BB6A",
  white: "#FFFFFF",

  error: "#EF7676",
  errorSoft: "rgba(239,118,118,0.10)",
  errorBorder: "rgba(239,118,118,0.45)",

  rulesBackground: "#202020",
  rulesBorder: "#383838",
  rulesText: "#D7D7D7",

  inputBackground: "#202020",
  inputBorder: "#383838",
  inputShadowOpacity: 0,
  titleShadow: "rgba(0,0,0,0)",
  subtitleShadow: "rgba(0,0,0,0)",
  line: "#383838",
};

type AuthColors = typeof LIGHT_COLORS;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const FONT_SEMIBOLD = "Alexandria_600SemiBold";
const FONT_BOLD = "Alexandria_700Bold";
const FONT_EXTRABOLD = "Alexandria_800ExtraBold";

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const APP_DARK_MODE_KEY = "app_dark_mode_enabled";

const MAX_FIRST_NAME_LENGTH = 15;

type RegisterRoute = "/login" | "/start";

type FieldErrors = {
  fullName?: string;
  email?: string;
  password?: string;
};

export default function RegisterScreen() {
  const router = useRouter();
  const { t, isArabic } = useLanguage();
  const { darkModeEnabled } = useAppSettings();

  const [fontsLoaded] = useFonts({
    Alexandria_400Regular,
    Alexandria_600SemiBold,
    Alexandria_700Bold,
    Alexandria_800ExtraBold,
  });

  const [storedDarkModePreference, setStoredDarkModePreference] =
    useState<boolean | null>(null);
  const [themePreferenceReady, setThemePreferenceReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadSavedDarkMode = async () => {
      try {
        const savedDarkMode = await AsyncStorage.getItem(APP_DARK_MODE_KEY);

        if (!mounted) return;

        if (savedDarkMode === "true") {
          setStoredDarkModePreference(true);
        } else if (savedDarkMode === "false") {
          setStoredDarkModePreference(false);
        } else {
          setStoredDarkModePreference(null);
        }

        setThemePreferenceReady(true);
      } catch (error) {
        console.log("Load auth dark mode error:", error);

        if (mounted) {
          setStoredDarkModePreference(null);
          setThemePreferenceReady(true);
        }
      }
    };

    loadSavedDarkMode();

    return () => {
      mounted = false;
    };
  }, []);

  const isDarkMode =
    storedDarkModePreference !== null
      ? storedDarkModePreference
      : darkModeEnabled === true;

  const COLORS = isDarkMode ? DARK_COLORS : LIGHT_COLORS;

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
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const [loading, setLoading] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  const screenOpacity = useRef(new Animated.Value(1)).current;
  const screenTranslateY = useRef(new Animated.Value(0)).current;
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

  const buttonHeight = isVerySmallScreen ? 54 : 58;
  const buttonRadius = 34;

  const buttonFullWidth = Math.min(
    430,
    Math.max(buttonHeight, width - horizontalPadding * 2)
  );

  const buttonWidthAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(buttonWidthAnim, {
      toValue: loading ? 0 : 1,
      duration: 190,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [buttonWidthAnim, loading]);

  const animatedMainButtonStyle = {
    width: buttonWidthAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [buttonHeight, buttonFullWidth],
    }),
  };

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
        COLORS,
        isArabic,
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
      COLORS,
      isArabic,
    ]
  );

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const keyboardShift = isVerySmallScreen ? -150 : isSmallScreen ? -125 : -100;

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

  const showPasswordRules = (isPasswordFocused || password.length > 0) && !isPasswordValid;

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
      screenOpacity.setValue(0.96);
      screenTranslateY.setValue(4);
      keyboardTranslateY.setValue(0);

      Animated.parallel([
        Animated.timing(screenOpacity, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(screenTranslateY, {
          toValue: 0,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();

      return () => { };
    }, [screenOpacity, screenTranslateY, transitionAnim, keyboardTranslateY])
  );

  const runSmoothExit = (afterExit: () => void) => {
    Animated.parallel([
      Animated.timing(screenOpacity, {
        toValue: 0.97,
        duration: 180,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(screenTranslateY, {
        toValue: -4,
        duration: 180,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(transitionAnim, {
        toValue: 1,
        duration: 180,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => {
      requestAnimationFrame(afterExit);
    });
  };

  const smoothPush = (path: RegisterRoute) => {
    if (isNavigating) return;

    setIsNavigating(true);

    runSmoothExit(() => {
      router.push(path as any);
    });
  };

  const smoothBack = () => {
    if (isNavigating) return;

    setIsNavigating(true);

    runSmoothExit(() => {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace("/start" as any);
      }
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
    } else if (fullName.trim().length > MAX_FIRST_NAME_LENGTH) {
      errors.fullName = t.nameLimitError;
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

      const cleanName = fullName.trim().slice(0, MAX_FIRST_NAME_LENGTH);
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

          /* router.push({
            pathname: "/verify-email",
            params: {
              email: cleanEmail,
              fullName: cleanName,
              source: "register",
            },
          } as any); */
          if (Platform.OS === "web") {
            window.location.href =
              `/verify-email?email=${encodeURIComponent(cleanEmail)}` +
              `&fullName=${encodeURIComponent(cleanName)}` +
              `&source=register`;
          } else {
            router.push({
              pathname: "/verify-email",
              params: {
                email: cleanEmail,
                fullName: cleanName,
                source: "register",
              },
            } as any);
          }

          return;
        }

        setFieldErrors({
          email: error.message || t.registerEmailError,
        });

        return;
      }

      setPassword("");
      setFieldErrors({});

      /* router.push({
        pathname: "/verify-email",
        params: {
          email: cleanEmail,
          fullName: cleanName,
          source: "register",
        },
      } as any); */

      if (Platform.OS === "web") {
        window.location.href =
          `/verify-email?email=${encodeURIComponent(cleanEmail)}` +
          `&fullName=${encodeURIComponent(cleanName)}` +
          `&source=register`;
      } else {
        router.push({
          pathname: "/verify-email",
          params: {
            email: cleanEmail,
            fullName: cleanName,
            source: "register",
          },
        } as any);
      }


    } catch (err) {
      console.log(err);
      setFieldErrors({
        password: t.registerUnexpectedError,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!fontsLoaded || !themePreferenceReady) {
    return null;
  }

  return (
    /* <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}> */
    <TouchableWithoutFeedback
      onPress={Platform.OS === "web" ? undefined : Keyboard.dismiss}
      accessible={false}
      disabled={Platform.OS === "web"}
    >
      <View style={styles.container}>
        <Stack.Screen
          options={{
            gestureEnabled: false,
            animation: "fade",
            animationDuration: 180,
            contentStyle: {
              backgroundColor: COLORS.screenBackground,
            },
          }}
        />

        <StatusBar
          translucent
          backgroundColor="transparent"
          barStyle={isDarkMode ? "light-content" : "dark-content"}
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
                        name={
                          isArabic
                            ? "arrow-forward-outline"
                            : "arrow-back-outline"
                        }
                        size={isVerySmallScreen ? 23 : 25}
                        color={COLORS.textDark}
                      />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.titleArea}>
                    <Text style={styles.title} allowFontScaling={false}>
                      {t.registerTitle}
                    </Text>

                    <Text style={styles.subtitle} allowFontScaling={false}>
                      {t.registerSubtitle}
                    </Text>
                  </View>

                  <View style={styles.formArea}>
                    <View style={styles.fieldGroup}>
                      <Text
                        style={[styles.inputLabel, { textAlign }]}
                        allowFontScaling={false}
                      >
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
                          allowFontScaling={false}
                          style={[styles.input, { textAlign }]}
                          placeholder={t.fullNamePlaceholder}
                          placeholderTextColor={COLORS.placeholder}
                          value={fullName}
                          onChangeText={(text) => {
                            setFullName(text.slice(0, MAX_FIRST_NAME_LENGTH));
                            clearFieldError("fullName");
                          }}
                          maxLength={MAX_FIRST_NAME_LENGTH}
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
                            color={COLORS.error}
                            style={iconMargin}
                          />

                          <Text
                            style={[styles.fieldErrorText, { textAlign }]}
                            allowFontScaling={false}
                          >
                            {fieldErrors.fullName}
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    <View style={styles.fieldGroup}>
                      <Text
                        style={[styles.inputLabel, { textAlign }]}
                        allowFontScaling={false}
                      >
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
                          allowFontScaling={false}
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
                            color={COLORS.error}
                            style={iconMargin}
                          />

                          <Text
                            style={[styles.fieldErrorText, { textAlign }]}
                            allowFontScaling={false}
                          >
                            {fieldErrors.email}
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    <View style={styles.passwordSection}>
                      <Text
                        style={[styles.inputLabel, { textAlign }]}
                        allowFontScaling={false}
                      >
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
                          allowFontScaling={false}
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
                          onFocus={() => setIsPasswordFocused(true)}
                          onBlur={() => setIsPasswordFocused(false)}
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
                            color={COLORS.error}
                            style={iconMargin}
                          />

                          <Text
                            style={[styles.fieldErrorText, { textAlign }]}
                            allowFontScaling={false}
                          >
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
                        <Text
                          style={[styles.passwordRulesTitle, { textAlign }]}
                          allowFontScaling={false}
                        >
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
                              size={isVerySmallScreen ? 14 : 15}
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
                              allowFontScaling={false}
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
                  <View style={styles.mainButtonCenterWrapper}>
                    <AnimatedTouchableOpacity
                      style={[
                        styles.registerButtonWrapper,
                        animatedMainButtonStyle,
                        loading && styles.registerButtonDisabled,
                      ]}
                      onPress={handleRegister}
                      disabled={loading || isNavigating}
                      activeOpacity={0.9}
                    >
                      <LinearGradient
                        colors={[COLORS.buttonGradientStart, COLORS.buttonGradientEnd]}
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
                            />
                          ) : (
                            <Text style={styles.registerButtonText} allowFontScaling={false}>
                              {t.registerButton}
                            </Text>
                          )}
                        </View>
                      </LinearGradient>
                    </AnimatedTouchableOpacity>
                  </View>

                  {loading ? (
                    <View style={styles.loadingStatusArea}>
                      <Text style={styles.loadingStatusText} allowFontScaling={false}>
                        {isArabic ? "جاري إنشاء الحساب..." : "Creating your account..."}
                      </Text>
                    </View>
                  ) : (
                    <>
                      <View style={styles.orArea}>
                        <View style={styles.orLine} />
                        <Text style={styles.orText} allowFontScaling={false}>
                          {t.or}
                        </Text>
                        <View style={styles.orLine} />
                      </View>

                      <View
                        style={[
                          styles.loginTextArea,
                          { flexDirection: isArabic ? "row-reverse" : "row" },
                        ]}
                      >
                        <Text style={styles.loginLightText} allowFontScaling={false}>
                          {t.alreadyHaveAccount}{" "}
                        </Text>

                        <TouchableOpacity
                          activeOpacity={0.7}
                          onPress={() => smoothPush("/login")}
                          disabled={isNavigating || loading}
                        >
                          <Text
                            style={[
                              styles.loginBoldText,
                              isArabic ? { marginRight: 6 } : { marginLeft: 6 },
                            ]}
                            allowFontScaling={false}
                          >
                            {t.login}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  )}
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
  COLORS,
  isArabic,
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
  COLORS: AuthColors;
  isArabic: boolean;
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
      alignItems: isArabic ? "flex-end" : "flex-start",
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
      fontFamily: FONT_EXTRABOLD,
      fontSize: isVerySmallScreen ? 23 : isSmallScreen ? 25 : 27,
      color: COLORS.primaryDark,
      textAlign: "center",
      letterSpacing: -0.35,
      lineHeight: isVerySmallScreen ? 32 : isSmallScreen ? 35 : 38,
      includeFontPadding: true,
      textShadowColor: COLORS.titleShadow,
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 12,
    },

    subtitle: {
      marginTop: isVerySmallScreen ? 4 : 6,
      fontFamily: FONT_SEMIBOLD,
      fontSize: isVerySmallScreen ? 12.2 : 13.2,
      lineHeight: isVerySmallScreen ? 20 : 22,
      color: COLORS.placeholder,
      textAlign: "center",
      includeFontPadding: true,
      textShadowColor: COLORS.subtitleShadow,
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
      fontFamily: FONT_BOLD,
      color: COLORS.label,
      fontSize: isVerySmallScreen ? 12.6 : 13.6,
      lineHeight: isVerySmallScreen ? 20 : 22,
      textAlign: "right",
      includeFontPadding: true,
      marginBottom: 6,
    },

    inputWrapper: {
      width: "100%",
      height: inputHeight,
      borderRadius: 22,
      backgroundColor: COLORS.inputBackground,
      borderWidth: 1,
      borderColor: COLORS.inputBorder,
      paddingHorizontal: isVerySmallScreen ? 14 : 16,
      alignItems: "center",
      shadowColor: COLORS.shadowGray,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: COLORS.inputShadowOpacity,
      shadowRadius: 6,
      elevation: 1,
    },

    inputWrapperError: {
      borderColor: COLORS.errorBorder,
      backgroundColor: COLORS.errorSoft,
    },

    inputIcon: {
      marginLeft: 0,
      marginRight: 0,
    },

    input: {
      flex: 1,
      fontFamily: FONT_SEMIBOLD,
      fontSize: isVerySmallScreen ? 14.4 : 15.4,
      color: COLORS.inputText,
      paddingVertical: 0,
      minHeight: inputHeight - 8,
      includeFontPadding: true,
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
      fontFamily: FONT_SEMIBOLD,
      color: COLORS.error,
      fontSize: isVerySmallScreen ? 12.2 : 13,
      textAlign: "right",
      lineHeight: isVerySmallScreen ? 18 : 20,
      includeFontPadding: true,
    },

    passwordSection: {
      width: "100%",
      marginBottom: 0,
    },

    passwordRulesBox: {
      width: "100%",
      minHeight: isVerySmallScreen ? 104 : 112,
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
      minHeight: 0,
      height: 0,
      marginTop: 0,
      paddingVertical: 0,
      borderWidth: 0,
    },

    passwordRulesTitle: {
      fontFamily: FONT_BOLD,
      color: COLORS.rulesText,
      fontSize: isVerySmallScreen ? 11.4 : 12.2,
      textAlign: "right",
      marginBottom: 3,
      lineHeight: isVerySmallScreen ? 16 : 18,
      includeFontPadding: true,
    },

    passwordRuleRow: {
      alignItems: "center",
      justifyContent: "flex-start",
      marginTop: 2,
    },

    passwordRuleText: {
      flex: 1,
      fontFamily: FONT_SEMIBOLD,
      color: COLORS.rulesText,
      fontSize: isVerySmallScreen ? 10.6 : 11.4,
      textAlign: "right",
      lineHeight: isVerySmallScreen ? 15.5 : 17,
      includeFontPadding: true,
    },

    passwordRuleTextValid: {
      color: COLORS.success,
    },

    bottomArea: {
      marginTop: isVerySmallScreen ? 6 : 10,
      width: "100%",
      paddingTop: isVerySmallScreen ? 6 : 8,
      paddingBottom: isVerySmallScreen ? 18 : 24,
      alignItems: "center",
    },

    mainButtonCenterWrapper: {
      width: "100%",
      alignItems: "center",
      justifyContent: "center",
    },

    registerButtonWrapper: {
      width: "100%",
      alignSelf: "center",
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
      fontFamily: FONT_EXTRABOLD,
      color: COLORS.white,
      fontSize: isVerySmallScreen ? 17.4 : 18.4,
      lineHeight: isVerySmallScreen ? 28 : 30,
      textAlign: "center",
      includeFontPadding: true,
      textAlignVertical: "center",
      letterSpacing: -0.15,
      paddingTop: Platform.OS === "ios" ? 1 : 0,
      paddingBottom: Platform.OS === "ios" ? 1 : 0,
    },

    loadingStatusArea: {
      width: "100%",
      minHeight: isVerySmallScreen ? 34 : 38,
      alignItems: "center",
      justifyContent: "center",
      marginTop: isVerySmallScreen ? 10 : 12,
      marginBottom: isVerySmallScreen ? 6 : 8,
    },

    loadingStatusText: {
      marginTop: 0,
      width: "100%",
      fontFamily: FONT_BOLD,
      color: COLORS.muted,
      fontSize: isVerySmallScreen ? 12.8 : 13.8,
      lineHeight: isVerySmallScreen ? 20 : 22,
      textAlign: "center",
      includeFontPadding: true,
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
      backgroundColor: COLORS.line,
    },

    orText: {
      marginHorizontal: 14,
      fontFamily: FONT_BOLD,
      color: COLORS.muted,
      fontSize: isVerySmallScreen ? 15.2 : 16.2,
      lineHeight: isVerySmallScreen ? 24 : 25,
      includeFontPadding: true,
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
      fontFamily: FONT_SEMIBOLD,
      color: COLORS.muted,
      fontSize: isVerySmallScreen ? 14 : 15,
      lineHeight: isVerySmallScreen ? 22 : 24,
      textAlign: "center",
      includeFontPadding: true,
    },

    loginBoldText: {
      fontFamily: FONT_BOLD,
      color: COLORS.primary,
      fontSize: isVerySmallScreen ? 14 : 15,
      lineHeight: isVerySmallScreen ? 22 : 24,
      textAlign: "center",
      includeFontPadding: true,
    },

    transitionOverlay: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 100,
      backgroundColor: COLORS.nextScreenBackground,
    },
  });
}