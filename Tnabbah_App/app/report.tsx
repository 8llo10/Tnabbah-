import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Dimensions,
  BackHandler,
} from 'react-native';
import { Feather as Icon } from '@expo/vector-icons';
import { useAuth } from '../providers/AuthProvider';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '../lib/supabase';

const API_URL = process.env.EXPO_PUBLIC_DIAGNOSTICS_API || "http://127.0.0.1:8001";

const COLORS = {
  red: "#871B17",
  bg: "#F9FAFB",
  ink: "#111827",
  gray: "#6B7280",
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444"
};

// Static UI labels for AR/EN. Dynamic content (PID names, AI text, DTC text)
// is translated on demand through the backend /api/translate endpoint.
const UI = {
  AR: {
    headerTitle: 'تقرير تنبّه الذكي',
    reportId: 'رقم التقرير:',
    sensorReadings: 'قراءات المستشعرات',
    sensorsCount: (n: number) => `${n} حساس`,
    dtcs: 'أكواد الأعطال المكتشفة',
    causes: 'الأسباب المحتملة',
    likelihood: 'احتمالية',
    confidence: 'ثقة',
    smartAnalysisOn: '✨ تحليل ذكي مُفعَّل',
    smartAnalysis: 'تحليل ذكي',
    smartInsight: '✨ تفسير ذكي',
    explanation: 'التفسير',
    smartRecommendation: '✨ التوصية الذكية',
    needsMechanic: 'تحتاج لزيارة فنّي/ميكانيكي مختص',
    healthyTitle: 'سيارتك بحالة ممتازة 🎉',
    issuesTitle: 'تم اكتشاف ملاحظات',
    aiSummary: '✨ تحليل تنبّه الذكي',
    plainSummary: '📋 ملخص التحليل',
    statusWarning: 'تحذير',
    statusNormal: 'طبيعي',
    saved: '✅ محفوظ',
    save: '💾 حفظ دائم',
    footer: 'ملاحظة: هذا التقرير مقدم من "تنبّه" كدليل استرشادي ذكي.',
    notLoaded: 'لم يتم تحميل التقرير',
    saveError: 'فشل حفظ التقرير',
    saveSuccess: 'تم حفظ التقرير بنجاح',
    saveErrorTitle: '❌ خطأ',
    saveSuccessTitle: '✅ تم الحفظ',
    loginRequired: 'يجب تسجيل الدخول أولاً',
    error: 'خطأ',
    translateFailedTitle: '❌ فشل الترجمة',
    translateFailedMsg: 'تعذّر ترجمة التقرير، حاول لاحقاً',
    unsavedTitle: 'لم يتم حفظ التقرير',
    unsavedMessage: 'سيتم الاحتفاظ بهذا التقرير لمدة 24 ساعة فقط ثم سيُحذف تلقائياً إذا لم تقم بحفظه بشكل دائم.',
    unsavedSave: '💾 حفظ دائم',
    unsavedLeave: 'خروج بدون حفظ',
    unsavedCancel: 'إلغاء',
    severity: {
      NORMAL: '✅ طبيعي',
      LOW: '🟢 تنبيه بسيط',
      MEDIUM: '🟡 تحذير',
      HIGH: '🟠 خطر',
      CRITICAL: '🔴 خطر شديد',
    } as Record<string, string>,
  },
  EN: {
    headerTitle: 'Tnabbah Smart Report',
    reportId: 'Report ID:',
    sensorReadings: 'Sensor Readings',
    sensorsCount: (n: number) => `${n} sensors`,
    dtcs: 'Detected Trouble Codes',
    causes: 'Likely Causes',
    likelihood: 'Likelihood',
    confidence: 'Confidence',
    smartAnalysisOn: '✨ Smart Analysis Enabled',
    smartAnalysis: 'Smart Analysis',
    smartInsight: '✨ Smart Insight',
    explanation: 'Explanation',
    smartRecommendation: '✨ Smart Recommendation',
    needsMechanic: 'Visit a qualified technician/mechanic',
    healthyTitle: 'Your car is in excellent condition 🎉',
    issuesTitle: 'Issues Detected',
    aiSummary: '✨ Tnabbah Smart Analysis',
    plainSummary: '📋 Analysis Summary',
    statusWarning: 'Warning',
    statusNormal: 'Normal',
    saved: '✅ Saved',
    save: '💾 Save Permanently',
    footer: 'Note: This report is provided by "Tnabbah" as a smart guidance reference.',
    notLoaded: 'Report not loaded',
    saveError: 'Failed to save the report',
    saveSuccess: 'Report saved successfully',
    saveErrorTitle: '❌ Error',
    saveSuccessTitle: '✅ Saved',
    loginRequired: 'You must log in first',
    error: 'Error',
    translateFailedTitle: '❌ Translation Failed',
    translateFailedMsg: 'Could not translate the report. Try again later.',
    unsavedTitle: 'Report not saved',
    unsavedMessage: 'This report will be kept for only 24 hours and then automatically deleted if you do not save it permanently.',
    unsavedSave: '💾 Save Permanently',
    unsavedLeave: 'Leave without saving',
    unsavedCancel: 'Cancel',
    severity: {
      NORMAL: '✅ Normal',
      LOW: '🟢 Minor Notice',
      MEDIUM: '🟡 Warning',
      HIGH: '🟠 Risk',
      CRITICAL: '🔴 Severe Risk',
    } as Record<string, string>,
  },
} as const;

