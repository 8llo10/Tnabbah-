import * as Linking from "expo-linking";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { supabase } from "../../lib/supabase";

export default function AuthCallback() {
  const [statusText, setStatusText] = useState(
    "جاري تأكيد تغيير البريد الإلكتروني..."
  );

  useEffect(() => {
    const finish = async () => {
      try {
        const url = await Linking.getInitialURL();

        if (!url) {
          setStatusText("لم يتم العثور على رابط التأكيد.");
          setTimeout(() => router.replace("/start" as any), 1600);
          return;
        }

        const parsedUrl = new URL(url);
        const code = parsedUrl.searchParams.get("code");

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            console.log("exchangeCodeForSession error:", error.message);
            setStatusText("تعذر تأكيد البريد. حاولي فتح الرابط مرة أخرى.");
            setTimeout(() => router.replace("/start" as any), 1800);
            return;
          }
        }

        const { data, error: userError } = await supabase.auth.getUser();

        if (userError) {
          console.log("getUser after callback error:", userError.message);
        }

        console.log("User email after callback:", data.user?.email);

        setStatusText("تم تأكيد الرابط. يمكنك الآن استخدام البريد الجديد.");

        setTimeout(() => {
          router.replace("/start" as any);
        }, 1800);
      } catch (error: any) {
        console.log("Auth callback error:", error?.message ?? error);
        setStatusText("حدث خطأ أثناء تأكيد البريد.");
        setTimeout(() => router.replace("/start" as any), 1800);
      }
    };

    finish();
  }, []);

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#FFFFFF",
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
  );
}