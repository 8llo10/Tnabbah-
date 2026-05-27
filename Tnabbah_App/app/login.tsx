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
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";

import { LinearGradient } from "expo-linear-gradient";
import { useLanguage } from "../providers/LanguageProvider";
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

type FieldErrors = {
  email?: string;
  password?: string;
};

export default function LoginScreen() {
  const router = useRouter();
  const { t, isArabic } = useLanguage();

  const textAlign = isArabic ? "right" : "left";
  const rowDirection = isArabic ? "row-reverse" : "row";
  const iconMargin = isArabic ? { marginLeft: 10 } : { marginRight: 10 };
  const eyeMargin = isArabic ? { marginRight: 8 } : { marginLeft: 8 };

  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

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

          if (resendError) {
            console.log("RESEND VERIFY ERROR:", resendError);

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

      if (data.session) {
        try {
          if (Device.isDevice) {
            const { status: existingStatus } =
              await Notifications.getPermissionsAsync();

            let finalStatus = existingStatus;

            if (existingStatus !== "granted") {
              const { status } = await Notifications.requestPermissionsAsync();
              finalStatus = status;
            }

            if (finalStatus === "granted") {
              const tokenData = await Notifications.getExpoPushTokenAsync();
              const expoPushToken = tokenData.data;

              console.log("EXPO PUSH TOKEN:", expoPushToken);

              await supabase
                .from("profiles")
                .update({
                  expo_push_token: expoPushToken,
                })
                .eq("id", user.id);
            }
          }
        } catch (pushError) {
          console.log("Push token error:", pushError);
        }

        smoothReplace("/connection-intro");
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
                    <Text style={styles.title}>{t.login}</Text>

                    <Text style={styles.subtitle}>{t.welcomeBack}</Text>
                  </View>

                  <View style={styles.formArea}>
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

                    <View style={styles.fieldGroup}>
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
                              showPassword
                                ? "eye-outline"
                                : "eye-off-outline"
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
                      <Text style={[styles.forgotPasswordText, { textAlign }]}>
                        {t.forgotPassword}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </Animated.View>

                <View style={styles.bottomArea}>
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
                          {loading ? t.loggingIn : t.login}
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
                      styles.registerTextArea,
                      { flexDirection: isArabic ? "row-reverse" : "row" },
                    ]}
                  >
                    <Text style={styles.registerText}>{t.noAccount} </Text>

                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => smoothPush("/register")}
                      disabled={isNavigating || loading}
                    >
                      <Text style={styles.registerTextBold}>
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
      borderRadius: inputRadius,
      backgroundColor: COLORS.white,
      borderWidth: 1.7,
      borderColor: COLORS.border,
      paddingHorizontal: isVerySmallScreen ? 15 : 17,
      alignItems: "center",
      shadowColor: COLORS.shadowGray,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: Platform.OS === "android" ? 0.14 : 0.2,
      shadowRadius: 4,
      elevation: 3,
    },

    inputWrapperError: {
      borderColor: "rgba(154,33,28,0.45)",
      backgroundColor: "rgba(154,33,28,0.015)",
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

    forgotPasswordButton: {
      marginTop: isVerySmallScreen ? 2 : 4,
      marginBottom: isVerySmallScreen ? 8 : 10,
      paddingVertical: 4,
      zIndex: 20,
      elevation: 20,
    },

    forgotPasswordText: {
      color: COLORS.primary,
      fontSize: isVerySmallScreen ? 13.8 : 14.7,
      fontWeight: "900",
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

    bottomArea: {
      marginTop: isVerySmallScreen ? 6 : 10,
      width: "100%",
      paddingTop: isVerySmallScreen ? 6 : 8,
      paddingBottom: isVerySmallScreen ? 18 : 24,
    },

    loginButtonWrapper: {
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
      color: COLORS.white,
      fontSize: isVerySmallScreen ? 18 : 19.5,
      fontWeight: "900",
      textAlign: "center",
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

    registerTextArea: {
      marginTop: isVerySmallScreen ? 12 : 16,
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
    },

    registerTextBold: {
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