const hasArabic = (s: any) => typeof s === 'string' && /[\u0600-\u06FF]/.test(s);

// DTC categories as published over MQTT (stored/pending/permanent).
const DTC_CATEGORY_LABEL_AR: Record<'stored' | 'pending' | 'permanent', string> = {
  stored: 'أعطال موجودة فعلاً',
  pending: 'مشكلة بدأت تظهر',
  permanent: 'أعطال محفوظة بالنظام',
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
  const [lang, setLang] = useState<'AR' | 'EN'>('AR');
  const [trMap, setTrMap] = useState<Record<string, string>>({});
  const [translating, setTranslating] = useState(false);

  const t = UI[lang];
  const isAR = lang === 'AR';
  // Translate any Arabic string to current language. Falls back to original.
  const tr = (s?: string | null): string => {
    if (!s) return '';
    if (lang === 'AR') return s;
    return trMap[s] || s;
  };

  const parseReport = useCallback((parsed: any) => {
    try {
      setReport(parsed);

      // Transform all_pid_readings to sensor data
      const transformed = (parsed.all_pid_readings || []).map((reading: any) => {
        const rawStatus = String(reading.status || 'NORMAL').toUpperCase();
        // Map engine output to the 5-level severity used by the badge/colors:
        // NORMAL / LOW / MEDIUM / HIGH / CRITICAL.
        // Engine emits some legacy values (WARNING, ABNORMAL) -> MEDIUM.
        const severityLevel =
          rawStatus === 'NORMAL' ? 'NORMAL' :
          rawStatus === 'LOW' ? 'LOW' :
          rawStatus === 'HIGH' ? 'HIGH' :
          rawStatus === 'CRITICAL' ? 'CRITICAL' :
          'MEDIUM';
        return {
          label: reading.name_ar || reading.pid_name_ar || reading.name || reading.pid_name,
          value: String(reading.value),
          unit: reading.unit,
          // Legacy binary status (kept for existing visual checks like 'valueError').
          status: severityLevel === 'NORMAL' ? 'SUCCESS' : 'WARNING',
          severityLevel,
          explanation: reading.explanation || reading.professional_explanation || `قراءة ${reading.name_ar || reading.pid_name_ar || reading.pid_name || reading.name}`,
          pidCode: reading.pid_code,
        };
      });

      // Add AI interpretations if available
      const pidInterp = parsed.user_friendly_report_ar?.pid_mechanical_interpretation?.interpretations || [];

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

      // Index DTC AI interpretations by code
      const dtcInterpList = parsed.user_friendly_report_ar?.dtc_mechanical_interpretation?.interpretations || [];
      const aiByDtc: Record<string, any> = {};
      dtcInterpList.forEach((it: any) => {
        if (it.code) aiByDtc[String(it.code).toUpperCase()] = it;
      });

      // Build a code -> MQTT-source category map (stored / pending / permanent).
      const dtcCategoriesSrc = parsed.dtc_categories || {};
      const codeToMqttCategory: Record<string, 'stored' | 'pending' | 'permanent'> = {};
      ([
        'stored',
        'pending',
        'permanent',
      ] as const).forEach((cat) => {
        (dtcCategoriesSrc[cat] || []).forEach((c: any) => {
          const k = String(c || '').toUpperCase();
          if (!k) return;
          const prev = codeToMqttCategory[k];
          if (!prev) codeToMqttCategory[k] = cat;
          else if (prev === 'pending' && cat !== 'pending') codeToMqttCategory[k] = cat;
          else if (prev === 'stored' && cat === 'permanent') codeToMqttCategory[k] = cat;
        });
      });

      // Extract DTCs (with AI interpretation attached)
      const dtcs = (parsed.detected_dtcs || []).map((dtc: any) => {
        const codeKey = String(dtc.code || dtc.name || '').toUpperCase();
        return {
          code: dtc.code || dtc.name,
          name: dtc.name || dtc.description,
          description: dtc.description,
          severity: dtc.severity || 'MEDIUM',
          category: dtc.category,
          mqttCategory: codeToMqttCategory[codeKey] || null,
          aiInterpretation: aiByDtc[codeKey],
        };
      });
      setDtcItems(dtcs);

      // Extract causes
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

  // Path 1: Report passed via params (freshly generated flow)
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

  // Path 2: Report opened by id (from history/list) — load from Supabase
  useEffect(() => {
    const id = params.id ? String(params.id) : null;
    if (!id || !session?.user?.id) return;

    (async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('reports')
          .select('id, content, status, is_permanently_saved')
          .eq('id', id)
          .eq('user_id', session.user.id)
          .single();
        if (error) throw error;

        setSupabaseRowId(data.id);
        if (data.is_permanently_saved || data.status === 'saved') {
          setSaved(true);
        }
        // Mark dedup key so the auto-insert effect won't fire for this report.
        const content = data.content || {};
        const dedupKey =
          String(content.report_id || '') ||
          `${session.user.id}:${content.timestamp || ''}:${data.id}`;
        autoSaveTriedRef.current = dedupKey;

        parseReport(content);
      } catch (err: any) {
        console.error('Load report failed:', err?.message || err);
        setLoading(false);
      }
    })();
  }, [params.id, session?.user?.id, parseReport]);

  // Auto-insert as 'pending' once the report is parsed (only for freshly generated reports)
  useEffect(() => {
    if (!report || !session?.user?.id) return;
    if (supabaseRowId) return; // already exists in DB (loaded by id)

    const dedupKey =
      String(report.report_id || '') ||
      `${session.user.id}:${report.timestamp || ''}`;
    if (autoSaveTriedRef.current === dedupKey) return;
    autoSaveTriedRef.current = dedupKey;

    (async () => {
      try {
        const now = new Date();
        // Pending reports live for 24h, then auto-delete (per UX).
        const expiry = new Date(now.getTime() + 1000 * 60 * 60 * 24);
        const { data, error } = await supabase
          .from('reports')
          .insert({
            user_id: session.user.id,
            content: report,
            created_at: now.toISOString(),
            expiry_at: expiry.toISOString(),
            status: 'pending',
            is_permanently_saved: false,
          })
          .select('id')
          .single();
        if (error) throw error;
        setSupabaseRowId(data.id);
      } catch (err: any) {
        console.error('Auto-save (pending) failed:', err?.message || err);
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
      // Permanent save -> push expiry far out (10 years).
      const expiry = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 365 * 10);

      if (supabaseRowId) {
        // Promote the existing pending row to 'saved'.
        const { error } = await supabase
          .from('reports')
          .update({
            status: 'saved',
            is_permanently_saved: true,
            saved_at: now.toISOString(),
            expiry_at: expiry.toISOString(),
          })
          .eq('id', supabaseRowId)
          .eq('user_id', session.user.id);
        if (error) throw error;
      } else {
        // Fallback: auto-insert hadn't finished yet -> insert directly as 'saved'.
        const { data, error } = await supabase
          .from('reports')
          .insert({
            user_id: session.user.id,
            content: report,
            created_at: now.toISOString(),
            saved_at: now.toISOString(),
            expiry_at: expiry.toISOString(),
            status: 'saved',
            is_permanently_saved: true,
          })
          .select('id')
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
      // Fallback when there's no previous screen in the stack
      // (e.g. opened via deep link or after a stack reset).
      router.replace('/(tabs)/wallet');
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
        { text: t.unsavedCancel, style: 'cancel' },
        {
          text: t.unsavedLeave,
          style: 'destructive',
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
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (saved) return false;
      handleBackPress();
      return true;
    });
    return () => sub.remove();
  }, [saved, handleBackPress]);

  const handleToggleLanguage = async () => {
    if (translating) return;
    if (lang === 'EN') {
      setLang('AR');
      return;
    }

    // Collect all dynamic Arabic strings to translate (deduped)
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
    // Translate the Arabic DTC-category labels too.
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
    (di.interpretations || []).forEach((it: any) => add(it?.smart_insight_ar));
    const fr = uf.final_recommendation || {};
    add(fr.recommendation_ar);
    add(fr.mechanic_note_ar);

    // Drop already-translated keys to save tokens
    const pending: Record<string, string> = {};
    Object.entries(items).forEach(([k, v]) => {
      if (!trMap[k]) pending[k] = v;
    });

    if (Object.keys(pending).length === 0) {
      setLang('EN');
      return;
    }

    setTranslating(true);
    try {
      const res = await fetch(`${API_URL}/api/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: pending, target: 'en' }),
      });
      if (!res.ok) throw new Error(`translate ${res.status}`);
      const json = await res.json();
      const translated = (json && json.items) || {};
      setTrMap(prev => ({ ...prev, ...translated }));
      setLang('EN');
    } catch (e) {
      console.error('Translate failed:', e);
      Alert.alert(UI.EN.translateFailedTitle, UI.EN.translateFailedMsg);
    } finally {
      setTranslating(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.red} />
        </View>
      </SafeAreaView>
    );
  }

  if (!report) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>{t.notLoaded}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const reportDate = new Date(report.timestamp).toLocaleDateString(isAR ? 'ar-SA' : 'en-US');
  const isHealthy = report.analysis_metadata?.is_vehicle_healthy === true;
  const overallHealth = report.analysis_metadata?.overall_health ?? 100;
  const userFriendly = report.user_friendly_report_ar || {};
  const healthPct = userFriendly.overall_health_percent ?? Math.round(overallHealth);
  const healthLine = userFriendly.overall_health || '';

  // Severity styles (mirror web report)
  const severity = String(report.severity || 'NORMAL').toUpperCase();
  const SEVERITY_MAP: Record<string, { bg: string; fg: string; border: string }> = {
    NORMAL:   { bg: '#F0FDF4', fg: '#15803D', border: '#BBF7D0' },
    LOW:      { bg: '#DCFCE7', fg: '#166534', border: '#86EFAC' },
    MEDIUM:   { bg: '#FEF9C3', fg: '#854D0E', border: '#FDE68A' },
    HIGH:     { bg: '#FFEDD5', fg: '#9A3412', border: '#FDBA74' },
    CRITICAL: { bg: '#FEE2E2', fg: '#991B1B', border: '#FCA5A5' },
  };
  const sevStyle = SEVERITY_MAP[severity] || SEVERITY_MAP.NORMAL;
  const sevLabel = (t.severity[severity] || t.severity.NORMAL);

  // Get AI interpretations
  const pidInterp = userFriendly.pid_mechanical_interpretation || {};
  const dtcInterp = userFriendly.dtc_mechanical_interpretation || {};

  // Build intro line: "تم تحليل N مؤشرات حيوية. يوجد ..."
  const nPids = userFriendly.pid_count || (report.all_pid_readings || []).length || 0;
  const nDtcs = (report.detected_dtcs || []).length;
  const nAnom = (report.detected_anomalies || []).length;
  let introLine = '';
  if (isAR) {
    if (nPids > 0) introLine = `تم تحليل ${nPids} مؤشرات حيوية لسيارتك. `;
    if (isHealthy) introLine += 'جميع القراءات ضمن النطاق الطبيعي.';
    else if (nDtcs > 0 && nAnom > 0) introLine += `يوجد ${nDtcs} كود عطل و${nAnom} تنبيه يتطلب المتابعة.`;
    else if (nDtcs > 0) introLine += `يوجد ${nDtcs === 1 ? 'كود عطل واحد' : nDtcs + ' أكواد أعطال'} يتطلب المتابعة.`;
    else if (nAnom > 0) introLine += `يوجد ${nAnom === 1 ? 'تنبيه واحد' : nAnom + ' تنبيهات'} يتطلب الملاحظة.`;
  } else {
    if (nPids > 0) introLine = `Analyzed ${nPids} vital readings for your car. `;
    if (isHealthy) introLine += 'All readings are within the normal range.';
    else if (nDtcs > 0 && nAnom > 0) introLine += `Found ${nDtcs} trouble code(s) and ${nAnom} alert(s) requiring attention.`;
    else if (nDtcs > 0) introLine += `Found ${nDtcs === 1 ? '1 trouble code' : nDtcs + ' trouble codes'} requiring attention.`;
    else if (nAnom > 0) introLine += `Found ${nAnom === 1 ? '1 alert' : nAnom + ' alerts'} to monitor.`;
  }

  // Final AI recommendation (holistic, generated by DeepSeek)
  const finalRec = userFriendly.final_recommendation || null;
  const finalRecText = String(finalRec?.recommendation_ar || '').trim();
  const needsMechanic = !!finalRec?.needs_mechanic;
  const mechanicNote = String(finalRec?.mechanic_note_ar || '').trim();

  // Combined AI narrative (PID overview + DTC smart insights)
  // The engine output is the source of truth. The AI overview is free text and
  // can hallucinate issues that don't exist (or vice versa), so we gate each
  // AI part by the corresponding engine signal:
  //   - pidOverview is shown only when the engine actually flagged anomalies
  //   - dtcOverview is shown only when the engine reported DTCs
  // This eliminates "summary says there's an issue but PIDs say otherwise".
  const rawPidOverview = String(pidInterp.overview_ar || pidInterp.summary_ar || '').trim();
  const dtcInterpList: any[] = (dtcInterp.interpretations || []);
  const rawDtcOverview = dtcInterpList
    .map((it: any) => String(it.smart_insight_ar || '').trim())
    .filter(Boolean)
    .join(' — ');
  const pidOverview = nAnom > 0 ? rawPidOverview : '';
  const dtcOverview = nDtcs > 0 ? rawDtcOverview : '';
  const aiActive = sensorData.some((s: any) => s.aiInterpretation) || dtcInterpList.length > 0;
  const aiNarrativeParts = [pidOverview, dtcOverview].filter(Boolean);

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          {/* رأس الصفحة */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={handleBackPress}
            >
              <Icon name="chevron-right" size={22} color={COLORS.ink} />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>{t.headerTitle}</Text>
              <View style={styles.dateContainer}>
                <Icon name="calendar" size={10} color={COLORS.gray} />
                <Text style={styles.dateText}>{reportDate}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.langButton}
              onPress={handleToggleLanguage}
              disabled={translating}
              activeOpacity={0.8}
            >
              {translating ? (
                <ActivityIndicator size="small" color={COLORS.red} />
              ) : (
                <>
                  <Icon name="globe" size={14} color={COLORS.red} />
                  <Text style={styles.langButtonText}>{isAR ? 'EN' : 'AR'}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            {/* البطاقة الرئيسية */}
            <View style={styles.mainCard}>
              <View style={styles.mainCardTopRow}>
                {report.report_id ? (
                  <Text style={styles.reportIdText}>
                    {t.reportId} <Text style={styles.reportIdMono}>{report.report_id}</Text>
                  </Text>
                ) : <View />}
                <View style={[styles.severityBadgeMain, { backgroundColor: sevStyle.bg, borderColor: sevStyle.border }]}>
                  <Text style={[styles.severityBadgeMainText, { color: sevStyle.fg }]}>{sevLabel}</Text>
                </View>
              </View>
              <View style={styles.mainCardIcon}>
                <Icon name={isHealthy ? "check-circle" : "alert-circle"} size={32} color="#fff" />
              </View>
              <Text style={styles.mainCardTitle}>
                {isHealthy ? t.healthyTitle : t.issuesTitle}
              </Text>
              {!!introLine && (
                <Text style={styles.introLine}>{introLine}</Text>
              )}
            </View>

            {/* الملخص الذكي (PID overview + DTC insights) */}
            {aiNarrativeParts.length > 0 && (
              <View style={styles.insightCard}>
                <View style={styles.insightHeader}>
                  <Icon name="zap" size={18} color="#fff" />
                  <Text style={styles.insightLabel}>
                    {aiActive ? t.aiSummary : t.plainSummary}
                  </Text>
                </View>
                {aiNarrativeParts.map((part, i) => (
                  <Text key={i} style={[styles.insightText, i > 0 && { marginTop: 8 }]}>
                    {tr(part)}
                  </Text>
                ))}
              </View>
            )}

            {/* قسم أكواد الأعطال */}
            {dtcItems.length > 0 && (
              <View>
                <View style={styles.listHeader}>
                  <Text style={styles.listTitle}>{t.dtcs}</Text>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{dtcItems.length}</Text>
                  </View>
                </View>
                {dtcItems.map((dtc: any, idx: number) => {
                  const ds = String(dtc.severity || 'NORMAL').toUpperCase();
                  const dStyle = SEVERITY_MAP[ds] || SEVERITY_MAP.NORMAL;
                  const aiSentence = dtc.aiInterpretation?.smart_insight_ar?.trim();
                  const urgency = dtc.aiInterpretation?.urgency_ar;
                  return (
                    <View key={idx} style={[styles.dtcCard, { borderLeftColor: dStyle.fg, backgroundColor: dStyle.bg }]}>
                      <View style={styles.dtcHeader}>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.dtcCode, { color: dStyle.fg }]}>{dtc.code}</Text>
                          <Text style={styles.dtcName}>{tr(dtc.name)}</Text>
                          {dtc.mqttCategory && (
                            <View style={styles.dtcCategoryPill}>
                              <Text style={styles.dtcCategoryPillText}>
                                {tr(DTC_CATEGORY_LABEL_AR[dtc.mqttCategory as 'stored' | 'pending' | 'permanent'])}
                              </Text>
                            </View>
                          )}
                        </View>
                        {urgency && (
                          <View style={[styles.severityBadge, { backgroundColor: '#fff', borderColor: dStyle.border, borderWidth: 1 }]}>
                            <Text style={[styles.severityText, { color: dStyle.fg }]}>{tr(urgency)}</Text>
                          </View>
                        )}
                      </View>
                      {dtc.description && (
                        <Text style={styles.dtcDescription}>{tr(dtc.description)}</Text>
                      )}
                      {aiSentence && (
                        <View style={styles.dtcAiBox}>
                          <Text style={styles.dtcAiTitle}>{t.smartInsight}</Text>
                          <Text style={styles.dtcAiText}>{tr(aiSentence)}</Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}

            {/* قائمة القراءات */}
            {sensorData.length > 0 && (
              <View>
                <View style={styles.listHeader}>
                  <Text style={styles.listTitle}>{t.sensorReadings}</Text>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{t.sensorsCount(sensorData.length)}</Text>
                  </View>
                </View>
                {sensorData.some(s => s.aiInterpretation) && (
                  <View style={styles.aiEnabledBanner}>
                    <Text style={styles.aiEnabledText}>{t.smartAnalysisOn}</Text>
                  </View>
                )}

            {sensorData.map((item, idx) => {
              const isOpen = openIndex === idx;
              const sevLevel: string = item.severityLevel || (item.status === 'WARNING' ? 'MEDIUM' : 'NORMAL');
              const sevColors = SEVERITY_MAP[sevLevel] || SEVERITY_MAP.NORMAL;
              const statusColor = sevColors.fg;
              // Default per-level label (without emoji) derived from t.severity.
              const defaultLevelLabel = (t.severity[sevLevel] || t.severity.NORMAL).replace(/^\S+\s+/, '');
              const rawAiUrgency = item.aiInterpretation?.urgency_ar;
              // Trust the diagnostics engine status over the AI label.
              // - If engine says non-NORMAL, never show "طبيعي/آمن" from the AI.
              // - If engine says NORMAL, normalize legacy "آمن" to "طبيعي".
              const SAFE_LABELS = ['آمن', 'طبيعي'];
              let aiUrgency: string | undefined = rawAiUrgency;
              if (sevLevel !== 'NORMAL' && rawAiUrgency && SAFE_LABELS.includes(rawAiUrgency)) {
                aiUrgency = undefined;
              } else if (rawAiUrgency === 'آمن') {
                aiUrgency = 'طبيعي';
              }
              const statusText = aiUrgency
                ? `✨ ${tr(aiUrgency)}`
                : defaultLevelLabel;
              const hasAI = !!item.aiInterpretation;

              return (
                <View key={idx} style={[styles.sensorItem, isOpen && styles.sensorItemOpen]}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.sensorButton}
                    onPress={() => setOpenIndex(isOpen ? null : idx)}
                  >
                    <View style={styles.sensorLeft}>
                      <View style={[styles.iconBox, isOpen && styles.iconBoxOpen]}>
                        <Icon name="zap" size={18} color={statusColor} />
                      </View>
                      <View>
                        <View style={styles.labelRow}>
                          <Text style={styles.sensorLabel}>{tr(item.label)}</Text>
                          {hasAI && <Text style={styles.aiIndicator}>✨</Text>}
                        </View>
                        <View style={styles.statusRow}>
                          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                          <Text style={[styles.statusText, { color: statusColor }]}>
                            {statusText}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <View style={styles.sensorRight}>
                      <View style={styles.valueContainer}>
                        <Text style={[styles.value, item.status === 'WARNING' && styles.valueError]}>
                          {parseFloat(item.value).toFixed(2)}
                        </Text>
                        <Text style={styles.unit}>{item.unit}</Text>
                      </View>
                      <Icon 
                        name={isOpen ? "chevron-up" : "chevron-down"} 
                        size={16} 
                        color={COLORS.gray} 
                      />
                    </View>
                  </TouchableOpacity>

                  {isOpen && (
                    <View style={styles.explanationBox}>
                      {hasAI && (item.aiInterpretation?.smart_insight_ar || item.aiInterpretation?.mechanical_explanation_ar) ? (
                        <>
                          <View style={styles.explanationHeader}>
                            <View style={styles.explanationIcon}>
                              <Text style={styles.sparkle}>✨</Text>
                            </View>
                            <Text style={styles.explanationTitle}>{t.smartAnalysis}</Text>
                          </View>
                          <Text style={styles.explanationText}>
                            {tr(item.aiInterpretation.smart_insight_ar || item.aiInterpretation.mechanical_explanation_ar)}
                          </Text>
                          {item.aiInterpretation?.safety_tip_ar && (
                            <View style={styles.recommendationBox}>
                              <Icon name="alert-circle" size={14} color={COLORS.warning} />
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
                              <Icon name="info" size={10} color="#fff" />
                            </View>
                            <Text style={styles.explanationTitle}>{t.explanation}</Text>
                          </View>
                          <Text style={styles.explanationText}>{tr(item.explanation)}</Text>
                        </>
                      )}
                    </View>
                  )}
                </View>
              );
            })}
              </View>
            )}

            {/* الأسباب المحتملة */}
            {causesData.length > 0 && (
              <View>
                <View style={styles.listHeader}>
                  <Text style={styles.listTitle}>{t.causes}</Text>
                </View>
                {causesData.slice(0, 5).map((cause: any, idx: number) => (
                  <View key={idx} style={styles.causeCard}>
                    <Icon name="alert-circle" size={16} color={COLORS.warning} />
                    <View style={styles.causeContent}>
                      <Text style={styles.causeText}>{tr(cause.cause)}</Text>
                      {!!cause.evidence && (
                        <Text style={styles.causeEvidence}>{tr(cause.evidence)}</Text>
                      )}
                      {(cause.likelihood || cause.confidence) && (
                        <Text style={styles.causeMetrics}>
                          {t.likelihood}: {Math.round(cause.likelihood || 0)}% | {t.confidence}: {Math.round(cause.confidence || 0)}%
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* التوصية النهائية من DeepSeek */}
            {!!finalRecText && (
              <View style={styles.recCard}>
                <View style={styles.recHeader}>
                  <Icon name="zap" size={18} color="#fff" />
                  <Text style={styles.recHeaderText}>{t.smartRecommendation}</Text>
                </View>
                <Text style={[styles.recText, !isAR && { textAlign: 'left' }]}>{tr(finalRecText)}</Text>
                {needsMechanic && (
                  <View style={styles.mechanicBox}>
                    <Icon name="tool" size={16} color={COLORS.red} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.mechanicTitle}>{t.needsMechanic}</Text>
                      {!!mechanicNote && (
                        <Text style={styles.mechanicNote}>{tr(mechanicNote)}</Text>
                      )}
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* أزرار الحفظ */}
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[styles.primaryButton, saved && styles.primaryButtonDisabled]}
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

            {/* تذييل */}
            <View style={styles.footer}>
              <Icon name="shield-off" size={20} color="#E5E7EB" />
              <Text style={styles.footerText}>
                {t.footer}
              </Text>
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 16,
    color: COLORS.error,
  },
  header: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.ink,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  dateText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.gray,
    letterSpacing: 1,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#871B1710',
    alignItems: 'center',
    justifyContent: 'center',
  },
  langButton: {
    minWidth: 56,
    height: 40,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: '#871B1710',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  langButtonText: {
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.red,
    letterSpacing: 0.5,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 20,
  },
  healthBar: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  healthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  healthLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.ink,
  },
  healthPercent: {
    fontSize: 18,
    fontWeight: '900',
  },
  healthProgressContainer: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },
  healthProgress: {
    height: '100%',
    borderRadius: 4,
  },
  mainCard: {
    backgroundColor: '#fff',
    borderRadius: 32,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F9FAFB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  mainCardIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: COLORS.red,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: COLORS.red,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  mainCardTitle: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 8,
    color: COLORS.ink,
  },
  mainCardSubtitle: {
    fontSize: 13,
    color: COLORS.gray,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
  },
  insightCard: {
    backgroundColor: COLORS.red,
    borderRadius: 24,
    padding: 20,
    shadowColor: COLORS.red,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  insightLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 1,
  },
  insightText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
    lineHeight: 20,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
  },
  listTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.gray,
    letterSpacing: 1,
  },
  badge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.gray,
  },
  sensorItem: {
    backgroundColor: '#fff',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: 12,
    overflow: 'hidden',
  },
  sensorItemOpen: {
    borderColor: 'rgba(135,27,23,0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  sensorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
  },
  sensorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxOpen: {
    backgroundColor: '#871B1710',
  },
  sensorLabel: {
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.ink,
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  sensorRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  value: {
    fontSize: 17,
    fontWeight: '900',
    color: COLORS.ink,
  },
  valueError: {
    color: COLORS.error,
  },
  unit: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#D1D5DB',
  },
  explanationBox: {
    paddingHorizontal: 18,
    paddingBottom: 18,
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  explanationIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.red,
    alignItems: 'center',
    justifyContent: 'center',
  },
  explanationTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.red,
    letterSpacing: 0.5,
  },
  explanationText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#4B5563',
    lineHeight: 18,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  aiIndicator: {
    fontSize: 12,
  },
  recommendationBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#FED7AA',
  },
  recommendationText: {
    flex: 1,
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.warning,
    lineHeight: 15,
  },
  sparkle: {
    fontSize: 14,
  },
  aiEnabledBanner: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  aiEnabledText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0369A1',
    textAlign: 'center',
  },
  mainCardTopRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reportIdText: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  reportIdMono: {
    fontFamily: 'monospace',
    color: '#6B7280',
  },
  severityBadgeMain: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  severityBadgeMainText: {
    fontSize: 12,
    fontWeight: '700',
  },
  introLine: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 12,
  },
  urgencyText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7C3AED',
    marginTop: 8,
  },
  dtcAiBox: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.08)',
  },
  dtcAiTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.ink,
    marginBottom: 4,
    opacity: 0.8,
  },
  dtcAiText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.ink,
    lineHeight: 18,
  },
  dtcAiUrgency: {
    fontSize: 10,
    color: COLORS.ink,
    opacity: 0.8,
    marginTop: 4,
  },
  dtcCategory: {
    fontSize: 10,
    color: COLORS.gray,
    marginTop: 8,
  },
  causeEvidence: {
    fontSize: 11,
    color: '#92400E',
    marginTop: 4,
    opacity: 0.85,
  },
  maintenanceMeta: {
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 12,
  },
  maintenanceMetaBold: {
    fontWeight: '700',
    color: COLORS.ink,
  },
  recCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    shadowColor: COLORS.red,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  recHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.red,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  recHeaderText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  recText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.ink,
    lineHeight: 22,
    textAlign: 'right',
  },
  mechanicBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#FEE2E2',
  },
  mechanicTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.red,
    marginBottom: 4,
  },
  mechanicNote: {
    fontSize: 12,
    color: COLORS.gray,
    lineHeight: 18,
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  footerText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 14,
  },
  dtcCategoryPill: {
    alignSelf: 'flex-start',
    marginTop: 6,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  dtcCategoryPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.ink,
  },
  dtcCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.error,
  },
  dtcHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  dtcCode: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.ink,
  },
  dtcName: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.gray,
    marginTop: 2,
  },
  severityBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  severityCritical: {
    backgroundColor: '#FEE2E2',
  },
  severityHigh: {
    backgroundColor: '#FEF3C7',
  },
  severityText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.error,
  },
  dtcDescription: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.gray,
    lineHeight: 16,
  },
  causeCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  causeContent: {
    flex: 1,
  },
  causeText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
  },
  causeMetrics: {
    fontSize: 10,
    color: '#B45309',
    marginTop: 4,
  },
  maintenanceCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  maintenanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  maintenanceTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.ink,
  },
  maintenanceAction: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.ink,
    marginBottom: 12,
  },
  measuresTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.gray,
    marginBottom: 8,
  },
  measureItem: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  measureBullet: {
    fontSize: 14,
    color: COLORS.red,
    fontWeight: 'bold',
  },
  measureText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.ink,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: COLORS.red,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
    shadowColor: COLORS.red,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  primaryButtonDisabled: {
    backgroundColor: COLORS.success,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default ReportScreen;
