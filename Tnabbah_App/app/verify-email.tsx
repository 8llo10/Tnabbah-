import { useMemo, useRef, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
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
    primary: "#9A211C",
    primaryDark: "#761713",
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

export default function VerifyEmailScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();

    const email = String(params.email || "");
    const fullName = String(params.fullName || "");
    const source = String(params.source || "register");

    const [code, setCode] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);

    const transitionAnim = useRef(new Animated.Value(0)).current;

    const isSmallScreen = height < 720;
    const isVerySmallScreen = height < 650;

    const horizontalPadding = clamp(width * 0.055, 18, 24);
    const inputHeight = isVerySmallScreen ? 62 : 68;
    const inputRadius = inputHeight / 2;
    const buttonHeight = isVerySmallScreen ? 58 : 64;

    const styles = useMemo(
        () =>
            createStyles({
                horizontalPadding,
                inputHeight,
                inputRadius,
                buttonHeight,
                isSmallScreen,
                isVerySmallScreen,
                safeTop: insets.top,
                height,
            }),
        [
            horizontalPadding,
            inputHeight,
            inputRadius,
            buttonHeight,
            isSmallScreen,
            isVerySmallScreen,
            insets.top,
            height,
        ]
    );

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

    const handleVerifyCode = async () => {
        const cleanCode = code.trim();

        if (!email) {
            setErrorMessage("البريد الإلكتروني غير موجود، ارجعي وسجلي مرة ثانية");
            return;
        }

        if (!cleanCode) {
            setErrorMessage("أدخلي رمز التحقق");
            return;
        }

        if (cleanCode.length < 8) {
            setErrorMessage("رمز التحقق غير مكتمل");
            return;
        }

        try {
            setLoading(true);
            setErrorMessage("");

            const { data, error } = await supabase.auth.verifyOtp({
                email,
                token: cleanCode,
                type: "signup",
            });

            if (error) {
                setErrorMessage("رمز التحقق غير صحيح أو انتهت صلاحيته");
                return;
            }

            if (data.user) {
                const { error: profileError } = await supabase.from("profiles").upsert({
                    id: data.user.id,
                    username: email,
                    full_name: fullName,
                    avatar_url: null,
                    website: null,
                });

                if (profileError) {
                    console.log("Profile Upsert Error:", profileError);
                }
            }

            setCode("");

            if (source === "forgot-password") {
                smoothReplace("/forgot-password");
            } else {
                smoothReplace("/login");
            }
        } catch (err) {
            console.log(err);
            setErrorMessage("صار خطأ غير متوقع، حاولي مرة أخرى");
        } finally {
            setLoading(false);
        }
    };

    const handleResendCode = async () => {
        if (!email) {
            setErrorMessage("البريد الإلكتروني غير موجود");
            return;
        }

        try {
            setResending(true);
            setErrorMessage("");

            const { error } = await supabase.auth.resend({
                type: "signup",
                email,
            });

            if (error) {
                console.log("RESEND CODE ERROR:", error);

                const message = error.message?.toLowerCase() || "";

                // إذا وصل حد الإرسال
                if (message.includes("rate limit")) {
                    setErrorMessage(
                        "تم إرسال رمز مسبقًا، تحققي من بريدك الإلكتروني"
                    );
                    return;
                }

                setErrorMessage("تعذر إرسال رمز جديد، حاولي بعد قليل");
                return;
            }

            setErrorMessage("تم إرسال رمز جديد إلى بريدك");
        } catch (err) {
            console.log(err);
            setErrorMessage("تعذر إرسال رمز جديد، حاولي مرة أخرى");
        } finally {
            setResending(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

            <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
                <KeyboardAvoidingView
                    style={styles.keyboardAvoidingView}
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                >
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >
                        <View style={styles.screenContent}>
                            <View style={styles.backArea}>
                                <TouchableOpacity
                                    style={styles.backButtonWrapper}
                                    activeOpacity={0.85}
                                    onPress={() => router.back()}
                                    disabled={loading || resending}
                                >
                                    <Ionicons name="chevron-back" size={23} color={COLORS.shadowGray} />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.titleArea}>
                                <View style={styles.iconCircle}>
                                    <Feather name="mail" size={32} color={COLORS.primary} />
                                </View>

                                <Text style={styles.title}>رمز التحقق</Text>

                                <Text style={styles.subtitle}>
                                    أرسلنا رمز التحقق إلى بريدك الإلكتروني
                                </Text>

                                <Text style={styles.emailText}>{email}</Text>
                            </View>

                            <View style={styles.formArea}>
                                <Text style={styles.inputLabel}>أدخلي الرمز</Text>

                                <View
                                    style={[
                                        styles.inputWrapper,
                                        errorMessage && !errorMessage.includes("تم إرسال") && styles.inputWrapperError,
                                    ]}
                                >
                                    <TextInput
                                        style={styles.input}
                                        placeholder="00000000"
                                        placeholderTextColor={COLORS.placeholder}
                                        keyboardType="number-pad"
                                        value={code}
                                        onChangeText={(text) => {
                                            const onlyNumbers = text.replace(/[^0-9]/g, "").slice(0, 8);
                                            setCode(onlyNumbers);
                                            setErrorMessage("");
                                        }}
                                        textAlign="center"
                                        maxLength={8}
                                        editable={!loading && !resending}
                                        selectionColor={COLORS.primary}
                                    />
                                </View>

                                {errorMessage ? (
                                    <View
                                        style={[
                                            styles.messageBox,
                                            errorMessage.includes("تم إرسال") && styles.successBox,
                                        ]}
                                    >
                                        <Ionicons
                                            name={
                                                errorMessage.includes("تم إرسال")
                                                    ? "checkmark-circle"
                                                    : "alert-circle"
                                            }
                                            size={19}
                                            color={COLORS.primary}
                                        />
                                        <Text style={styles.messageText}>{errorMessage}</Text>
                                    </View>
                                ) : null}

                                <TouchableOpacity
                                    style={[styles.verifyButtonWrapper, loading && styles.buttonDisabled]}
                                    onPress={handleVerifyCode}
                                    disabled={loading || resending}
                                    activeOpacity={0.9}
                                >
                                    <LinearGradient
                                        colors={["rgba(154,33,28,0.98)", "rgba(118,23,19,0.98)"]}
                                        start={{ x: 0.15, y: 0 }}
                                        end={{ x: 0.9, y: 1 }}
                                        style={styles.verifyGradient}
                                    >
                                        <View style={styles.loadingContent}>
                                            {loading ? (
                                                <ActivityIndicator
                                                    size="small"
                                                    color={COLORS.white}
                                                    style={styles.loadingSpinner}
                                                />
                                            ) : null}

                                            <Text style={styles.verifyButtonText}>
                                                {loading ? "جاري التحقق..." : "تأكيد الرمز"}
                                            </Text>
                                        </View>
                                    </LinearGradient>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.resendButton}
                                    onPress={handleResendCode}
                                    disabled={loading || resending}
                                    activeOpacity={0.75}
                                >
                                    {resending ? (
                                        <ActivityIndicator size="small" color={COLORS.primary} />
                                    ) : (
                                        <Text style={styles.resendText}>إرسال رمز جديد</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>

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
    inputHeight,
    inputRadius,
    buttonHeight,
    isSmallScreen,
    isVerySmallScreen,
    safeTop,
    height,
}: {
    horizontalPadding: number;
    inputHeight: number;
    inputRadius: number;
    buttonHeight: number;
    isSmallScreen: boolean;
    isVerySmallScreen: boolean;
    safeTop: number;
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

        scrollContent: {
            flexGrow: 1,
            backgroundColor: COLORS.screenBackground,
        },

        screenContent: {
            flex: 1,
            minHeight: height,
            paddingHorizontal: horizontalPadding,
            paddingTop: 8,
            paddingBottom: 24,
            backgroundColor: COLORS.screenBackground,
        },

        backArea: {
            width: "100%",
            paddingTop: safeTop + 2,
            alignItems: "flex-start",
            justifyContent: "center",
            marginBottom: isVerySmallScreen ? 34 : 44,
        },

        backButtonWrapper: {
            width: isVerySmallScreen ? 44 : 48,
            height: isVerySmallScreen ? 44 : 48,
            borderRadius: isVerySmallScreen ? 22 : 24,
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

        titleArea: {
            width: "100%",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: isVerySmallScreen ? 36 : isSmallScreen ? 44 : 54,
        },

        iconCircle: {
            width: isVerySmallScreen ? 78 : 86,
            height: isVerySmallScreen ? 78 : 86,
            borderRadius: isVerySmallScreen ? 39 : 43,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(154,33,28,0.08)",
            borderWidth: 1.5,
            borderColor: "rgba(154,33,28,0.14)",
            marginBottom: 22,
        },

        title: {
            fontSize: isVerySmallScreen ? 25 : 28,
            fontWeight: "900",
            color: COLORS.title,
            textAlign: "center",
            lineHeight: isVerySmallScreen ? 34 : 38,
        },

        subtitle: {
            marginTop: 14,
            fontSize: isVerySmallScreen ? 16 : 17.5,
            lineHeight: isVerySmallScreen ? 25 : 28,
            color: COLORS.textDark,
            fontWeight: "800",
            textAlign: "center",
        },

        emailText: {
            marginTop: 10,
            color: COLORS.primary,
            fontSize: isVerySmallScreen ? 14.5 : 15.5,
            fontWeight: "900",
            textAlign: "center",
        },

        formArea: {
            width: "100%",
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
            paddingHorizontal: 18,
            alignItems: "center",
            justifyContent: "center",
            shadowColor: COLORS.shadowGray,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: Platform.OS === "android" ? 0.16 : 0.22,
            shadowRadius: 4,
            elevation: 3,
        },

        inputWrapperError: {
            borderColor: "rgba(154,33,28,0.35)",
            backgroundColor: "rgba(154,33,28,0.015)",
        },

        input: {
            width: "100%",
            fontSize: isVerySmallScreen ? 28 : 32,
            color: COLORS.inputText,
            fontWeight: "900",
            letterSpacing: 10,
            paddingVertical: 0,
            minHeight: inputHeight - 8,
        },

        messageBox: {
            width: "100%",
            flexDirection: "row-reverse",
            alignItems: "center",
            justifyContent: "flex-start",
            marginTop: 16,
            marginBottom: 18,
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderRadius: 22,
            backgroundColor: "rgba(154,33,28,0.07)",
            borderWidth: 1.2,
            borderColor: "rgba(154,33,28,0.16)",
            gap: 8,
        },

        successBox: {
            backgroundColor: "rgba(154,33,28,0.05)",
        },

        messageText: {
            flex: 1,
            color: COLORS.primary,
            fontSize: isVerySmallScreen ? 13.2 : 14,
            fontWeight: "800",
            textAlign: "right",
            lineHeight: 22,
        },

        verifyButtonWrapper: {
            width: "100%",
            height: buttonHeight,
            borderRadius: 30,
            overflow: "hidden",
            shadowColor: "#6E1411",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: Platform.OS === "android" ? 0.18 : 0.24,
            shadowRadius: 14,
            elevation: 6,
            backgroundColor: COLORS.primary,
            marginTop: 4,
        },

        buttonDisabled: {
            opacity: 0.72,
        },

        verifyGradient: {
            flex: 1,
            borderRadius: 30,
            justifyContent: "center",
            alignItems: "center",
        },

        loadingContent: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
        },

        loadingSpinner: {
            marginRight: 8,
        },

        verifyButtonText: {
            color: COLORS.white,
            fontSize: isVerySmallScreen ? 19 : 21,
            fontWeight: "900",
            textAlign: "center",
        },

        resendButton: {
            marginTop: 24,
            alignSelf: "center",
            paddingVertical: 10,
            paddingHorizontal: 18,
        },

        resendText: {
            color: COLORS.primary,
            fontSize: isVerySmallScreen ? 15 : 16,
            fontWeight: "900",
            textAlign: "center",
        },

        transitionOverlay: {
            ...StyleSheet.absoluteFillObject,
            zIndex: 100,
            backgroundColor: COLORS.screenBackground,
        },
    });
}