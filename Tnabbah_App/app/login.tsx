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
// import * as Notifications from "expo-notifications";
// import * as Device from "expo-device";
import * as SecureStore from "expo-secure-store";

import { LinearGradient } from "expo-linear-gradient";
import { useLanguage } from "../providers/LanguageProvider";
import { useAppSettings } from "../providers/AppSettingsProvider";
import { Feather, Ionicons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Alexandria_400Regular,
  Alexandria_600SemiBold,
  Alexandria_700Bold,
  Alexandria_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/alexandria";

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
  white: "#FFFFFF",

  error: "#D32F2F",
  errorSoft: "rgba(211,47,47,0.045)",
  errorBorder: "rgba(211,47,47,0.55)",

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
  white: "#FFFFFF",

  error: "#EF7676",
  errorSoft: "rgba(239,118,118,0.10)",
  errorBorder: "rgba(239,118,118,0.45)",

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

const SAVED_EMAIL_KEY = "tnabbah_saved_email";
const SAVED_PASSWORD_KEY = "tnabbah_saved_password";

type LoginRoute = "/register" | "/forgot-password" | "/connection-intro" | "/(tabs)/home";

type FieldErrors = {
  email?: string;
  password?: string;
};

export default function LoginScreen() {
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

  const rememberPasswordText = isArabic ? "تذكرني" : "Remember me";
  const rememberPasswordSubText = isArabic
    ? "لتسهيل تسجيل الدخول لاحقًا"
    : "For easier sign in later";

  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [rememberPassword, setRememberPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const [loading, setLoading] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  const screenOpacity = useRef(new Animated.Value(1)).current;
  const screenTranslateY = useRef(new Animated.Value(0)).current;
  const transitionAnim = useRef(new Animated.Value(0)).current;
  const keyboardTranslateY = useRef(new Animated.Value(0)).current;

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
    let isMounted = true;

    const loadSavedCredentials = async () => {
      try {
        const savedEmail = await SecureStore.getItemAsync(SAVED_EMAIL_KEY);
        const savedPassword = await SecureStore.getItemAsync(SAVED_PASSWORD_KEY);

        if (!isMounted) return;

        if (savedEmail && savedPassword) {
          setEmail(savedEmail);
          setPassword(savedPassword);
          setRememberPassword(true);
        }
      } catch (error) {
        console.log("Load saved credentials error:", error);
      }
    };

    loadSavedCredentials();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const keyboardShift = isVerySmallScreen ? -90 : isSmallScreen ? -75 : -60;

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

      return () => {};
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

  const smoothPush = (path: LoginRoute) => {
    if (isNavigating) return;

    setIsNavigating(true);

    runSmoothExit(() => {
      router.push(path as any);
    });
  };

  const smoothReplace = (path: LoginRoute) => {
    if (isNavigating) return;

    setIsNavigating(true);

    runSmoothExit(() => {
      router.replace(path as any);
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

    if (!email.trim()) {
      errors.email = t.enterEmail;
    }

    if (!password.trim()) {
      errors.password = t.enterPassword;
    }

    setFieldErrors(errors);

    return Object.keys(errors).length === 0;
  };

  const handleLogin = async () => {
    try {
      if (!validateForm()) {
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

        const isNotConfirmed =
          message.includes("email not confirmed") ||
          message.includes("email_not_confirmed") ||
          message.includes("not confirmed") ||
          code.includes("email_not_confirmed");

        if (isNotConfirmed) {
          const { error: resendError } = await supabase.auth.resend({
            type: "signup",
            email: cleanEmail,
          });

          router.push({
            pathname: "/verify-email",
            params: {
              email: cleanEmail,
              fullName: "",
              source: "login",
            },
          } as any);

          if (resendError) {
            console.log("RESEND VERIFY ERROR:", resendError);
          }

          return;
        }

        setFieldErrors({
          password: t.wrongEmailOrPassword,
        });

        return;
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        await supabase.auth.signOut();
        setFieldErrors({
          password: t.verifyError,
        });
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

      setFieldErrors({});

      try {
        if (rememberPassword) {
          await SecureStore.setItemAsync(SAVED_EMAIL_KEY, cleanEmail);
          await SecureStore.setItemAsync(SAVED_PASSWORD_KEY, password);
        } else {
          await SecureStore.deleteItemAsync(SAVED_EMAIL_KEY);
          await SecureStore.deleteItemAsync(SAVED_PASSWORD_KEY);
        }
      } catch (secureStoreError) {
        console.log("Save credentials error:", secureStoreError);
      }

      if (data.session) {
        /**
         * Push Notifications are currently commented out for iOS/free Apple account builds.
         * السبب: في iOS يظهر الخطأ:
         * no valid “aps-environment” entitlement string found for application
         *
         * لو رجعتوا تدعمون Push Notifications لاحقًا، فعّلوا الاستيرادات فوق:
         * import * as Notifications from "expo-notifications";
         * import * as Device from "expo-device";
         * ثم فعّلوا هذا البلوك.
         */
        // try {
        //   if (Platform.OS === "android" && Device.isDevice) {
        //     const { status: existingStatus } =
        //       await Notifications.getPermissionsAsync();
        //
        //     let finalStatus = existingStatus;
        //
        //     if (existingStatus !== "granted") {
        //       const { status } = await Notifications.requestPermissionsAsync();
        //       finalStatus = status;
        //     }
        //
        //     if (finalStatus === "granted") {
        //       const tokenData = await Notifications.getExpoPushTokenAsync();
        //       const expoPushToken = tokenData.data;
        //
        //       console.log("EXPO PUSH TOKEN:", expoPushToken);
        //
        //       await supabase
        //         .from("profiles")
        //         .update({
        //           expo_push_token: expoPushToken,
        //         })
        //         .eq("id", user.id);
        //     }
        //   }
        // } catch (pushError) {
        //   console.log("Push token error:", pushError);
        // }

        smoothReplace("/(tabs)/home");
      }
    } catch (err) {
      console.log("Login Error:", err);
      setFieldErrors({
        password: t.unexpectedError,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!fontsLoaded || !themePreferenceReady) {
    return null;
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
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
                      {t.login}
                    </Text>

                    <Text style={styles.subtitle} allowFontScaling={false}>
                      {t.welcomeBack}
                    </Text>
                  </View>

                  <View style={styles.formArea}>
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

                    <View style={styles.fieldGroup}>
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
                              showPassword
                                ? "eye-outline"
                                : "eye-off-outline"
                            }
                            size={isVerySmallScreen ? 20 : 21}
                            color={COLORS.primary}
                          />
                        </TouchableOpacity>
                      </View>

                      <TouchableOpacity
                        activeOpacity={0.78}
                        onPress={() => setRememberPassword((prev) => !prev)}
                        disabled={loading || isNavigating}
                        style={[
                          styles.rememberPasswordRow,
                          { flexDirection: rowDirection },
                        ]}
                      >
                        <View
                          style={[
                            styles.rememberCheckbox,
                            rememberPassword && styles.rememberCheckboxActive,
                          ]}
                        >
                          {rememberPassword ? (
                            <Ionicons
                              name="checkmark"
                              size={15}
                              color={COLORS.white}
                            />
                          ) : null}
                        </View>

                        <View style={styles.rememberTextArea}>
                          <Text
                            style={[styles.rememberPasswordText, { textAlign }]}
                            allowFontScaling={false}
                          >
                            {rememberPasswordText}
                          </Text>

                          <Text
                            style={[styles.rememberPasswordSubText, { textAlign }]}
                            allowFontScaling={false}
                          >
                            {rememberPasswordSubText}
                          </Text>
                        </View>
                      </TouchableOpacity>

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
                    </View>

                    <TouchableOpacity
                      activeOpacity={0.7}
                      style={[
                        styles.forgotPasswordButton,
                        {
                          alignSelf: isArabic ? "flex-end" : "flex-start",
                          marginRight: isArabic ? 8 : 0,
                          marginLeft: isArabic ? 0 : 8,
                        },
                      ]}
                      onPress={() => smoothPush("/forgot-password")}
                      disabled={isNavigating || loading}
                    >
                      <Text
                        style={[styles.forgotPasswordText, { textAlign }]}
                        allowFontScaling={false}
                      >
                        {t.forgotPassword}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </Animated.View>

                <View style={styles.bottomArea}>
                  <AnimatedTouchableOpacity
                    style={[
                      styles.loginButtonWrapper,
                      animatedMainButtonStyle,
                      loading && styles.loginButtonDisabled,
                    ]}
                    onPress={handleLogin}
                    disabled={loading || isNavigating}
                    activeOpacity={0.9}
                  >
                    <LinearGradient
                      colors={[COLORS.buttonGradientStart, COLORS.buttonGradientEnd]}
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
                          />
                        ) : (
                          <Text style={styles.loginText} allowFontScaling={false}>
                            {t.login}
                          </Text>
                        )}
                      </View>
                    </LinearGradient>
                  </AnimatedTouchableOpacity>

                  <View style={styles.loadingStatusArea}>
                    {loading ? (
                      <Text style={styles.loadingStatusText} allowFontScaling={false}>
                        {isArabic ? "جاري تسجيل الدخول..." : "Signing you in..."}
                      </Text>
                    ) : null}
                  </View>

                  <View style={styles.orArea}>
                    <View style={styles.orLine} />
                    <Text style={styles.orText} allowFontScaling={false}>
                      {t.or}
                    </Text>
                    <View style={styles.orLine} />
                  </View>

                  <View
                    style={[
                      styles.registerTextArea,
                      { flexDirection: isArabic ? "row-reverse" : "row" },
                    ]}
                  >
                    <Text style={styles.registerText} allowFontScaling={false}>
                      {t.noAccount}{" "}
                    </Text>

                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => smoothPush("/register")}
                      disabled={isNavigating || loading}
                    >
                      <Text
                        style={[
                          styles.registerTextBold,
                          isArabic ? { marginRight: 6 } : { marginLeft: 6 },
                        ]}
                        allowFontScaling={false}
                      >
                        {t.createAccount}
                      </Text>
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

    rememberPasswordRow: {
      width: "100%",
      marginTop: 9,
      marginBottom: isVerySmallScreen ? 8 : 10,
      paddingHorizontal: 7,
      alignItems: "center",
      justifyContent: "flex-start",
    },

    rememberCheckbox: {
      width: isVerySmallScreen ? 19 : 21,
      height: isVerySmallScreen ? 19 : 21,
      borderRadius: 6,
      borderWidth: 1.5,
      borderColor: COLORS.inputBorder,
      backgroundColor: COLORS.inputBackground,
      alignItems: "center",
      justifyContent: "center",
      marginLeft: isArabic ? 9 : 0,
      marginRight: isArabic ? 0 : 9,
    },

    rememberCheckboxActive: {
      borderColor: COLORS.primary,
      backgroundColor: COLORS.primary,
    },

    rememberTextArea: {
      flex: 1,
    },

    rememberPasswordText: {
      fontFamily: FONT_BOLD,
      color: COLORS.label,
      fontSize: isVerySmallScreen ? 12.2 : 13,
      lineHeight: isVerySmallScreen ? 18 : 19,
      includeFontPadding: true,
    },

    rememberPasswordSubText: {
      marginTop: 1,
      fontFamily: FONT_SEMIBOLD,
      color: COLORS.placeholder,
      fontSize: isVerySmallScreen ? 10.5 : 11.2,
      lineHeight: isVerySmallScreen ? 15 : 16,
      includeFontPadding: true,
    },

    forgotPasswordButton: {
      marginTop: isVerySmallScreen ? 2 : 4,
      marginBottom: isVerySmallScreen ? 8 : 10,
      paddingVertical: 4,
      zIndex: 20,
      elevation: 20,
    },

    forgotPasswordText: {
      fontFamily: FONT_BOLD,
      color: COLORS.primary,
      fontSize: isVerySmallScreen ? 12.8 : 13.8,
      lineHeight: isVerySmallScreen ? 20 : 22,
      includeFontPadding: true,
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

    bottomArea: {
      marginTop: isVerySmallScreen ? 6 : 10,
      width: "100%",
      paddingTop: isVerySmallScreen ? 6 : 8,
      paddingBottom: isVerySmallScreen ? 18 : 24,
    },

    loginButtonWrapper: {
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

    loadingStatusArea: {
      width: "100%",
      minHeight: isVerySmallScreen ? 30 : 34,
      alignItems: "center",
      justifyContent: "center",
      marginTop: isVerySmallScreen ? 6 : 8,
      marginBottom: isVerySmallScreen ? -2 : 0,
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

    registerTextArea: {
      marginTop: isVerySmallScreen ? 12 : 16,
      flexDirection: "row-reverse",
      alignItems: "center",
      justifyContent: "center",
      flexWrap: "wrap",
    },

    registerText: {
      fontFamily: FONT_SEMIBOLD,
      color: COLORS.muted,
      fontSize: isVerySmallScreen ? 14 : 15,
      lineHeight: isVerySmallScreen ? 22 : 24,
      textAlign: "center",
      includeFontPadding: true,
    },

    registerTextBold: {
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