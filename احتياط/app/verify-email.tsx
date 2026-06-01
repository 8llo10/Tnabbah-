import React, { useEffect, useMemo, useRef, useState } from "react";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    StyleSheet,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    useWindowDimensions,
    ActivityIndicator,
    Animated,
    Easing,
    StatusBar,
} from "react-native";
import { supabase } from "../lib/supabase";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useLanguage } from "../providers/LanguageProvider";

const OTP_DIGITS = 8;
const RESEND_COOLDOWN = 60;

const COLORS = {
    screenBackground: "#FFFFFF",

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

    success: "#2E7D32",
};

const clamp = (value: number, min: number, max: number) =>
    Math.min(Math.max(value, min), max);

export default function VerifyEmailScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { t, isArabic } = useLanguage();

    const textAlign = isArabic ? "right" : "left";
    const rowDirection = isArabic ? "row-reverse" : "row";

    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();

    const email = String(params.email || "");
    const fullName = String(params.fullName || "");
    const source = String(params.source || "register");

    const [otpValues, setOtpValues] = useState<string[]>(
        Array(OTP_DIGITS).fill("")
    );

    const otpRefs = useRef<Array<TextInput | null>>([]);

    const boxScales = useRef(
        Array.from({ length: OTP_DIGITS }, () => new Animated.Value(1))
    ).current;

    const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

    const [errorMessage, setErrorMessage] = useState("");
    const [infoMessage, setInfoMessage] = useState("");
    const [showVerifySuccess, setShowVerifySuccess] = useState(false);

    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [resendTimer, setResendTimer] = useState(RESEND_COOLDOWN);

    const transitionAnim = useRef(new Animated.Value(0)).current;

    const isSmallScreen = height < 720;
    const isVerySmallScreen = height < 650;

    const horizontalPadding = clamp(width * 0.055, 18, 24);

    const backButtonSize = isVerySmallScreen ? 42 : 46;
    const backButtonRadius = backButtonSize / 2;

    const topSpacing = clamp(height * 0.008, 4, 8);
    const bottomSpacing = clamp(height * 0.014, 8, 14);

    const buttonHeight = isVerySmallScreen ? 54 : 58;
    const buttonRadius = 30;

    const otpBoxSize = clamp((width - horizontalPadding * 2 - 28) / 8, 34, 42);
    const otpBoxHeight = isVerySmallScreen ? 58 : 66;

    const styles = useMemo(
        () =>
            createStyles({
                horizontalPadding,
                backButtonSize,
                backButtonRadius,
                topSpacing,
                bottomSpacing,
                buttonHeight,
                buttonRadius,
                otpBoxSize,
                otpBoxHeight,
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
            buttonHeight,
            buttonRadius,
            otpBoxSize,
            otpBoxHeight,
            isSmallScreen,
            isVerySmallScreen,
            insets.top,
            width,
            height,
        ]
    );

    const otpCode = otpValues.join("");

    useEffect(() => {
        if (resendTimer <= 0) return;

        const interval: ReturnType<typeof setInterval> = setInterval(() => {
            setResendTimer((prev) => {
                if (prev <= 1) return 0;
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [resendTimer]);

    const smoothReplace = (path: string) => {
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

    const animateBox = (index: number, toValue: number) => {
        Animated.spring(boxScales[index], {
            toValue,
            useNativeDriver: true,
            friction: 6,
            tension: 90,
        }).start();
    };

    const clearMessages = () => {
        setErrorMessage("");
        setInfoMessage("");
    };

    const dismissKeyboard = () => {
        Keyboard.dismiss();
        setFocusedIndex(null);
    };

    const handleOtpChange = (text: string, index: number) => {
        const onlyNumbers = text.replace(/[^0-9]/g, "");

        if (!onlyNumbers) {
            const updated = [...otpValues];
            updated[index] = "";
            setOtpValues(updated);
            clearMessages();
            return;
        }

        const updated = [...otpValues];

        if (onlyNumbers.length > 1) {
            const pasted = onlyNumbers.slice(0, OTP_DIGITS).split("");

            for (let i = 0; i < OTP_DIGITS; i++) {
                updated[i] = pasted[i] || "";
            }

            setOtpValues(updated);
            clearMessages();

            const nextEmpty = updated.findIndex((item) => item === "");

            if (nextEmpty !== -1) {
                otpRefs.current[nextEmpty]?.focus();
                setFocusedIndex(nextEmpty);
            } else {
                Keyboard.dismiss();
                setFocusedIndex(null);
            }

            return;
        }

        updated[index] = onlyNumbers;
        setOtpValues(updated);
        clearMessages();

        animateBox(index, 1.08);

        setTimeout(() => {
            animateBox(index, focusedIndex === index ? 1.08 : 1);
        }, 120);

        if (index < OTP_DIGITS - 1) {
            otpRefs.current[index + 1]?.focus();
            setFocusedIndex(index + 1);
        } else {
            Keyboard.dismiss();
            setFocusedIndex(null);
        }
    };

    const handleOtpKeyPress = (key: string, index: number) => {
        if (key === "Backspace" && !otpValues[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
            setFocusedIndex(index - 1);

            const updated = [...otpValues];
            updated[index - 1] = "";
            setOtpValues(updated);
        }
    };

    const handleFocus = (index: number) => {
        setFocusedIndex(index);
        animateBox(index, 1.08);
    };

    const handleBlur = (index: number) => {
        setFocusedIndex((prev) => (prev === index ? null : prev));
        animateBox(index, 1);
    };

    const handleVerifyCode = async () => {
        const cleanEmail = email.trim().toLowerCase();
        const cleanCode = otpCode.trim();

        if (!cleanEmail) {
            setErrorMessage(t.emailMissingRegisterAgain);
            return;
        }

        if (cleanCode.length !== OTP_DIGITS) {
            setErrorMessage(t.enterOtpCode);
            return;
        }

        try {
            setLoading(true);
            clearMessages();

            const { data, error } = await supabase.auth.verifyOtp({
                email: cleanEmail,
                token: cleanCode,
                type: "signup",
            });

            if (error) {
                setErrorMessage(t.invalidOtpCode);
                return;
            }

            if (data.user) {
                const { error: profileError } = await supabase.from("profiles").upsert({
                    id: data.user.id,
                    username: cleanEmail,
                    full_name: fullName,
                    avatar_url: null,
                    website: null,
                });

                if (profileError) {
                    console.log("Profile Upsert Error:", profileError);
                }
            }

            setOtpValues(Array(OTP_DIGITS).fill(""));
            Keyboard.dismiss();
            setFocusedIndex(null);
            setShowVerifySuccess(true);

            setTimeout(() => {
                if (source === "forgot-password") {
                    smoothReplace("/forgot-password");
                } else {
                    smoothReplace("/login");
                }
            }, 2000);
        } catch (err) {
            console.log(err);
            setErrorMessage(t.verifyUnexpectedError);
        } finally {
            setLoading(false);
        }
    };

    const handleResendCode = async () => {
        const cleanEmail = email.trim().toLowerCase();

        if (!cleanEmail) {
            setErrorMessage(t.emailMissing);
            return;
        }

        if (resendTimer > 0 || resending) {
            return;
        }

        try {
            setResending(true);
            clearMessages();

            const { error } = await supabase.auth.resend({
                type: "signup",
                email: cleanEmail,
            });

            if (error) {
                console.log("RESEND CODE ERROR:", error);

                const message = error.message?.toLowerCase() || "";

                if (message.includes("rate limit")) {
                    setErrorMessage(t.codeAlreadySent);
                    return;
                }

                setErrorMessage(t.resendCodeErrorLater);
                return;
            }

            setOtpValues(Array(OTP_DIGITS).fill(""));
            setResendTimer(RESEND_COOLDOWN);
            setInfoMessage(t.newCodeSent);

            Keyboard.dismiss();
            setFocusedIndex(null);
        } catch (err) {
            console.log(err);
            setErrorMessage(t.resendCodeErrorAgain);
        } finally {
            setResending(false);
        }
    };

    const renderMessage = () => {
        if (errorMessage) {
            return (
                <View style={[styles.messageBoxError, { flexDirection: rowDirection }]}>
                    <Ionicons name="alert-circle" size={24} color={COLORS.primaryText} />
                    <Text style={[styles.messageTextError, { textAlign }]}>
                        {errorMessage}
                    </Text>
                </View>
            );
        }

        if (infoMessage) {
            return (
                <View style={[styles.messageBoxInfo, { flexDirection: rowDirection }]}>
                    <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
                    <Text style={[styles.messageTextInfo, { textAlign }]}>
                        {infoMessage}
                    </Text>
                </View>
            );
        }

        return <View style={styles.messagePlaceholder} />;
    };

    const renderResendArea = () => {
        if (resendTimer > 0) {
            return (
                <View style={[styles.timerBox, { flexDirection: rowDirection }]}>
                    <Ionicons name="time-outline" size={24} color={COLORS.primary} />
                    <Text style={styles.timerText}>
                        {t.resendAfter} {resendTimer} {t.seconds}
                    </Text>
                </View>
            );
        }

        return (
            <View style={[styles.resendRow, { flexDirection: rowDirection }]}>
                <Text style={styles.resendQuestion}>{t.didNotReceiveCode}</Text>

                <TouchableOpacity
                    activeOpacity={0.75}
                    onPress={handleResendCode}
                    disabled={loading || resending}
                >
                    <Text style={styles.resendText}>
                        {resending ? t.resendingCode : t.resendCode}
                    </Text>
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ gestureEnabled: false }} />

            <StatusBar
                translucent
                backgroundColor="transparent"
                barStyle="dark-content"
            />

            <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
                <KeyboardAvoidingView
                    style={styles.keyboardAvoidingView}
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 16}
                >
                    <TouchableWithoutFeedback onPress={dismissKeyboard} accessible={false}>
                        <View style={styles.screenContent}>
                            <View style={styles.backArea}>
                                <TouchableOpacity
                                    style={styles.backButtonWrapper}
                                    activeOpacity={0.85}
                                    onPress={() => router.back()}
                                    disabled={loading || resending}
                                >
                                    <Ionicons
                                        name="arrow-back-outline"
                                        size={isVerySmallScreen ? 23 : 25}
                                        color={COLORS.textDark}
                                    />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.titleArea}>
                                <Text style={styles.title}>{t.verifyEmailTitle}</Text>

                                <Text style={styles.subtitle}>{t.verifyEmailSubtitle}</Text>

                                <Text style={styles.emailText}>{email || t.emailFallback}</Text>
                            </View>

                            <View style={styles.otpArea}>
                                <Text style={[styles.inputLabel, { textAlign }]}>
                                    {t.enterCode}
                                </Text>

                                <View style={styles.otpRow}>
                                    {otpValues.map((digit, index) => {
                                        const isFocused = focusedIndex === index;
                                        const isFilled = !!digit;
                                        const hasError = !!errorMessage;

                                        return (
                                            <Animated.View
                                                key={index}
                                                style={[
                                                    styles.otpBoxWrapper,
                                                    {
                                                        transform: [{ scale: boxScales[index] }],
                                                    },
                                                    isFilled && styles.otpBoxFilled,
                                                    isFocused && styles.otpBoxFocused,
                                                    hasError && styles.otpBoxError,
                                                ]}
                                            >
                                                <TextInput
                                                    ref={(ref) => {
                                                        otpRefs.current[index] = ref;
                                                    }}
                                                    style={[
                                                        styles.otpInput,
                                                        isFilled && styles.otpInputFilled,
                                                    ]}
                                                    value={digit}
                                                    onChangeText={(text) => handleOtpChange(text, index)}
                                                    onKeyPress={({ nativeEvent }) =>
                                                        handleOtpKeyPress(nativeEvent.key, index)
                                                    }
                                                    onFocus={() => handleFocus(index)}
                                                    onBlur={() => handleBlur(index)}
                                                    keyboardType="number-pad"
                                                    maxLength={index === 0 ? OTP_DIGITS : 1}
                                                    textAlign="center"
                                                    autoCorrect={false}
                                                    autoCapitalize="none"
                                                    selectionColor={COLORS.primaryDark}
                                                    editable={!loading && !resending}
                                                />
                                            </Animated.View>
                                        );
                                    })}
                                </View>

                                {renderMessage()}
                            </View>

                            <View style={styles.bottomArea}>
                                <TouchableOpacity
                                    style={[
                                        styles.mainButtonWrapper,
                                        loading && styles.mainButtonDisabled,
                                    ]}
                                    onPress={handleVerifyCode}
                                    disabled={loading || resending || showVerifySuccess}
                                    activeOpacity={0.9}
                                >
                                    <LinearGradient
                                        colors={[
                                            "rgba(154,33,28,0.98)",
                                            "rgba(118,23,19,0.98)",
                                        ]}
                                        start={{ x: 0.15, y: 0 }}
                                        end={{ x: 0.9, y: 1 }}
                                        style={styles.buttonGradient}
                                    >
                                        <View style={styles.buttonGlassTop} />

                                        <View style={styles.loadingRow}>
                                            {loading ? (
                                                <ActivityIndicator
                                                    size="small"
                                                    color={COLORS.white}
                                                    style={styles.loadingSpinner}
                                                />
                                            ) : null}

                                            <Text style={styles.buttonText}>
                                                {loading ? t.verifying : t.verifyCode}
                                            </Text>
                                        </View>
                                    </LinearGradient>
                                </TouchableOpacity>

                                {renderResendArea()}
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </KeyboardAvoidingView>
            </SafeAreaView>

            {showVerifySuccess ? (
                <View style={styles.verifySuccessOverlay} pointerEvents="none">
                    <View style={styles.verifySuccessBox}>
                        <Ionicons
                            name="checkmark-circle"
                            size={58}
                            color={COLORS.success}
                        />

                        <Text style={styles.verifySuccessTitle}>
                            {source === "forgot-password"
                                ? "تم التحقق من الرمز بنجاح"
                                : "تم التحقق من بريدك الإلكتروني بنجاح"}
                        </Text>

                        <Text style={styles.verifySuccessSubtitle}>
                            {source === "forgot-password"
                                ? "سيتم توجيهك لإعادة تعيين كلمة المرور"
                                : "سيتم توجيهك لتسجيل الدخول"}
                        </Text>
                    </View>
                </View>
            ) : null}

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
    buttonHeight,
    buttonRadius,
    otpBoxSize,
    otpBoxHeight,
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
    buttonHeight: number;
    buttonRadius: number;
    otpBoxSize: number;
    otpBoxHeight: number;
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

        safeArea: {
            flex: 1,
            backgroundColor: COLORS.screenBackground,
        },

        keyboardAvoidingView: {
            flex: 1,
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
            marginBottom: isVerySmallScreen ? 18 : 22,
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
            marginBottom: isVerySmallScreen ? 24 : isSmallScreen ? 30 : 34,
            paddingHorizontal: clamp(width * 0.02, 8, 14),
        },

        title: {
            fontSize: isVerySmallScreen ? 24 : isSmallScreen ? 26 : 27,
            fontWeight: "900",
            color: COLORS.title,
            textAlign: "center",
            letterSpacing: -0.4,
            lineHeight: isVerySmallScreen ? 33 : 37,
            textShadowColor: "rgba(255,255,255,0.95)",
            textShadowOffset: { width: 0, height: 2 },
            textShadowRadius: 12,
        },

        subtitle: {
            marginTop: isVerySmallScreen ? 9 : 12,
            fontSize: isVerySmallScreen ? 14.5 : 15.5,
            lineHeight: isVerySmallScreen ? 22 : 25,
            color: "#6C5B58",
            fontWeight: "800",
            textAlign: "center",
            maxWidth: clamp(width * 0.9, 300, 360),
            textShadowColor: "rgba(255,255,255,0.90)",
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 10,
        },

        emailText: {
            marginTop: 8,
            fontSize: isVerySmallScreen ? 14 : 15,
            color: COLORS.primaryText,
            fontWeight: "900",
            textAlign: "center",
        },

        otpArea: {
            width: "100%",
            paddingHorizontal: 2,
        },

        inputLabel: {
            color: COLORS.label,
            fontSize: isVerySmallScreen ? 14 : 15,
            fontWeight: "800",
            textAlign: "right",
            marginBottom: 9,
        },

        otpRow: {
            width: "100%",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: isVerySmallScreen ? 12 : 14,
        },

        otpBoxWrapper: {
            width: otpBoxSize,
            height: otpBoxHeight,
            borderRadius: 16,
            backgroundColor: COLORS.white,
            borderWidth: 1.7,
            borderColor: COLORS.border,
            justifyContent: "center",
            alignItems: "center",
            shadowColor: COLORS.shadowGray,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: Platform.OS === "android" ? 0.14 : 0.2,
            shadowRadius: 4,
            elevation: 3,
        },

        otpBoxFilled: {
            borderColor: "rgba(154,33,28,0.48)",
            backgroundColor: "rgba(154,33,28,0.055)",
        },

        otpBoxFocused: {
            borderColor: COLORS.primary,
            backgroundColor: "rgba(154,33,28,0.08)",
            shadowColor: COLORS.primaryDark,
            shadowOffset: { width: 0, height: 5 },
            shadowOpacity: Platform.OS === "android" ? 0.2 : 0.25,
            shadowRadius: 10,
            elevation: 6,
        },

        otpBoxError: {
            borderColor: "rgba(154,33,28,0.62)",
            backgroundColor: "rgba(154,33,28,0.055)",
        },

        otpInput: {
            width: "100%",
            height: "100%",
            fontSize: isVerySmallScreen ? 22 : 25,
            fontWeight: "900",
            color: COLORS.inputText,
            textAlign: "center",
            paddingVertical: 0,
            backgroundColor: "transparent",
        },

        otpInputFilled: {
            color: COLORS.primaryText,
        },

        messagePlaceholder: {
            height: isVerySmallScreen ? 42 : 46,
        },

        messageBoxError: {
            width: "100%",
            minHeight: isVerySmallScreen ? 48 : 52,
            flexDirection: "row-reverse",
            alignItems: "center",
            marginTop: 0,
            paddingHorizontal: isVerySmallScreen ? 14 : 16,
            paddingVertical: isVerySmallScreen ? 9 : 10,
            borderRadius: 22,
            backgroundColor: "#F5F5F5",
            borderWidth: 1.1,
            borderColor: "rgba(170,170,170,0.45)",
            gap: 7,
        },

        messageBoxInfo: {
            width: "100%",
            minHeight: isVerySmallScreen ? 48 : 52,
            flexDirection: "row-reverse",
            alignItems: "center",
            marginTop: 0,
            paddingHorizontal: isVerySmallScreen ? 14 : 16,
            paddingVertical: isVerySmallScreen ? 9 : 10,
            borderRadius: 22,
            backgroundColor: "#F5F5F5",
            borderWidth: 1.1,
            borderColor: "rgba(170,170,170,0.45)",
            gap: 7,
        },

        messageTextInfo: {
            color: "#6C5B58",
            fontSize: isVerySmallScreen ? 13.8 : 15,
            fontWeight: "900",
            textAlign: "right",
            flex: 1,
            lineHeight: isVerySmallScreen ? 19 : 21,
        },

        messageTextError: {
            color: COLORS.primary,
            fontSize: isVerySmallScreen ? 12.8 : 13.5,
            fontWeight: "800",
            textAlign: "right",
            flex: 1,
            lineHeight: isVerySmallScreen ? 18 : 20,
        },

        bottomArea: {
            marginTop: "auto",
            alignItems: "center",
            paddingTop: isVerySmallScreen ? 14 : 20,
            paddingBottom: isVerySmallScreen ? 4 : 8,
        },

        mainButtonWrapper: {
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

        mainButtonDisabled: {
            opacity: 0.72,
        },

        buttonGradient: {
            flex: 1,
            borderRadius: buttonRadius,
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
            borderTopLeftRadius: buttonRadius,
            borderTopRightRadius: buttonRadius,
            backgroundColor: "rgba(255,255,255,0.10)",
            zIndex: 1,
        },

        loadingRow: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 5,
        },

        loadingSpinner: {
            marginRight: 8,
            transform: [{ scale: isVerySmallScreen ? 0.85 : 0.95 }],
        },

        buttonText: {
            color: COLORS.white,
            textAlign: "center",
            fontSize: isVerySmallScreen ? 18.5 : 20,
            fontWeight: "900",
            zIndex: 5,
        },

        timerBox: {
            marginTop: isVerySmallScreen ? 12 : 14,
            width: "100%",
            minHeight: isVerySmallScreen ? 48 : 52,
            paddingHorizontal: isVerySmallScreen ? 14 : 16,
            paddingVertical: isVerySmallScreen ? 9 : 10,
            borderRadius: 22,
            backgroundColor: "#F5F5F5",
            borderWidth: 1.1,
            borderColor: "rgba(170,170,170,0.45)",
            flexDirection: "row-reverse",
            alignItems: "center",
            justifyContent: "center",
            gap: 7,
        },

        timerText: {
            flexShrink: 1,
            color: "#6C5B58",
            fontSize: isVerySmallScreen ? 13.8 : 15,
            fontWeight: "900",
            textAlign: "center",
            lineHeight: isVerySmallScreen ? 19 : 21,
        },

        resendRow: {
            marginTop: isVerySmallScreen ? 12 : 14,
            flexDirection: "row-reverse",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            flexWrap: "wrap",
        },

        resendQuestion: {
            color: "rgba(87, 87, 87, 1)",
            fontSize: isVerySmallScreen ? 16 : 17,
            fontWeight: "700",
        },

        resendText: {
            color: COLORS.primaryText,
            fontSize: isVerySmallScreen ? 16 : 17,
            fontWeight: "900",
            textDecorationLine: "none",
        },

        verifySuccessOverlay: {
            ...StyleSheet.absoluteFillObject,
            zIndex: 90,
            backgroundColor: "rgba(255,255,255,0.72)",
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 28,
        },

        verifySuccessBox: {
            width: "100%",
            maxWidth: 330,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 22,
            paddingVertical: 24,
            borderRadius: 24,
            backgroundColor: "#F5F5F5",
            borderWidth: 1.1,
            borderColor: "rgba(170,170,170,0.45)",
            shadowColor: COLORS.shadowGray,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: Platform.OS === "android" ? 0.12 : 0.18,
            shadowRadius: 16,
            elevation: 8,
        },

        verifySuccessTitle: {
            marginTop: 12,
            color: COLORS.primaryText,
            fontSize: isVerySmallScreen ? 16 : 17,
            fontWeight: "900",
            textAlign: "center",
            lineHeight: isVerySmallScreen ? 22 : 24,
        },

        verifySuccessSubtitle: {
            marginTop: 6,
            color: "#6C5B58",
            fontSize: isVerySmallScreen ? 13.2 : 14,
            fontWeight: "800",
            textAlign: "center",
            lineHeight: isVerySmallScreen ? 19 : 21,
        },

        transitionOverlay: {
            ...StyleSheet.absoluteFillObject,
            zIndex: 100,
            backgroundColor: COLORS.screenBackground,
        },
    });
}