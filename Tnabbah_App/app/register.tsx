import { useMemo, useState } from "react";
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
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Feather, Ionicons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

// تخلي المقاسات مرنة لكن ما تصغر أو تكبر بزيادة
const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

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

  // نعرف لو الشاشة صغيرة
  const isSmallScreen = height < 720;
  const isVerySmallScreen = height < 650;

  // مقاسات مرنة حسب حجم الجهاز
  const horizontalPadding = clamp(width * 0.06, 18, 24);

  const backButtonSize = isVerySmallScreen ? 48 : 52;
  const backButtonRadius = backButtonSize / 2;

  const topSpacing = clamp(height * 0.045, 16, 34);
  const bottomSpacing = clamp(height * 0.035, 18, 30);

  const inputHeight = isVerySmallScreen ? 58 : 62;
  const inputRadius = inputHeight / 2;

  const buttonHeight = isVerySmallScreen ? 58 : 66;
  const buttonRadius = buttonHeight / 2;

  const dividerLineWidth = clamp(width * 0.22, 72, 92);

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
        dividerLineWidth,
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
      dividerLineWidth,
      isSmallScreen,
      isVerySmallScreen,
      insets.top,
    ]
  );

  const validatePassword = () => {
    const hasMinLength = password.length >= 6;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    if (!password.trim()) {
      setErrorMessage("اكتبي كلمة المرور");
      return false;
    }

    if (!hasMinLength) {
      setErrorMessage("كلمة المرور لازم تكون 6 خانات على الأقل");
      return false;
    }

    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      setErrorMessage("كلمة المرور لازم تحتوي على حرف كبير، حرف صغير، ورقم");
      return false;
    }

    setErrorMessage("");
    return true;
  };

  const handleRegister = async () => {
    try {
      if (!fullName.trim()) {
        setErrorMessage("");
        return Alert.alert("خطأ", "أدخلي الاسم الكامل");
      }

      if (!email.trim()) {
        setErrorMessage("");
        return Alert.alert("خطأ", "أدخلي البريد الإلكتروني");
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
          emailRedirectTo:
            "https://qzhnghwmgujgthbkivdi.supabase.co/auth/v1/callback",
        },
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      if (data.user) {
        const { error: profileError } = await supabase
          .from("profiles")
          .upsert({
            id: data.user.id,
            username: cleanEmail,
            full_name: cleanName,
            avatar_url: null,
            website: null,
          });

        if (profileError) {
          console.log("Profile Upsert Error:", profileError);
          Alert.alert(
            "تنبيه",
            "تم إنشاء الحساب، لكن الاسم لم يُحفظ في جدول profiles. راجعي صلاحيات Supabase."
          );
          return;
        }
      }

      setPassword("");
      setErrorMessage("");

      if (data.session) {
        router.replace("/connection-intro" as any);
      } else {
        Alert.alert("تم التسجيل", "تم إرسال رابط التفعيل إلى بريدك 📩");
        router.replace("/login");
      }
    } catch (err) {
      console.log(err);
      setErrorMessage("صار خطأ غير متوقع، حاولي مرة أخرى");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={["#FFFFFF", "#FFF8F7", "#FFF1EE"]}
      locations={[0, 0.6, 1]}
      start={{ x: 0.15, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={styles.container}
    >
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
              {/* زر الرجوع بنفس شكل باقي الواجهات */}
              <TouchableOpacity
                style={styles.backButtonWrapper}
                activeOpacity={0.82}
                onPress={() => router.back()}
              >
                <LinearGradient
                  colors={[
                    "rgba(255,255,255,0.96)",
                    "rgba(255,241,238,0.86)",
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.backButtonGradient}
                >
                  <Ionicons
                    name="chevron-back"
                    size={isVerySmallScreen ? 21 : 23}
                    color="#871B17"
                  />
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.content}>
                <Text style={styles.title}>إنشاء حساب جديد</Text>

                <Text style={styles.subtitle}>
                  انضم إلى تنبه وابدأ متابعة سيارتك
                </Text>

                <View style={styles.formArea}>
                  {/* الاسم الكامل */}
                  <LinearGradient
                    colors={[
                      "rgba(255,255,255,0.96)",
                      "rgba(255,241,238,0.86)",
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.inputBox}
                  >
                    <Feather
                      name="user"
                      size={isVerySmallScreen ? 21 : 22}
                      color="#7C6A6A"
                      style={styles.inputIcon}
                    />

                    <TextInput
                      style={styles.input}
                      placeholder="الاسم الكامل"
                      placeholderTextColor="#7C6A6A"
                      value={fullName}
                      onChangeText={(text) => {
                        setFullName(text);
                        setErrorMessage("");
                      }}
                      textAlign="right"
                      returnKeyType="next"
                    />
                  </LinearGradient>

                  {/* البريد الإلكتروني */}
                  <LinearGradient
                    colors={[
                      "rgba(255,255,255,0.96)",
                      "rgba(255,241,238,0.86)",
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.inputBox}
                  >
                    <Feather
                      name="mail"
                      size={isVerySmallScreen ? 21 : 22}
                      color="#7C6A6A"
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
                      onChangeText={(text) => {
                        setEmail(text);
                        setErrorMessage("");
                      }}
                      textAlign="right"
                      returnKeyType="next"
                    />
                  </LinearGradient>

                  {/* كلمة المرور */}
                  <LinearGradient
                    colors={[
                      errorMessage
                        ? "rgba(255,245,245,0.96)"
                        : "rgba(255,255,255,0.96)",
                      errorMessage
                        ? "rgba(255,238,238,0.90)"
                        : "rgba(255,241,238,0.86)",
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[
                      styles.inputBox,
                      errorMessage && styles.inputBoxError,
                    ]}
                  >
                    <Feather
                      name="lock"
                      size={isVerySmallScreen ? 22 : 23}
                      color={errorMessage ? "#D32F2F" : "#7C6A6A"}
                      style={styles.inputIcon}
                    />

                    <TextInput
                      style={styles.input}
                      placeholder="كلمة المرور"
                      placeholderTextColor="#7C6A6A"
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
                    />

                    <TouchableOpacity
                      style={styles.eyeButton}
                      activeOpacity={0.7}
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <Ionicons
                        name={showPassword ? "eye-outline" : "eye-off-outline"}
                        size={isVerySmallScreen ? 21 : 22}
                        color="#7C6A6A"
                      />
                    </TouchableOpacity>
                  </LinearGradient>

                  {errorMessage ? (
                    <View style={styles.errorBox}>
                      <Ionicons
                        name="alert-circle"
                        size={isVerySmallScreen ? 17 : 18}
                        color="#D32F2F"
                      />
                      <Text style={styles.errorText}>{errorMessage}</Text>
                    </View>
                  ) : null}
                </View>
              </View>

              <View style={styles.buttonsArea}>
                {/* زر التسجيل بنفس تنسيق باقي الواجهات */}
                <TouchableOpacity
                  style={[
                    styles.registerButtonWrapper,
                    loading && { opacity: 0.55 },
                  ]}
                  onPress={handleRegister}
                  disabled={loading}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={[
                      "rgba(139, 26, 23, 0.98)",
                      "rgba(110, 20, 17, 0.98)",
                    ]}
                    start={{ x: 0.2, y: 0 }}
                    end={{ x: 0.8, y: 1 }}
                    style={styles.registerGradient}
                  >
                    <View style={styles.registerGlassTop} />

                    <Text style={styles.registerText}>
                      {loading ? "جاري التسجيل..." : "تسجيل حساب جديد"}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>أو</Text>
                  <View style={styles.dividerLine} />
                </View>

                <View style={styles.loginRow}>
                  <Text style={styles.linkLight}>لديك حساب بالفعل؟</Text>

                  <TouchableOpacity
                    onPress={() => router.push("/login")}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.linkBold}>تسجيل الدخول</Text>
                  </TouchableOpacity>
                </View>
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
  dividerLineWidth,
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
  dividerLineWidth: number;
  isSmallScreen: boolean;
  isVerySmallScreen: boolean;
  safeTop: number;
}) {
  return StyleSheet.create({
    container: {
      flex: 1,
      overflow: "hidden",
    },

    safeArea: {
      flex: 1,
    },

    keyboardAvoidingView: {
      flex: 1,
    },

    scrollContent: {
      flexGrow: 1,
    },

    screenContent: {
      flex: 1,
      minHeight: "100%",
      paddingHorizontal: horizontalPadding,
      paddingTop: topSpacing,
      paddingBottom: bottomSpacing,
    },

    // زر الرجوع
    backButtonWrapper: {
      position: "absolute",
      top: safeTop + topSpacing,
      left: horizontalPadding,
      width: backButtonSize,
      height: backButtonSize,
      borderRadius: backButtonRadius,
      zIndex: 10,

      shadowColor: "#871B17",
      shadowOffset: { width: 0, height: 7 },
      shadowOpacity: 0.11,
      shadowRadius: 15,
      elevation: 4,
    },

    backButtonGradient: {
      flex: 1,
      width: backButtonSize,
      height: backButtonSize,
      borderRadius: backButtonRadius,
      borderWidth: 1,
      borderColor: "rgba(135, 27, 23, 0.16)",
      alignItems: "center",
      justifyContent: "center",
    },

    content: {
      zIndex: 5,
      paddingTop: isVerySmallScreen ? 88 : isSmallScreen ? 100 : 112,
    },

    title: {
      fontSize: isVerySmallScreen ? 26 : isSmallScreen ? 29 : 31,
      fontWeight: "900",
      color: "#2E1D1D",
      textAlign: "center",
      letterSpacing: -0.4,
    },

    subtitle: {
      marginTop: isVerySmallScreen ? 12 : 18,
      marginBottom: isVerySmallScreen ? 28 : isSmallScreen ? 36 : 48,
      fontSize: isVerySmallScreen ? 14.5 : 16,
      color: "#7C6A6A",
      fontWeight: "600",
      textAlign: "center",
    },

    formArea: {
      width: "100%",
    },

    inputBox: {
      width: "100%",
      height: inputHeight,
      borderRadius: inputRadius,
      borderWidth: 1.2,
      borderColor: "rgba(135, 27, 23, 0.16)",
      marginBottom: isVerySmallScreen ? 14 : 18,
      paddingHorizontal: isVerySmallScreen ? 18 : 22,
      flexDirection: "row-reverse",
      alignItems: "center",

      shadowColor: "#871B17",
      shadowOffset: { width: 0, height: 7 },
      shadowOpacity: 0.07,
      shadowRadius: 14,
      elevation: 3,
    },

    inputBoxError: {
      borderColor: "rgba(211, 47, 47, 0.55)",
    },

    inputIcon: {
      marginLeft: isVerySmallScreen ? 11 : 13,
    },

    input: {
      flex: 1,
      fontSize: isVerySmallScreen ? 16 : 17,
      color: "#2E1D1D",
      fontWeight: "600",
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

    errorBox: {
      flexDirection: "row-reverse",
      alignItems: "center",
      alignSelf: "flex-end",
      marginTop: -6,
      marginBottom: isVerySmallScreen ? 4 : 8,
      paddingHorizontal: isVerySmallScreen ? 12 : 14,
      paddingVertical: isVerySmallScreen ? 8 : 10,
      borderRadius: 18,
      backgroundColor: "rgba(211, 47, 47, 0.08)",
      borderWidth: 1,
      borderColor: "rgba(211, 47, 47, 0.18)",
      gap: 7,
    },

    errorText: {
      color: "#D32F2F",
      fontSize: isVerySmallScreen ? 12.5 : 13.5,
      fontWeight: "800",
      textAlign: "right",
      flexShrink: 1,
    },

    buttonsArea: {
      marginTop: "auto",
      paddingTop: isVerySmallScreen ? 18 : 28,
      zIndex: 8,
    },

    registerButtonWrapper: {
      width: "100%",
      height: buttonHeight,
      borderRadius: buttonRadius,
      overflow: "hidden",
      marginBottom: isVerySmallScreen ? 20 : 28,

      shadowColor: "#6E1411",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.22,
      shadowRadius: 18,
      elevation: 6,
    },

    registerGradient: {
      flex: 1,
      borderRadius: buttonRadius,
      justifyContent: "center",
      alignItems: "center",
      overflow: "hidden",
    },

    registerGlassTop: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: "46%",
      borderTopLeftRadius: buttonRadius,
      borderTopRightRadius: buttonRadius,
      backgroundColor: "rgba(255,255,255,0.07)",
      zIndex: 1,
    },

    registerText: {
      color: "#FFFFFF",
      textAlign: "center",
      fontSize: isVerySmallScreen ? 18 : 20,
      fontWeight: "800",
      zIndex: 5,
    },

    dividerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: isVerySmallScreen ? 16 : 22,
    },

    dividerLine: {
      width: dividerLineWidth,
      height: 1,
      backgroundColor: "#E0BDBD",
    },

    dividerText: {
      marginHorizontal: isVerySmallScreen ? 12 : 16,
      fontSize: isVerySmallScreen ? 14 : 15,
      color: "#7C6A6A",
      fontWeight: "700",
    },

    loginRow: {
      flexDirection: "row-reverse",
      justifyContent: "center",
      alignItems: "center",
      columnGap: 5,
    },

    linkLight: {
      color: "#7C6A6A",
      fontWeight: "600",
      fontSize: isVerySmallScreen ? 14.5 : 15.5,
    },

    linkBold: {
      color: "#871B17",
      fontWeight: "900",
      fontSize: isVerySmallScreen ? 14.5 : 15.5,
    },
  });
}