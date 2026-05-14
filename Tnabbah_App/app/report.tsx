import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  StyleSheet,
  ActivityIndicator,
  Alert,
  BackHandler,
} from "react-native";
import { Feather as Icon } from "@expo/vector-icons";
import { useAuth } from "../providers/AuthProvider";
import { router, useLocalSearchParams } from "expo-router";
import { supabase } from "../lib/supabase";

const API_URL =
  process.env.EXPO_PUBLIC_DIAGNOSTICS_API || "http://127.0.0.1:8001";

const COLORS = {
  primary: "#871B17",
  primaryLight: "#9A3A33",
  primaryDark: "#5F130F",

  bg: "#FFFFFF",
  surface: "#FFFFFF",
  soft: "#F8F8F8",
  softGray: "#F3F4F6",
  border: "#EFEFEF",

  text: "#1D1D1F",
  muted: "#707070",
  mutedLight: "#A8A8A8",

  success: "#1F8A4C",
  successBg: "#EFFAF3",
  successBorder: "#D6F0DF",

  warning: "#B7791F",
  warningBg: "#FFF8E1",
  warningBorder: "#FDE68A",

  error: "#C62828",
  errorBg: "#FFF1F1",
  errorBorder: "#FFD9D9",

  critical: "#871B17",
  criticalBg: "#FFF1F1",
  criticalBorder: "rgba(135,27,23,0.18)",
};

const UI = {
  AR: {
    headerTitle: "تقرير تنبّه الذكي",
    reportId: "رقم التقرير:",
    sensorReadings: "قراءات المستشعرات",
    sensorsCount: (n: number) => `${n} حساس`,
    dtcs: "أكواد الأعطال المكتشفة",
    causes: "الأسباب المحتملة",
    likelihood: "احتمالية",
    confidence: "ثقة",
    smartAnalysisOn: "تحليل ذكي مُفعَّل",
    smartAnalysis: "تحليل ذكي",
    smartInsight: "تفسير ذكي",
    explanation: "التفسير",
    smartRecommendation: "التوصية الذكية",
    needsMechanic: "تحتاج لزيارة فنّي/ميكانيكي مختص",
    healthyTitle: "سيارتك بحالة ممتازة",
    issuesTitle: "تم اكتشاف ملاحظات",
    aiSummary: "تحليل تنبّه الذكي",
    plainSummary: "ملخص التحليل",
    statusWarning: "تحذير",
    statusNormal: "طبيعي",
    saved: "محفوظ",
    save: "حفظ دائم",
    footer: 'ملاحظة: هذا التقرير مقدم من "تنبّه" كدليل استرشادي ذكي.',
    notLoaded: "لم يتم تحميل التقرير",
    saveError: "فشل حفظ التقرير",
    saveSuccess: "تم حفظ التقرير بنجاح",
    saveErrorTitle: "خطأ",
    saveSuccessTitle: "تم الحفظ",
    loginRequired: "يجب تسجيل الدخول أولاً",
    error: "خطأ",
    translateFailedTitle: "فشل الترجمة",
    translateFailedMsg: "تعذّر ترجمة التقرير، حاول لاحقاً",
    unsavedTitle: "لم يتم حفظ التقرير",
    unsavedMessage:
      "سيتم الاحتفاظ بهذا التقرير لمدة 24 ساعة فقط ثم سيُحذف تلقائياً إذا لم تقم بحفظه بشكل دائم.",
    unsavedSave: "حفظ دائم",
    unsavedLeave: "خروج بدون حفظ",
    unsavedCancel: "إلغاء",
    severity: {
      LOW: "طبيعي",
      MEDIUM: "تحذير",
      HIGH: "مشكلة",
      CRITICAL: "مشكلة حرجة",
    } as Record<string, string>,
  },
  EN: {
    headerTitle: "Tnabbah Smart Report",
    reportId: "Report ID:",
    sensorReadings: "Sensor Readings",
    sensorsCount: (n: number) => `${n} sensors`,
    dtcs: "Detected Trouble Codes",
    causes: "Likely Causes",
    likelihood: "Likelihood",
    confidence: "Confidence",
    smartAnalysisOn: "Smart Analysis Enabled",
    smartAnalysis: "Smart Analysis",
    smartInsight: "Smart Insight",
    explanation: "Explanation",
    smartRecommendation: "Smart Recommendation",
    needsMechanic: "Visit a qualified technician/mechanic",
    healthyTitle: "Your car is in excellent condition",
    issuesTitle: "Issues Detected",
    aiSummary: "Tnabbah Smart Analysis",
    plainSummary: "Analysis Summary",
    statusWarning: "Warning",
    statusNormal: "Normal",
    saved: "Saved",
    save: "Save Permanently",
    footer: 'Note: This report is provided by "Tnabbah" as a smart guidance reference.',
    notLoaded: "Report not loaded",
    saveError: "Failed to save the report",
    saveSuccess: "Report saved successfully",
    saveErrorTitle: "Error",
    saveSuccessTitle: "Saved",
    loginRequired: "You must log in first",
    error: "Error",
    translateFailedTitle: "Translation Failed",
    translateFailedMsg: "Could not translate the report. Try again later.",
    unsavedTitle: "Report not saved",
    unsavedMessage:
      "This report will be kept for only 24 hours and then automatically deleted if you do not save it permanently.",
    unsavedSave: "Save Permanently",
    unsavedLeave: "Leave without saving",
    unsavedCancel: "Cancel",
    severity: {
      LOW: "Normal",
      MEDIUM: "Warning",
      HIGH: "Issue",
      CRITICAL: "Critical Issue",
    } as Record<string, string>,
  },
} as const;

