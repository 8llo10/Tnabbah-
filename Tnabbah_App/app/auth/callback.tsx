import * as Linking from "expo-linking";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Platform,
  StatusBar,
  Text,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import LottieView from "lottie-react-native";
import { supabase } from "../../lib/supabase";

const EMAIL_CHANGE_PENDING_KEY = "settings_email_change_pending";
const EMAIL_CHANGE_TARGET_KEY = "settings_email_change_target_email";
const EMAIL_CHANGE_SUCCESS_SHOWN_KEY = "settings_email_change_success_shown";

export default function AuthCallback() {
  const params = useLocalSearchParams<{
    code?: string;
    email?: string;
    type?: string;
  }>();

  const handledRef = useRef(false);
  const successLottieRef = useRef<LottieView>(null);

  const popupScale = useRef(new Animated.Value(0.88)).current;
  const popupOpacity = useRef(new Animated.Value(0)).current;

  const [statusText, setStatusText] = useState(
    "جاري تأكيد تغيير البريد الإلكتروني..."
  );

  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  const playSuccessPopup = () => {
    setShowSuccessPopup(true);

    popupScale.setValue(0.88);
    popupOpacity.setValue(0);

    requestAnimationFrame(() => {
      successLottieRef.current?.reset();
      successLottieRef.current?.play(0);

      Animated.parallel([
        Animated.timing(popupOpacity, {
          toValue: 1,
          duration: 120,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(popupScale, {
          toValue: 1,
          friction: 7,
          tension: 95,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  useEffect(() => {
    const getValueFromParams = (value: string | string[] | undefined) => {
      if (typeof value === "string") return value;
      if (Array.isArray(value) && typeof value[0] === "string") return value[0];
      return "";
    };

    const getCodeFromUrl = (url?: string | null) => {
      if (!url) return "";

      try {
        const parsedUrl = new URL(url);
        return parsedUrl.searchParams.get("code") || "";
      } catch {
        const parsed = Linking.parse(url);
        const queryParams = parsed.queryParams || {};
        const codeValue = queryParams.code;

        if (typeof codeValue === "string") return codeValue;
        if (Array.isArray(codeValue) && typeof codeValue[0] === "string") {
          return codeValue[0];
        }

        return "";
      }
    };

    const getTargetEmailFromUrl = (url?: string | null) => {
      if (!url) return "";

      try {
        const parsedUrl = new URL(url);
        return (
          parsedUrl.searchParams.get("email") ||
          parsedUrl.searchParams.get("new_email") ||
          ""
        );
      } catch {
        const parsed = Linking.parse(url);
        const queryParams = parsed.queryParams || {};
        const emailValue = queryParams.email || queryParams.new_email;

        if (typeof emailValue === "string") return emailValue;
        if (Array.isArray(emailValue) && typeof emailValue[0] === "string") {
          return emailValue[0];
        }

        return "";
      }
    };

    const saveEmailChangeFlags = async (confirmedEmail?: string) => {
      const values: [string, string][] = [
        [EMAIL_CHANGE_PENDING_KEY, "false"],
        [EMAIL_CHANGE_SUCCESS_SHOWN_KEY, "true"],
      ];

      if (confirmedEmail?.trim()) {
        values.push([
          EMAIL_CHANGE_TARGET_KEY,
          confirmedEmail.trim().toLowerCase(),
        ]);
      }

      await AsyncStorage.multiSet(values);
    };

    const finish = async () => {
      if (handledRef.current) return;
      handledRef.current = true;

      try {
        const initialUrl = await Linking.getInitialURL();

        const codeFromParams = getValueFromParams(params.code);
        const emailFromParams = getValueFromParams(params.email);

        const code = codeFromParams || getCodeFromUrl(initialUrl);
        const targetEmail = emailFromParams || getTargetEmailFromUrl(initialUrl);

        if (!initialUrl && !code) {
          setStatusText("لم يتم العثور على رابط التأكيد.");
          setTimeout(() => router.replace("/start" as any), 1600);
          return;
        }

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            console.log("exchangeCodeForSession error:", error.message);
            setStatusText("تعذر تأكيد البريد. حاولي فتح الرابط مرة أخرى.");
            setTimeout(() => router.replace("/start" as any), 1800);
            return;
          }
        }

        /**
         * أهم تعديل:
         * أول ما رابط التأكيد ينجح، نعرض pop-up النجاح مباشرة داخل شاشة callback.
         * ما ننتظر تحديث session ولا تحديث جدول profiles.
         */
        playSuccessPopup();

        const { data, error: userError } = await supabase.auth.getUser();

        if (userError) {
          console.log("getUser after callback error:", userError.message);
        }

        const confirmedEmail =
          data.user?.email?.trim().toLowerCase() ||
          targetEmail?.trim().toLowerCase() ||
          "";

        saveEmailChangeFlags(confirmedEmail).catch((storageError) => {
          console.log("Save email change flags error:", storageError);
        });

        if (data.user?.id && confirmedEmail) {
          supabase
            .from("profiles")
            .update({
              username: confirmedEmail,
              email: confirmedEmail,
              updated_at: new Date().toISOString(),
            })
            .eq("id", data.user.id)
            .then(({ error }) => {
              if (error) {
                console.log(
                  "Profile email sync from auth callback error:",
                  error.message
                );
              }
            });
        }

        setTimeout(() => {
          router.replace("/(tabs)/settings" as any);
        }, 1700);
      } catch (error: any) {
        console.log("Auth callback error:", error?.message ?? error);
        setStatusText("حدث خطأ أثناء تأكيد البريد.");
        setTimeout(() => router.replace("/start" as any), 1800);
      }
    };

    finish();
  }, [params.code, params.email, popupOpacity, popupScale]);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#FFFFFF",
      }}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#FFFFFF"
        translucent={false}
      />

      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <ActivityIndicator size="small" color="#871B17" />

        <Text
          style={{
            marginTop: 16,
            color: "#1D1D1F",
            fontSize: 16,
            fontWeight: "800",
            textAlign: "center",
            lineHeight: 24,
          }}
        >
          {statusText}
        </Text>
      </View>

      {showSuccessPopup ? (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            zIndex: 50,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 28,
            backgroundColor: "rgba(255,255,255,0.74)",
          }}
        >
          <Animated.View
            style={{
              width: "100%",
              maxWidth: 335,
              minHeight: 210,
              borderRadius: 28,
              backgroundColor: "#F7F7F7",
              borderWidth: 1.2,
              borderColor: "rgba(170,170,170,0.42)",
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 22,
              paddingTop: 24,
              paddingBottom: 24,
              shadowColor: "#8E8E8E",
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: Platform.OS === "android" ? 0.22 : 0.28,
              shadowRadius: 22,
              elevation: 10,
              opacity: popupOpacity,
              transform: [{ scale: popupScale }],
            }}
          >
            <LottieView
              ref={successLottieRef}
              source={require("../../assets/animations/success-check.json")}
              loop={false}
              speed={1.15}
              style={{
                width: 104,
                height: 104,
              }}
            />

            <Text
              style={{
                marginTop: 8,
                color: "#871B17",
                fontSize: 18,
                fontWeight: "900",
                textAlign: "center",
                lineHeight: 26,
              }}
            >
              تم تغيير البريد الإلكتروني بنجاح
            </Text>

            <Text
              style={{
                marginTop: 8,
                color: "#6C5B58",
                fontSize: 13.5,
                fontWeight: "700",
                textAlign: "center",
                lineHeight: 21,
              }}
            >
              تم تأكيد البريد الإلكتروني الجديد وتحديثه في حسابك.
            </Text>
          </Animated.View>
        </View>
      ) : null}
    </View>
  );
}