const hasArabic = (s: any) =>
  typeof s === "string" && /[\u0600-\u06FF]/.test(s);

const DTC_CATEGORY_LABEL_AR: Record<
  "stored" | "pending" | "permanent",
  string
> = {
  stored: "أعطال موجودة فعلاً",
  pending: "مشكلة بدأت تظهر",
  permanent: "أعطال محفوظة بالنظام",
};

const ReportScreen = () => {
  const params = useLocalSearchParams();
  const { session } = useAuth();

  const [report, setReport] = useState<any>(null);
  const [sensorData, setSensorData] = useState<any[]>([]);
  const [dtcItems, setDtcItems] = useState<any[]>([]);
  const [causesData, setCausesData] = useState<any[]>([]);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [supabaseRowId, setSupabaseRowId] = useState<string | null>(null);
  const autoSaveTriedRef = useRef<string | null>(null);
  const [lang, setLang] = useState<"AR" | "EN">("AR");
  const [trMap, setTrMap] = useState<Record<string, string>>({});
  const [translating, setTranslating] = useState(false);

  const t = UI[lang];
  const isAR = lang === "AR";

  const tr = (s?: string | null): string => {
    if (!s) return "";
    if (lang === "AR") return s;
    return trMap[s] || s;
  };

  const parseReport = useCallback((parsed: any) => {
    try {
      setReport(parsed);

      const transformed = (parsed.all_pid_readings || []).map(
        (reading: any) => ({
          label:
            reading.name_ar ||
            reading.pid_name_ar ||
            reading.name ||
            reading.pid_name,
          value: String(reading.value),
          unit: reading.unit,
          status: reading.status === "NORMAL" ? "SUCCESS" : "WARNING",
          explanation:
            reading.explanation ||
            reading.professional_explanation ||
            `قراءة ${
              reading.name_ar ||
              reading.pid_name_ar ||
              reading.pid_name ||
              reading.name
            }`,
          pidCode: reading.pid_code,
        })
      );

      const pidInterp =
        parsed.user_friendly_report_ar?.pid_mechanical_interpretation
          ?.interpretations || [];

      const aiByPid: Record<string, any> = {};
      pidInterp.forEach((it: any) => {
        if (it.pid_code) {
          const normalizedCode = String(it.pid_code).toUpperCase();
          aiByPid[normalizedCode] = it;
        }
      });

      const transformedWithAI = transformed.map((item: any) => {
        const normalizedPidCode = String(item.pidCode).toUpperCase();
        const aiData = aiByPid[normalizedPidCode];

        return {
          ...item,
          aiInterpretation: aiData,
        };
      });

      setSensorData(transformedWithAI);

      const dtcInterpList =
        parsed.user_friendly_report_ar?.dtc_mechanical_interpretation
          ?.interpretations || [];

      const aiByDtc: Record<string, any> = {};

      dtcInterpList.forEach((it: any) => {
        if (it.code) aiByDtc[String(it.code).toUpperCase()] = it;
      });

      const dtcCategoriesSrc = parsed.dtc_categories || {};
      const codeToMqttCategory: Record<
        string,
        "stored" | "pending" | "permanent"
      > = {};

      (["stored", "pending", "permanent"] as const).forEach((cat) => {
        (dtcCategoriesSrc[cat] || []).forEach((c: any) => {
          const k = String(c || "").toUpperCase();
          if (!k) return;

          const prev = codeToMqttCategory[k];

          if (!prev) codeToMqttCategory[k] = cat;
          else if (prev === "pending" && cat !== "pending")
            codeToMqttCategory[k] = cat;
          else if (prev === "stored" && cat === "permanent")
            codeToMqttCategory[k] = cat;
        });
      });

      const dtcs = (parsed.detected_dtcs || []).map((dtc: any) => {
        const codeKey = String(dtc.code || dtc.name || "").toUpperCase();

        return {
          code: dtc.code || dtc.name,
          name: dtc.name || dtc.description,
          description: dtc.description,
          severity: dtc.severity || "MEDIUM",
          category: dtc.category,
          mqttCategory: codeToMqttCategory[codeKey] || null,
          aiInterpretation: aiByDtc[codeKey],
        };
      });

      setDtcItems(dtcs);

      const causes = (parsed.likely_causes || []).map((cause: any) => ({
        cause: cause.cause || cause.description,
        evidence: cause.evidence,
        likelihood: cause.likelihood || 0,
        confidence: cause.confidence || 0,
      }));

      setCausesData(causes);
      setLoading(false);
    } catch (e) {
      console.error("Failed to parse report:", e);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!params.report) return;

    try {
      const parsed = JSON.parse(String(params.report));
      parseReport(parsed);
    } catch (e) {
      console.error("Failed to parse params.report:", e);
      setLoading(false);
    }
  }, [params.report, parseReport]);

  useEffect(() => {
    const id = params.id ? String(params.id) : null;

    if (!id || !session?.user?.id) return;

    (async () => {
      try {
        setLoading(true);

        const { data, error } = await supabase
          .from("reports")
          .select("id, content, status, is_permanently_saved")
          .eq("id", id)
          .eq("user_id", session.user.id)
          .single();

        if (error) throw error;

        setSupabaseRowId(data.id);

        if (data.is_permanently_saved || data.status === "saved") {
          setSaved(true);
        }

        const content = data.content || {};
        const dedupKey =
          String(content.report_id || "") ||
          `${session.user.id}:${content.timestamp || ""}:${data.id}`;

        autoSaveTriedRef.current = dedupKey;

        parseReport(content);
      } catch (err: any) {
        console.error("Load report failed:", err?.message || err);
        setLoading(false);
      }
    })();
  }, [params.id, session?.user?.id, parseReport]);

  useEffect(() => {
    if (!report || !session?.user?.id) return;
    if (supabaseRowId) return;

    const dedupKey =
      String(report.report_id || "") ||
      `${session.user.id}:${report.timestamp || ""}`;

    if (autoSaveTriedRef.current === dedupKey) return;

    autoSaveTriedRef.current = dedupKey;

    (async () => {
      try {
        const now = new Date();
        const expiry = new Date(now.getTime() + 1000 * 60 * 60 * 24);

        const { data, error } = await supabase
          .from("reports")
          .insert({
            user_id: session.user.id,
            content: report,
            created_at: now.toISOString(),
            expiry_at: expiry.toISOString(),
            status: "pending",
            is_permanently_saved: false,
          })
          .select("id")
          .single();

        if (error) throw error;

        setSupabaseRowId(data.id);
      } catch (err: any) {
        console.error("Auto-save (pending) failed:", err?.message || err);
      }
    })();
  }, [report, session?.user?.id, supabaseRowId]);

  const handleSaveReport = async () => {
    if (!report || !session?.user?.id) {
      Alert.alert(t.error, t.loginRequired);
      return false;
    }

    setSaving(true);

    try {
      const now = new Date();
      const expiry = new Date(
        now.getTime() + 1000 * 60 * 60 * 24 * 365 * 10
      );

      if (supabaseRowId) {
        const { error } = await supabase
          .from("reports")
          .update({
            status: "saved",
            is_permanently_saved: true,
            saved_at: now.toISOString(),
            expiry_at: expiry.toISOString(),
          })
          .eq("id", supabaseRowId)
          .eq("user_id", session.user.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("reports")
          .insert({
            user_id: session.user.id,
            content: report,
            created_at: now.toISOString(),
            saved_at: now.toISOString(),
            expiry_at: expiry.toISOString(),
            status: "saved",
            is_permanently_saved: true,
          })
          .select("id")
          .single();

        if (error) throw error;

        setSupabaseRowId(data.id);
      }

      setSaved(true);
      Alert.alert(t.saveSuccessTitle, t.saveSuccess);
      return true;
    } catch (err: any) {
      console.error("Failed to save report:", err?.message || err);
      Alert.alert(t.saveErrorTitle, t.saveError);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)/wallet");
    }
  }, []);

  const handleBackPress = useCallback(() => {
    if (saved) {
      goBack();
      return;
    }

    Alert.alert(
      t.unsavedTitle,
      t.unsavedMessage,
      [
        { text: t.unsavedCancel, style: "cancel" },
        {
          text: t.unsavedLeave,
          style: "destructive",
          onPress: () => goBack(),
        },
        {
          text: t.unsavedSave,
          onPress: async () => {
            const ok = await handleSaveReport();
            if (ok) goBack();
          },
        },
      ],
      { cancelable: true }
    );
  }, [saved, t, goBack]);

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (saved) return false;
      handleBackPress();
      return true;
    });

    return () => sub.remove();
  }, [saved, handleBackPress]);

  const handleToggleLanguage = async () => {
    if (translating) return;

    if (lang === "EN") {
      setLang("AR");
      return;
    }

    const items: Record<string, string> = {};
    const add = (s: any) => {
      if (hasArabic(s)) items[String(s)] = String(s);
    };

    sensorData.forEach((it: any) => {
      add(it.label);
      add(it.explanation);

      const ai = it.aiInterpretation;

      if (ai) {
        add(ai.smart_insight_ar);
        add(ai.mechanical_explanation_ar);
        add(ai.safety_tip_ar);
        add(ai.urgency_ar);
      }
    });

    dtcItems.forEach((d: any) => {
      add(d.name);
      add(d.description);

      const ai = d.aiInterpretation;

      if (ai) {
        add(ai.smart_insight_ar);
        add(ai.urgency_ar);
      }
    });

    Object.values(DTC_CATEGORY_LABEL_AR).forEach((s) => add(s));

    causesData.forEach((c: any) => {
      add(c.cause);
      add(c.evidence);
    });

    const uf = report?.user_friendly_report_ar || {};
    const pi = uf.pid_mechanical_interpretation || {};
    const di = uf.dtc_mechanical_interpretation || {};

    add(pi.overview_ar);
    add(pi.summary_ar);

    (di.interpretations || []).forEach((it: any) =>
      add(it?.smart_insight_ar)
    );

    const fr = uf.final_recommendation || {};

    add(fr.recommendation_ar);
    add(fr.mechanic_note_ar);

    const pending: Record<string, string> = {};

    Object.entries(items).forEach(([k, v]) => {
      if (!trMap[k]) pending[k] = v;
    });

    if (Object.keys(pending).length === 0) {
      setLang("EN");
      return;
    }

    setTranslating(true);

    try {
      const res = await fetch(`${API_URL}/api/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: pending, target: "en" }),
      });

      if (!res.ok) throw new Error(`translate ${res.status}`);

      const json = await res.json();
      const translated = (json && json.items) || {};

      setTrMap((prev) => ({ ...prev, ...translated }));
      setLang("EN");
    } catch (e) {
      console.error("Translate failed:", e);
      Alert.alert(UI.EN.translateFailedTitle, UI.EN.translateFailedMsg);
    } finally {
      setTranslating(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!report) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>{t.notLoaded}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const reportDate = new Date(report.timestamp).toLocaleDateString(
    isAR ? "ar-SA" : "en-US"
  );

  const isHealthy = report.analysis_metadata?.is_vehicle_healthy === true;
  const overallHealth = report.analysis_metadata?.overall_health ?? 100;
  const userFriendly = report.user_friendly_report_ar || {};
  const healthPct =
    userFriendly.overall_health_percent ?? Math.round(overallHealth);

  const severity = String(report.severity || "LOW").toUpperCase();

  const SEVERITY_MAP: Record<
    string,
    {
      bg: string;
      fg: string;
      border: string;
      icon: keyof typeof Icon.glyphMap;
      title: string;
    }
  > = {
    LOW: {
      bg: COLORS.successBg,
      fg: COLORS.success,
      border: COLORS.successBorder,
      icon: "check-circle",
      title: t.statusNormal,
    },
    MEDIUM: {
      bg: COLORS.warningBg,
      fg: COLORS.warning,
      border: COLORS.warningBorder,
      icon: "alert-circle",
      title: t.statusWarning,
    },
    HIGH: {
      bg: COLORS.errorBg,
      fg: COLORS.error,
      border: COLORS.errorBorder,
      icon: "alert-triangle",
      title: isAR ? "مشكلة" : "Issue",
    },
    CRITICAL: {
      bg: COLORS.criticalBg,
      fg: COLORS.primary,
      border: COLORS.criticalBorder,
      icon: "x-circle",
      title: isAR ? "مشكلة حرجة" : "Critical Issue",
    },
  };

  const sevStyle = SEVERITY_MAP[severity] || SEVERITY_MAP.LOW;
  const sevLabel = t.severity[severity] || t.severity.LOW;

  const pidInterp = userFriendly.pid_mechanical_interpretation || {};
  const dtcInterp = userFriendly.dtc_mechanical_interpretation || {};

  const nPids =
    userFriendly.pid_count || (report.all_pid_readings || []).length || 0;
  const nDtcs = (report.detected_dtcs || []).length;
  const nAnom = (report.detected_anomalies || []).length;

  let introLine = "";

  if (isAR) {
    if (nPids > 0) introLine = `تم تحليل ${nPids} مؤشرات حيوية لسيارتك. `;

    if (isHealthy) introLine += "جميع القراءات ضمن النطاق الطبيعي.";
    else if (nDtcs > 0 && nAnom > 0)
      introLine += `يوجد ${nDtcs} كود عطل و${nAnom} تنبيه يتطلب المتابعة.`;
    else if (nDtcs > 0)
      introLine += `يوجد ${
        nDtcs === 1 ? "كود عطل واحد" : nDtcs + " أكواد أعطال"
      } يتطلب المتابعة.`;
    else if (nAnom > 0)
      introLine += `يوجد ${
        nAnom === 1 ? "تنبيه واحد" : nAnom + " تنبيهات"
      } يتطلب الملاحظة.`;
  } else {
    if (nPids > 0)
      introLine = `Analyzed ${nPids} vital readings for your car. `;

    if (isHealthy) introLine += "All readings are within the normal range.";
    else if (nDtcs > 0 && nAnom > 0)
      introLine += `Found ${nDtcs} trouble code(s) and ${nAnom} alert(s) requiring attention.`;
    else if (nDtcs > 0)
      introLine += `Found ${
        nDtcs === 1 ? "1 trouble code" : nDtcs + " trouble codes"
      } requiring attention.`;
    else if (nAnom > 0)
      introLine += `Found ${
        nAnom === 1 ? "1 alert" : nAnom + " alerts"
      } to monitor.`;
  }

  const finalRec = userFriendly.final_recommendation || null;
  const finalRecText = String(finalRec?.recommendation_ar || "").trim();
  const needsMechanic = !!finalRec?.needs_mechanic;
  const mechanicNote = String(finalRec?.mechanic_note_ar || "").trim();

  const pidOverview = String(
    pidInterp.overview_ar || pidInterp.summary_ar || ""
  ).trim();

  const dtcInterpList: any[] = dtcInterp.interpretations || [];

  const dtcOverview = dtcInterpList
    .map((it: any) => String(it.smart_insight_ar || "").trim())
    .filter(Boolean)
    .join(" — ");

  const aiActive =
    sensorData.some((s: any) => s.aiInterpretation) ||
    dtcInterpList.length > 0;

  const aiNarrativeParts = [pidOverview, dtcOverview].filter(Boolean);

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={handleBackPress}>
            <Icon name="chevron-right" size={23} color={COLORS.muted} />
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>{t.headerTitle}</Text>

            <View style={styles.dateContainer}>
              <Icon name="calendar" size={11} color={COLORS.muted} />
              <Text style={styles.dateText}>{reportDate}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.langButton}
            onPress={handleToggleLanguage}
            disabled={translating}
            activeOpacity={0.85}
          >
            {translating ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <>
                <Icon name="globe" size={14} color={COLORS.primary} />
                <Text style={styles.langButtonText}>{isAR ? "EN" : "AR"}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.headerDivider} />

        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <View style={styles.mainCard}>
              <View style={styles.mainCardTopRow}>
                {report.report_id ? (
                  <Text style={styles.reportIdText}>
                    {t.reportId}{" "}
                    <Text style={styles.reportIdMono}>{report.report_id}</Text>
                  </Text>
                ) : (
                  <View />
                )}

                <View
                  style={[
                    styles.severityBadgeMain,
                    {
                      backgroundColor: sevStyle.bg,
                      borderColor: sevStyle.border,
                    },
                  ]}
                >
                  <Icon name={sevStyle.icon} size={13} color={sevStyle.fg} />
                  <Text
                    style={[
                      styles.severityBadgeMainText,
                      { color: sevStyle.fg },
                    ]}
                  >
                    {sevLabel}
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.mainCardIcon,
                  {
                    backgroundColor: isHealthy
                      ? COLORS.successBg
                      : sevStyle.bg,
                    borderColor: isHealthy
                      ? COLORS.successBorder
                      : sevStyle.border,
                  },
                ]}
              >
                <Icon
                  name={isHealthy ? "check-circle" : sevStyle.icon}
                  size={34}
                  color={isHealthy ? COLORS.success : sevStyle.fg}
                />
              </View>

              <Text style={styles.mainCardTitle}>
                {isHealthy ? t.healthyTitle : t.issuesTitle}
              </Text>

              <View
                style={[
                  styles.healthMiniPill,
                  {
                    backgroundColor: isHealthy
                      ? COLORS.successBg
                      : sevStyle.bg,
                    borderColor: isHealthy
                      ? COLORS.successBorder
                      : sevStyle.border,
                  },
                ]}
              >
                <Icon
                  name={isHealthy ? "heart" : sevStyle.icon}
                  size={13}
                  color={isHealthy ? COLORS.success : sevStyle.fg}
                />

                <Text
                  style={[
                    styles.healthMiniPillText,
                    { color: isHealthy ? COLORS.success : sevStyle.fg },
                  ]}
                >
                  صحة السيارة {healthPct}%
                </Text>
              </View>

              {!!introLine && <Text style={styles.introLine}>{introLine}</Text>}
            </View>

            {aiNarrativeParts.length > 0 && (
              <View style={styles.insightCard}>
                <View style={styles.insightHeader}>
                  <View style={styles.insightIconCircle}>
                    <Icon name="cpu" size={16} color={COLORS.primary} />
                  </View>

                  <Text style={styles.insightLabel}>
                    {aiActive ? t.aiSummary : t.plainSummary}
                  </Text>
                </View>

                {aiNarrativeParts.map((part, i) => (
                  <Text
                    key={i}
                    style={[styles.insightText, i > 0 && { marginTop: 8 }]}
                  >
                    {tr(part)}
                  </Text>
                ))}
              </View>
            )}

            {dtcItems.length > 0 && (
              <View>
                <View style={styles.listHeader}>
                  <Text style={styles.listTitle}>{t.dtcs}</Text>

                  <View style={styles.badge}>
                    <Icon name="alert-triangle" size={12} color={COLORS.primary} />
                    <Text style={styles.badgeText}>{dtcItems.length}</Text>
                  </View>
                </View>

                {dtcItems.map((dtc: any, idx: number) => {
                  const ds = String(dtc.severity || "MEDIUM").toUpperCase();
                  const dStyle = SEVERITY_MAP[ds] || SEVERITY_MAP.MEDIUM;
                  const aiSentence =
                    dtc.aiInterpretation?.smart_insight_ar?.trim();
                  const urgency = dtc.aiInterpretation?.urgency_ar;

                  return (
                    <View
                      key={idx}
                      style={[
                        styles.dtcCard,
                        {
                          backgroundColor: dStyle.bg,
                          borderColor: dStyle.border,
                        },
                      ]}
                    >
                      <View style={styles.dtcHeader}>
                        <View style={{ flex: 1 }}>
                          <View style={styles.dtcCodeRow}>
                            <View
                              style={[
                                styles.statusIconSoft,
                                {
                                  backgroundColor: COLORS.surface,
                                  borderColor: dStyle.border,
                                },
                              ]}
                            >
                              <Icon
                                name={dStyle.icon}
                                size={15}
                                color={dStyle.fg}
                              />
                            </View>

                            <Text style={[styles.dtcCode, { color: dStyle.fg }]}>
                              {dtc.code}
                            </Text>
                          </View>

                          <Text style={styles.dtcName}>{tr(dtc.name)}</Text>

                          {dtc.mqttCategory && (
                            <View style={styles.dtcCategoryPill}>
                              <Icon name="tag" size={10} color={COLORS.primary} />

                              <Text style={styles.dtcCategoryPillText}>
                                {tr(
                                  DTC_CATEGORY_LABEL_AR[
                                    dtc.mqttCategory as
                                      | "stored"
                                      | "pending"
                                      | "permanent"
                                  ]
                                )}
                              </Text>
                            </View>
                          )}
                        </View>

                        <View
                          style={[
                            styles.severityBadge,
                            {
                              backgroundColor: COLORS.surface,
                              borderColor: dStyle.border,
                            },
                          ]}
                        >
                          <Icon name={dStyle.icon} size={12} color={dStyle.fg} />

                          <Text
                            style={[styles.severityText, { color: dStyle.fg }]}
                          >
                            {urgency ? tr(urgency) : dStyle.title}
                          </Text>
                        </View>
                      </View>

                      {dtc.description && (
                        <Text style={styles.dtcDescription}>
                          {tr(dtc.description)}
                        </Text>
                      )}

                      {aiSentence && (
                        <View style={styles.dtcAiBox}>
                          <View style={styles.smallSectionTitleRow}>
                            <Icon name="cpu" size={12} color={COLORS.primary} />
                            <Text style={styles.dtcAiTitle}>
                              {t.smartInsight}
                            </Text>
                          </View>

                          <Text style={styles.dtcAiText}>
                            {tr(aiSentence)}
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}

            {sensorData.length > 0 && (
              <View>
                <View style={styles.listHeader}>
                  <Text style={styles.listTitle}>{t.sensorReadings}</Text>

                  <View style={styles.badge}>
                    <Icon name="activity" size={12} color={COLORS.primary} />
                    <Text style={styles.badgeText}>
                      {t.sensorsCount(sensorData.length)}
                    </Text>
                  </View>
                </View>

                {sensorData.some((s) => s.aiInterpretation) && (
                  <View style={styles.aiEnabledBanner}>
                    <Icon name="cpu" size={14} color={COLORS.primary} />
                    <Text style={styles.aiEnabledText}>
                      {t.smartAnalysisOn}
                    </Text>
                  </View>
                )}

                {sensorData.map((item, idx) => {
                  const isOpen = openIndex === idx;
                  const isWarning = item.status === "WARNING";

                  const statusColor = isWarning
                    ? COLORS.warning
                    : COLORS.success;

                  const statusBg = isWarning
                    ? COLORS.warningBg
                    : COLORS.successBg;

                  const statusBorder = isWarning
                    ? COLORS.warningBorder
                    : COLORS.successBorder;

                  const statusIcon: keyof typeof Icon.glyphMap = isWarning
                    ? "alert-circle"
                    : "check-circle";

                  const aiUrgency = item.aiInterpretation?.urgency_ar;

                  const statusText = aiUrgency
                    ? tr(aiUrgency)
                    : isWarning
                    ? t.statusWarning
                    : t.statusNormal;

                  const hasAI = !!item.aiInterpretation;

                  return (
                    <View
                      key={idx}
                      style={[
                        styles.sensorItem,
                        isOpen && styles.sensorItemOpen,
                        {
                          backgroundColor: isWarning
                            ? COLORS.warningBg
                            : COLORS.surface,
                          borderColor: isWarning
                            ? COLORS.warningBorder
                            : COLORS.border,
                        },
                      ]}
                    >
                      <TouchableOpacity
                        activeOpacity={0.85}
                        style={styles.sensorButton}
                        onPress={() => setOpenIndex(isOpen ? null : idx)}
                      >
                        <View style={styles.sensorLeft}>
                          <View
                            style={[
                              styles.iconBox,
                              {
                                backgroundColor: statusBg,
                                borderColor: statusBorder,
                              },
                            ]}
                          >
                            <Icon
                              name={statusIcon}
                              size={18}
                              color={statusColor}
                            />
                          </View>

                          <View style={{ flex: 1 }}>
                            <View style={styles.labelRow}>
                              <Text style={styles.sensorLabel}>
                                {tr(item.label)}
                              </Text>

                              {hasAI && (
                                <View style={styles.aiIconMini}>
                                  <Icon
                                    name="cpu"
                                    size={10}
                                    color={COLORS.primary}
                                  />
                                </View>
                              )}
                            </View>

                            <View style={styles.statusRow}>
                              <View
                                style={[
                                  styles.statusDot,
                                  { backgroundColor: statusColor },
                                ]}
                              />

                              <Text
                                style={[
                                  styles.statusText,
                                  { color: statusColor },
                                ]}
                              >
                                {statusText}
                              </Text>
                            </View>
                          </View>
                        </View>

                        <View style={styles.sensorRight}>
                          <View style={styles.valueContainer}>
                            <Text
                              style={[
                                styles.value,
                                isWarning && styles.valueWarning,
                              ]}
                            >
                              {parseFloat(item.value).toFixed(2)}
                            </Text>

                            <Text style={styles.unit}>{item.unit}</Text>
                          </View>

                          <Icon
                            name={isOpen ? "chevron-up" : "chevron-down"}
                            size={16}
                            color={COLORS.muted}
                          />
                        </View>
                      </TouchableOpacity>

                      {isOpen && (
                        <View style={styles.explanationBox}>
                          {hasAI &&
                          (item.aiInterpretation?.smart_insight_ar ||
                            item.aiInterpretation?.mechanical_explanation_ar) ? (
                            <>
                              <View style={styles.explanationHeader}>
                                <View style={styles.explanationIcon}>
                                  <Icon
                                    name="cpu"
                                    size={10}
                                    color={COLORS.primary}
                                  />
                                </View>

                                <Text style={styles.explanationTitle}>
                                  {t.smartAnalysis}
                                </Text>
                              </View>

                              <Text style={styles.explanationText}>
                                {tr(
                                  item.aiInterpretation.smart_insight_ar ||
                                    item.aiInterpretation
                                      .mechanical_explanation_ar
                                )}
                              </Text>

                              {item.aiInterpretation?.safety_tip_ar && (
                                <View style={styles.recommendationBox}>
                                  <Icon
                                    name="alert-circle"
                                    size={14}
                                    color={COLORS.warning}
                                  />

                                  <Text style={styles.recommendationText}>
                                    {tr(item.aiInterpretation.safety_tip_ar)}
                                  </Text>
                                </View>
                              )}
                            </>
                          ) : (
                            <>
                              <View style={styles.explanationHeader}>
                                <View style={styles.explanationIcon}>
                                  <Icon
                                    name="info"
                                    size={10}
                                    color={COLORS.primary}
                                  />
                                </View>

                                <Text style={styles.explanationTitle}>
                                  {t.explanation}
                                </Text>
                              </View>

                              <Text style={styles.explanationText}>
                                {tr(item.explanation)}
                              </Text>
                            </>
                          )}
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}

            {causesData.length > 0 && (
              <View>
                <View style={styles.listHeader}>
                  <Text style={styles.listTitle}>{t.causes}</Text>
                </View>

                {causesData.slice(0, 5).map((cause: any, idx: number) => (
                  <View key={idx} style={styles.causeCard}>
                    <View style={styles.causeIconCircle}>
                      <Icon
                        name="alert-circle"
                        size={16}
                        color={COLORS.warning}
                      />
                    </View>

                    <View style={styles.causeContent}>
                      <Text style={styles.causeText}>{tr(cause.cause)}</Text>

                      {!!cause.evidence && (
                        <Text style={styles.causeEvidence}>
                          {tr(cause.evidence)}
                        </Text>
                      )}

                      {(cause.likelihood || cause.confidence) && (
                        <Text style={styles.causeMetrics}>
                          {t.likelihood}: {Math.round(cause.likelihood || 0)}% |{" "}
                          {t.confidence}: {Math.round(cause.confidence || 0)}%
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}

            {!!finalRecText && (
              <View style={styles.recCard}>
                <View style={styles.recHeader}>
                  <View style={styles.recIconCircle}>
                    <Icon name="clipboard" size={16} color={COLORS.primary} />
                  </View>

                  <Text style={styles.recHeaderText}>
                    {t.smartRecommendation}
                  </Text>
                </View>

                <Text style={[styles.recText, !isAR && { textAlign: "left" }]}>
                  {tr(finalRecText)}
                </Text>

                {needsMechanic && (
                  <TouchableOpacity
                    activeOpacity={0.9}
                    style={styles.importantActionBox}
                  >
                    <Icon name="tool" size={16} color="#FFFFFF" />

                    <View style={{ flex: 1 }}>
                      <Text style={styles.importantActionTitle}>
                        {t.needsMechanic}
                      </Text>

                      {!!mechanicNote && (
                        <Text style={styles.importantActionNote}>
                          {tr(mechanicNote)}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            )}

            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  saved && styles.primaryButtonDisabled,
                ]}
                activeOpacity={0.88}
                onPress={handleSaveReport}
                disabled={saved || saving}
              >
                {saving ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <>
                    <Icon
                      name={saved ? "check-circle" : "save"}
                      size={18}
                      color="white"
                    />

                    <Text style={styles.buttonText}>
                      {saved ? t.saved : t.save}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <Icon name="shield" size={20} color={COLORS.mutedLight} />
              <Text style={styles.footerText}>{t.footer}</Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.bg,
  },

  errorText: {
    fontSize: 16,
    color: COLORS.error,
    fontWeight: "800",
  },

  header: {
    backgroundColor: COLORS.bg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 10,
  },

  headerDivider: {
    height: 1,
    backgroundColor: "#F2F2F2",
  },

  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },

  headerTitleContainer: {
    alignItems: "center",
    flex: 1,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.text,
    textAlign: "center",
  },

  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },

  dateText: {
    fontSize: 10.5,
    fontWeight: "700",
    color: COLORS.muted,
    letterSpacing: 0.4,
  },

  langButton: {
    minWidth: 56,
    height: 44,
    paddingHorizontal: 10,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },

  langButtonText: {
    fontSize: 12,
    fontWeight: "900",
    color: COLORS.primary,
    letterSpacing: 0.5,
  },

  content: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 16,
  },

  mainCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 28,
    paddingVertical: 24,
    paddingHorizontal: 18,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },

  mainCardTopRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  reportIdText: {
    fontSize: 10.5,
    color: COLORS.mutedLight,
    fontWeight: "700",
  },

  reportIdMono: {
    fontFamily: "monospace",
    color: COLORS.muted,
  },

  severityBadgeMain: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
  },

  severityBadgeMainText: {
    fontSize: 11.5,
    fontWeight: "900",
  },

  mainCardIcon: {
    width: 66,
    height: 66,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 1,
  },

  mainCardTitle: {
    fontSize: 21,
    fontWeight: "900",
    marginBottom: 10,
    color: COLORS.text,
    textAlign: "center",
  },

  healthMiniPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
  },

  healthMiniPillText: {
    fontSize: 11.5,
    fontWeight: "900",
  },

  introLine: {
    fontSize: 13,
    color: COLORS.muted,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 21,
    marginTop: 12,
  },

  insightCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },

  insightHeader: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },

  insightIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 13,
    backgroundColor: COLORS.softGray,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },

  insightLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: "900",
    color: COLORS.primary,
    textAlign: "right",
  },

  insightText: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 22,
    textAlign: "right",
  },

  listHeader: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    marginTop: 4,
  },

  listTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: COLORS.text,
    textAlign: "right",
  },

  badge: {
    backgroundColor: COLORS.softGray,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 5,
  },

  badgeText: {
    fontSize: 11,
    fontWeight: "900",
    color: COLORS.primary,
  },

  aiEnabledBanner: {
    backgroundColor: COLORS.softGray,
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  aiEnabledText: {
    fontSize: 12,
    fontWeight: "900",
    color: COLORS.primary,
    textAlign: "center",
  },

  sensorItem: {
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 12,
    overflow: "hidden",
  },

  sensorItemOpen: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },

  sensorButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },

  sensorLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },

  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  labelRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },

  sensorLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: "900",
    color: COLORS.text,
    textAlign: "right",
  },

  aiIconMini: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.softGray,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },

  statusRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  statusText: {
    fontSize: 10,
    fontWeight: "900",
  },

  sensorRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  valueContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 3,
  },

  value: {
    fontSize: 17,
    fontWeight: "900",
    color: COLORS.text,
  },

  valueWarning: {
    color: COLORS.warning,
  },

  unit: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.mutedLight,
  },

  explanationBox: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },

  explanationHeader: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },

  explanationIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.softGray,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },

  explanationTitle: {
    fontSize: 11,
    fontWeight: "900",
    color: COLORS.primary,
  },

  explanationText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.muted,
    lineHeight: 20,
    textAlign: "right",
  },

  recommendationBox: {
    flexDirection: "row-reverse",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.06)",
  },

  recommendationText: {
    flex: 1,
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.warning,
    lineHeight: 18,
    textAlign: "right",
  },

  dtcCard: {
    borderRadius: 24,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },

  dtcHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
    gap: 10,
  },

  dtcCodeRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },

  statusIconSoft: {
    width: 28,
    height: 28,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  dtcCode: {
    fontSize: 15,
    fontWeight: "900",
    textAlign: "right",
  },

  dtcName: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.muted,
    marginTop: 4,
    textAlign: "right",
  },

  dtcCategoryPill: {
    alignSelf: "flex-end",
    marginTop: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 5,
  },

  dtcCategoryPillText: {
    fontSize: 10.5,
    fontWeight: "900",
    color: COLORS.primary,
  },

  severityBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 5,
  },

  severityText: {
    fontSize: 9.5,
    fontWeight: "900",
  },

  dtcDescription: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.muted,
    lineHeight: 19,
    textAlign: "right",
  },

  dtcAiBox: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.06)",
  },

  smallSectionTitleRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
    marginBottom: 5,
  },

  dtcAiTitle: {
    fontSize: 11,
    fontWeight: "900",
    color: COLORS.primary,
    textAlign: "right",
  },

  dtcAiText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.muted,
    lineHeight: 20,
    textAlign: "right",
  },

  causeCard: {
    backgroundColor: COLORS.warningBg,
    borderRadius: 22,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row-reverse",
    alignItems: "flex-start",
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.warningBorder,
  },

  causeIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.warningBorder,
  },

  causeContent: {
    flex: 1,
  },

  causeText: {
    fontSize: 12.5,
    fontWeight: "800",
    color: COLORS.text,
    lineHeight: 19,
    textAlign: "right",
  },

  causeEvidence: {
    fontSize: 11.5,
    color: COLORS.muted,
    marginTop: 5,
    fontWeight: "700",
    lineHeight: 18,
    textAlign: "right",
  },

  causeMetrics: {
    fontSize: 10.5,
    color: COLORS.warning,
    marginTop: 6,
    fontWeight: "900",
    textAlign: "right",
  },

  recCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },

  recHeader: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },

  recIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 13,
    backgroundColor: COLORS.softGray,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },

  recHeaderText: {
    flex: 1,
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "900",
    textAlign: "right",
  },

  recText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.muted,
    lineHeight: 23,
    textAlign: "right",
  },

  importantActionBox: {
    flexDirection: "row-reverse",
    alignItems: "flex-start",
    gap: 10,
    marginTop: 14,
    padding: 14,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
  },

  importantActionTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: "#FFFFFF",
    marginBottom: 4,
    textAlign: "right",
  },

  importantActionNote: {
    fontSize: 12,
    color: "rgba(255,255,255,0.82)",
    lineHeight: 19,
    textAlign: "right",
  },

  buttonGroup: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },

  primaryButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    borderRadius: 28,
    gap: 8,
    shadowColor: COLORS.primaryDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 4,
  },

  primaryButtonDisabled: {
    backgroundColor: COLORS.success,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },

  footer: {
    alignItems: "center",
    marginTop: 12,
    marginBottom: 30,
  },

  footerText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.mutedLight,
    textAlign: "center",
    marginTop: 10,
    lineHeight: 15,
  },
});

export default ReportScreen;