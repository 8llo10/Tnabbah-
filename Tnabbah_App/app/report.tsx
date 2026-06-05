import { Feather as Icon, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  ActivityIndicator,
  Alert,
  BackHandler,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { useAppSettings } from '../providers/AppSettingsProvider';
import { useAuth } from '../providers/AuthProvider';

const API_URL = process.env.EXPO_PUBLIC_DIAGNOSTICS_API || "http://127.0.0.1:8001";

const FONT_BOLD = "Alexandria_700Bold";

// Project colour palette (matches home.tsx / wallet.tsx)
const LIGHT_COLORS = {
  primary: "#871B17",
  primaryLight: "#9A211C",
  primaryDark: "#761713",
  buttonGradientStart: "#9A211C",
  buttonGradientEnd: "#761713",
  bg: "#F8F8F8",
  surface: "#FFFFFF",
  soft: "#F8F8F8",
  softRed: "#F2D7DA",
  border: "#EDEDED",
  text: "#1D1D1F",
  muted: "#7A7A7A",
  danger: "#C62828",
  warning: "#B7791F",
  success: "#1F8A4C",
  modalOverlay: "rgba(0, 0, 0, 0.40)",
  notificationUnreadBg: "#FFF8F8",
  floatingBg: "#871B17",
  floatingIcon: "#FFFFFF",
  floatingBorder: "rgba(255,255,255,0.82)",
  floatingTitle: "#FFFFFF",
  floatingSubtitle: "rgba(255,255,255,0.86)",
  floatingIconBg: "rgba(255,255,255,0.18)",
  floatingGlow: "rgba(135,27,23,0.24)",
  floatingGlowBorder: "rgba(135,27,23,0.32)",
  floatingMarkBg: "rgba(255,255,255,0.18)",
  floatingTypingBg: "#FFFFFF",
  floatingTypingBorder: "rgba(135,27,23,0.24)",
  floatingTypingDot: "#871B17",
  connectedBg: "#EFFAF3",
  connectedBorder: "#D6F0DF",
  disconnectedBg: "#FFF1F1",
  disconnectedBorder: "#FFD9D9",
  rawText: "#555555",
  // report.tsx aliases
  ink: "#1D1D1F",
  gray: "#7A7A7A",
  error: "#C62828",
};

const LIGHT_SEVERITY_MAP: Record<string, { bg: string; fg: string; border: string }> = {
  NORMAL:   { bg: '#EFFAF3', fg: '#1F8A4C', border: '#D6F0DF' },
  LOW:      { bg: '#F0FDF4', fg: '#1F8A4C', border: '#BBF7D0' },
  MEDIUM:   { bg: '#FFF7E6', fg: '#B45309', border: 'rgba(245,158,11,0.28)' },
  HIGH:     { bg: '#FFF3E0', fg: '#C2410C', border: 'rgba(234,88,12,0.28)' },
  CRITICAL: { bg: '#FFF1F1', fg: '#C62828', border: '#FFD9D9' },
};

const DARK_SEVERITY_MAP: Record<string, { bg: string; fg: string; border: string }> = {
  NORMAL:   { bg: 'rgba(31,138,76,0.14)',   fg: '#65C18C', border: 'rgba(101,193,140,0.30)' },
  LOW:      { bg: 'rgba(31,138,76,0.18)',   fg: '#65C18C', border: 'rgba(101,193,140,0.36)' },
  MEDIUM:   { bg: 'rgba(253,186,116,0.12)', fg: '#FDBA74', border: 'rgba(253,186,116,0.32)' },
  HIGH:     { bg: 'rgba(234,88,12,0.14)',   fg: '#FB923C', border: 'rgba(251,146,60,0.32)'  },
  CRITICAL: { bg: 'rgba(182,58,52,0.14)',   fg: '#E57373', border: 'rgba(182,58,52,0.36)'  },
};

const DARK_COLORS = {
  primary: "#B63A34",
  primaryLight: "#B63A34",
  primaryDark: "#871B17",
  buttonGradientStart: "#B63A34",
  buttonGradientEnd: "#871B17",
  bg: "#151515",
  surface: "#202020",
  soft: "#292929",
  softRed: "rgba(182,58,52,0.16)",
  border: "#383838",
  text: "#FFFFFF",
  muted: "#C7C7C7",
  danger: "#B63A34",
  warning: "#F0B45B",
  success: "#66BB6A",
  modalOverlay: "rgba(0, 0, 0, 0.62)",
  notificationUnreadBg: "rgba(182,58,52,0.14)",
  floatingBg: "#B63A34",
  floatingIcon: "#FFFFFF",
  floatingBorder: "rgba(255,255,255,0.30)",
  floatingTitle: "#FFFFFF",
  floatingSubtitle: "rgba(255,255,255,0.90)",
  floatingIconBg: "rgba(255,255,255,0.20)",
  floatingGlow: "rgba(182,58,52,0.30)",
  floatingGlowBorder: "rgba(182,58,52,0.34)",
  floatingMarkBg: "rgba(255,255,255,0.18)",
  floatingTypingBg: "#2A2A2A",
  floatingTypingBorder: "rgba(182,58,52,0.40)",
  floatingTypingDot: "#B63A34",
  connectedBg: "rgba(46,125,50,0.18)",
  connectedBorder: "rgba(102,187,106,0.22)",
  disconnectedBg: "rgba(182,58,52,0.12)",
  disconnectedBorder: "rgba(182,58,52,0.32)",
  rawText: "#D7D7D7",
  // report.tsx aliases
  ink: "#FFFFFF",
  gray: "#C7C7C7",
  error: "#B63A34",
};

// Static UI labels for AR/EN. Dynamic content (PID names, AI text, DTC text)
// is translated on demand through the backend /api/translate endpoint.
const UI = {
  AR: {
    headerTitle: 'تقرير تنبّه الذكي',
    reportId: 'رقم التقرير:',
    carName: 'السيارة:',
    sensorReadings: 'قراءات مستشعرات السيارة',
    sensorsCount: (n: number) => `${n} حساس`,
    dtcs: 'رموز الأعطال المكتشفة',
    dtcsCount: (n: number) => `${n} رمز`,
    causes: 'الأسباب المحتملة',
    likelihood: 'احتمالية',
    confidence: 'ثقة',
    smartAnalysis: 'تحليل ذكي',
    smartInsight: 'تفسير ذكي',
    explanation: 'التفسير',
    smartRecommendation: 'التوصية الذكية',
    needsMechanic: 'تحتاج لزيارة فنّي/ميكانيكي مختص',
    healthyTitle: 'سيارتك بحالة ممتازة',
    issuesTitle: 'نتائج الفحص',
    aiSummary: 'تحليل تنبّه الذكي',
    plainSummary: 'ملخص التحليل',
    statusWarning: 'تحذير',
    statusNormal: 'طبيعي',
    saved: 'محفوظ',
    save: 'حفظ دائم',
    footer: 'ملاحظة: هذا التقرير مقدم من "تنبّه" كدليل استرشادي ذكي.',
    notLoaded: 'لم يتم تحميل التقرير',
    saveError: 'فشل حفظ التقرير',
    saveSuccess: 'تم حفظ التقرير بنجاح',
    saveErrorTitle: 'خطأ',
    saveSuccessTitle: 'تم الحفظ',
    loginRequired: 'يجب تسجيل الدخول أولاً',
    error: 'خطأ',
    translateFailedTitle: 'فشل الترجمة',
    translateFailedMsg: 'تعذّر ترجمة التقرير، حاول لاحقاً',
    unsavedTitle: 'لم يتم حفظ التقرير',
    unsavedMessage: 'سيتم الاحتفاظ بهذا التقرير لمدة 24 ساعة فقط ثم سيُحذف تلقائياً إذا لم تقم بحفظه بشكل دائم.',
    unsavedSave: 'حفظ دائم',
    unsavedLeave: 'خروج بدون حفظ',
    unsavedCancel: 'إلغاء',
    tabPids: 'قراءات السيارة',
    tabAnalysis: 'تحليل تنبّه الذكي',
    severity: {
      NORMAL: 'طبيعي',
      LOW: 'تنبيه بسيط',
      MEDIUM: 'تحذير',
      HIGH: 'خطر',
      CRITICAL: 'خطر شديد',
    } as Record<string, string>,
  },
  EN: {
    headerTitle: 'Tnabbah Smart Report',
    reportId: 'Report ID:',
    carName: 'Car:',
    sensorReadings: 'Car Sensor Readings',
    sensorsCount: (n: number) => `${n} sensors`,
    dtcs: 'Detected Trouble Codes',
    dtcsCount: (n: number) => `${n} ${n === 1 ? 'code' : 'codes'}`,
    causes: 'Likely Causes',
    likelihood: 'Likelihood',
    confidence: 'Confidence',
    smartAnalysis: 'Smart Analysis',
    smartInsight: 'Smart Insight',
    explanation: 'Explanation',
    smartRecommendation: 'Smart Recommendation',
    needsMechanic: 'Visit a qualified technician/mechanic',
    healthyTitle: 'Your car is in excellent condition',
    issuesTitle: 'Scan Results',
    aiSummary: 'Tnabbah Smart Analysis',
    plainSummary: 'Analysis Summary',
    statusWarning: 'Warning',
    statusNormal: 'Normal',
    saved: 'Saved',
    save: 'Save Permanently',
    footer: 'Note: This report is provided by "Tnabbah" as a smart guidance reference.',
    notLoaded: 'Report not loaded',
    saveError: 'Failed to save the report',
    saveSuccess: 'Report saved successfully',
    saveErrorTitle: 'Error',
    saveSuccessTitle: 'Saved',
    loginRequired: 'You must log in first',
    error: 'Error',
    translateFailedTitle: 'Translation Failed',
    translateFailedMsg: 'Could not translate the report. Try again later.',
    unsavedTitle: 'Report not saved',
    unsavedMessage: 'This report will be kept for only 24 hours and then automatically deleted if you do not save it permanently.',
    unsavedSave: 'Save Permanently',
    unsavedLeave: 'Leave without saving',
    unsavedCancel: 'Cancel',
    tabPids: 'Car Readings',
    tabAnalysis: 'Tnabah AI Analysis',
    severity: {
      NORMAL: 'Normal',
      LOW: 'Minor Notice',
      MEDIUM: 'Warning',
      HIGH: 'Risk',
      CRITICAL: 'Severe Risk',
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

// ─────────────────────────────────────────────────────────────
// PID → icon mapping (same icon library as Home/Wallet:
// @expo/vector-icons — Feather + MaterialCommunityIcons).
// Picks a context-relevant glyph from the PID code, unit, and label
// (Arabic or English), e.g. thermometer for temperature, gauge for
// pressure/RPM, zap for voltage.
// ─────────────────────────────────────────────────────────────
type PidGlyphSpec = { pack: 'feather' | 'material'; name: string };

const PID_CODE_ICON: Record<string, PidGlyphSpec> = {
  '0X05': { pack: 'feather', name: 'thermometer' }, // engine coolant temp
  '0X0F': { pack: 'feather', name: 'thermometer' }, // intake air temp
  '0X46': { pack: 'feather', name: 'thermometer' }, // ambient air temp
  '0X5C': { pack: 'feather', name: 'thermometer' }, // engine oil temp
  '0X0C': { pack: 'material', name: 'gauge' },        // engine RPM
  '0X0D': { pack: 'feather', name: 'navigation' },    // vehicle speed
  '0X42': { pack: 'feather', name: 'zap' },           // control module voltage
  '0X04': { pack: 'feather', name: 'percent' },       // engine load
  '0X11': { pack: 'feather', name: 'percent' },       // throttle position
  '0X10': { pack: 'feather', name: 'wind' },          // MAF air flow
  '0X0B': { pack: 'material', name: 'gauge' },        // intake manifold pressure
  '0X0A': { pack: 'material', name: 'gauge' },        // fuel pressure
  '0X33': { pack: 'material', name: 'gauge' },        // barometric pressure
  '0X2F': { pack: 'material', name: 'fuel' },         // fuel level
};

const getPidIcon = (item: any): PidGlyphSpec => {
  const code = String(item?.pidCode || '').toUpperCase();
  if (PID_CODE_ICON[code]) return PID_CODE_ICON[code];

  const unit = String(item?.unit || '').toLowerCase();
  const label = String(item?.label || '').toLowerCase();
  const has = (...words: string[]) => words.some((w) => label.includes(w) || unit.includes(w));

  // Temperature
  if (unit.includes('°c') || unit.includes('°f') || has('حرار', 'temp', 'coolant', 'تبريد'))
    return { pack: 'feather', name: 'thermometer' };
  // RPM / engine speed
  if (unit.includes('rpm') || has('دوران', 'rpm', 'دورة'))
    return { pack: 'material', name: 'gauge' };
  // Vehicle speed
  if (unit.includes('km/h') || unit.includes('mph') || has('سرعة', 'speed'))
    return { pack: 'feather', name: 'navigation' };
  // Voltage / battery
  if (unit === 'v' || unit.includes('volt') || has('جهد', 'بطار', 'voltage', 'battery'))
    return { pack: 'feather', name: 'zap' };
  // Pressure
  if (has('kpa', 'psi', 'bar', 'ضغط', 'pressure'))
    return { pack: 'material', name: 'gauge' };
  // Air flow / intake
  if (has('g/s', 'هواء', 'تدفق', 'maf', 'air', 'flow', 'intake'))
    return { pack: 'feather', name: 'wind' };
  // Fuel
  if (has('وقود', 'fuel', 'بنزين'))
    return { pack: 'material', name: 'fuel' };
  // Percentage-based loads
  if (unit.includes('%') || has('حمل', 'load', 'throttle', 'خانق'))
    return { pack: 'feather', name: 'percent' };

  // Default: generic signal/activity glyph
  return { pack: 'feather', name: 'activity' };
};

const PidGlyph = ({ item, size = 18, color }: { item: any; size?: number; color: string }) => {
  const { pack, name } = getPidIcon(item);
  return pack === 'material' ? (
    <MaterialCommunityIcons name={name as any} size={size} color={color} />
  ) : (
    <Icon name={name as any} size={size} color={color} />
  );
};

// ─────────────────────────────────────────────────────────────
// DTC → icon mapping. Prioritizes real dashboard warning lights
// (الطبلون) by matching the OBD-II code range and/or the fault
// meaning (Arabic + English keywords). Falls back to the generic
// P/C/B/U prefix glyph only when nothing specific matches.
// All glyphs verified to exist in the bundled MaterialCommunityIcons set.
// ─────────────────────────────────────────────────────────────
const getDtcIcon = (code: string, meaning: string = ''): PidGlyphSpec => {
  const c = String(code || '').trim().toUpperCase();
  const text = `${c} ${meaning}`.toLowerCase();
  const has = (...kw: string[]) => kw.some((k) => text.includes(k));

  // Cooling system / overheating (e.g. P0115-P0128, P0217, P0480-P0485)
  if (
    has('حرار', 'تبريد', 'رديتر', 'ثرموستات', 'مروحة',
        'coolant', 'overheat', 'thermostat', 'radiator', 'cooling') ||
    /^P0(11[5-9]|12[0-8]|217|48[0-5])/.test(c)
  )
    return { pack: 'material', name: 'coolant-temperature' };

  // Oil pressure / lubrication (e.g. P0520-P0524)
  if (has('زيت', 'oil', 'lubric') || /^P052[0-4]/.test(c))
    return { pack: 'material', name: 'oil' };

  // Battery / charging / alternator / system voltage
  if (
    has('بطار', 'شحن', 'مولد', 'دينمو',
        'battery', 'charging', 'alternator', 'generator', 'voltage') ||
    /^P0(56[0-9]|62[0-5]|A0)/.test(c)
  )
    return { pack: 'material', name: 'car-battery' };

  // Tire pressure monitoring (TPMS)
  if (has('إطار', 'الاطار', 'tpms', 'tire', 'tyre') || /^C0(75|76)/.test(c))
    return { pack: 'material', name: 'car-tire-alert' };

  // ABS / brakes (ABS gets the dedicated glyph)
  if (has('abs', 'مكابح', 'فرامل', 'brake'))
    return { pack: 'material', name: has('abs') ? 'car-brake-abs' : 'car-brake-alert' };

  // Airbag / SRS
  if (has('وساد', 'هوائية', 'airbag', 'srs', 'restraint'))
    return { pack: 'material', name: 'airbag' };

  // Steering
  if (has('توجيه', 'مقود', 'steering', 'eps'))
    return { pack: 'material', name: 'steering' };

  // Traction / stability control
  if (has('جر', 'ثبات', 'انزلاق', 'traction', 'stability', 'esp', 'esc'))
    return { pack: 'material', name: 'car-traction-control' };

  // Air intake / MAF / air filter (e.g. P0100-P0104)
  if (has('تدفق الهواء', 'سحب الهواء', 'فلتر الهواء', 'maf', 'air flow', 'airflow', 'intake', 'air filter') || /^P010[0-4]/.test(c))
    return { pack: 'material', name: 'air-filter' };

  // Fuel system / mixture / injectors (e.g. P0087, P0171-P0174, P0190-P0193)
  if (
    has('وقود', 'بنزين', 'خليط', 'حاقن', 'fuel', 'mixture', 'lean', 'rich', 'injector') ||
    /^P0(08[0-9]|17[0-4]|19[0-3])/.test(c)
  )
    return { pack: 'material', name: 'fuel' };

  // Misfire / ignition → check-engine light
  if (has('احتراق', 'إشعال', 'شمعات', 'misfire', 'ignition', 'spark') || /^P03(0[0-9]|1[0-2])/.test(c))
    return { pack: 'material', name: 'engine' };

  // Generic OBD-II prefix fallback
  switch (c.charAt(0)) {
    case 'P':
      return { pack: 'material', name: 'engine' };          // Powertrain
    case 'C':
      return { pack: 'material', name: 'car-brake-alert' };  // Chassis
    case 'B':
      return { pack: 'material', name: 'car-door' };         // Body
    case 'U':
      return { pack: 'material', name: 'lan-connect' };      // Network
    default:
      return { pack: 'feather', name: 'alert-triangle' };
  }
};

const DtcGlyph = ({
  code,
  meaning = '',
  size = 18,
  color,
}: {
  code: string;
  meaning?: string;
  size?: number;
  color: string;
}) => {
  const { pack, name } = getDtcIcon(code, meaning);
  return pack === 'material' ? (
    <MaterialCommunityIcons name={name as any} size={size} color={color} />
  ) : (
    <Icon name={name as any} size={size} color={color} />
  );
};

const ReportScreen = () => {
  const params = useLocalSearchParams();
  const { session } = useAuth();
  const insets = useSafeAreaInsets();

  const [report, setReport] = useState<any>(null);
  const [sensorData, setSensorData] = useState<any[]>([]);
  const [dtcItems, setDtcItems] = useState<any[]>([]);
  const [causesData, setCausesData] = useState<any[]>([]);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [supabaseRowId, setSupabaseRowId] = useState<string | null>(null);
  const [carName, setCarName] = useState<string | null>(null);
  const [userCarUuid, setUserCarUuid] = useState<string | null>(null);
  const autoSaveTriedRef = useRef<string | null>(null);
  const [lang, setLang] = useState<'AR' | 'EN'>('AR');
  const [trMap, setTrMap] = useState<Record<string, string>>({});
  const [translating, setTranslating] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'pids' | 'analysis'>('analysis');
  const tabScaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(tabScaleAnim, { toValue: 0.96, duration: 80, useNativeDriver: true }),
      Animated.spring(tabScaleAnim, { toValue: 1, tension: 120, friction: 8, useNativeDriver: true }),
    ]).start();
  }, [selectedTab]);

  const { darkModeEnabled } = useAppSettings();
  const COLORS = darkModeEnabled ? DARK_COLORS : LIGHT_COLORS;
  const isAR = lang === 'AR';
  const styles = useMemo(() => createStyles(COLORS, isAR), [COLORS, isAR]);

  const t = UI[lang];
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

  // Auto-insert as 'pending' once the report is parsed (only for freshly generated reports).
  // Also re-runs when userCarUuid resolves so the row is backfilled if the car lookup
  // finished after the initial insert.
  useEffect(() => {
    if (!report || !session?.user?.id) return;

    const dedupKey =
      String(report.report_id || '') ||
      `${session.user.id}:${report.timestamp || ''}`;

    if (supabaseRowId) {
      // Row already exists — backfill user_car_id if it just resolved.
      if (userCarUuid) {
        supabase
          .from('reports')
          .update({ user_car_id: userCarUuid })
          .eq('id', supabaseRowId)
          .eq('user_id', session.user.id)
          .then(({ error }: { error: any }) => {
            if (error) console.error('Backfill user_car_id failed:', error.message);
          });
      }
      return;
    }

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
            ...(userCarUuid ? { user_car_id: userCarUuid } : {}),
          })
          .select('id')
          .single();
        if (error) throw error;
        setSupabaseRowId(data.id);
      } catch (err: any) {
        console.error('Auto-save (pending) failed:', err?.message || err);
      }
    })();
  }, [report, session?.user?.id, supabaseRowId, userCarUuid]);

  // Resolve the car's display name for the report header. The MQTT car_id
  // (text) is stored in the report content; map it to the user's saved car
  // (user_cars.display_name) and fall back to the raw car_id.
  useEffect(() => {
    if (!report || !session?.user?.id) {
      setCarName(null);
      return;
    }
    const carIdText =
      report?.mqtt_snapshot?.car_id ||
      report?.analysis_metadata?.mqtt_snapshot?.car_id ||
      null;
    if (!carIdText) {
      setCarName(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('user_cars')
          .select('id, display_name, car_id')
          .eq('user_id', session.user.id)
          .eq('car_id', carIdText)
          .eq('is_deleted', false)
          .limit(1)
          .maybeSingle();
        if (cancelled) return;
        if (!error && data) {
          setCarName(data.display_name || data.car_id || carIdText);
          setUserCarUuid(data.id || null);
        } else {
          setCarName(carIdText);
        }
      } catch {
        if (!cancelled) setCarName(carIdText);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [report, session?.user?.id]);

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
            ...(userCarUuid ? { user_car_id: userCarUuid } : {}),
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
            ...(userCarUuid ? { user_car_id: userCarUuid } : {}),
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
          <ActivityIndicator size="large" color={COLORS.primary} />
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

  const reportDate = new Date(report.timestamp).toLocaleDateString('en-US');
  const isHealthy = report.analysis_metadata?.is_vehicle_healthy === true;
  const overallHealth = report.analysis_metadata?.overall_health ?? 100;
  const userFriendly = report.user_friendly_report_ar || {};
  const healthPct = userFriendly.overall_health_percent ?? Math.round(overallHealth);
  const healthLine = userFriendly.overall_health || '';

  // Severity styles (mirror web report)
  const severity = String(report.severity || 'NORMAL').toUpperCase();
  const SEVERITY_MAP = darkModeEnabled ? DARK_SEVERITY_MAP : LIGHT_SEVERITY_MAP;
  const sevStyle = SEVERITY_MAP[severity] || SEVERITY_MAP.NORMAL;
  const sevLabel = (t.severity[severity] || t.severity.NORMAL);

  // Get AI interpretations
  const pidInterp = userFriendly.pid_mechanical_interpretation || {};
  const dtcInterp = userFriendly.dtc_mechanical_interpretation || {};

  // Build intro line with proper Arabic/English pluralization.
  const nPids = userFriendly.pid_count || (report.all_pid_readings || []).length || 0;
  const nDtcs = (report.detected_dtcs || []).length;
  const nAnom = (report.detected_anomalies || []).length;

  const dtcPhraseAR = (n: number) => {
    if (n === 0) return '';
    if (n === 1) return 'رمز عطل واحد';
    if (n === 2) return 'رمزي عطل';
    return `${n} رموز عطل`; // 3–10 plural; 11+ uses singular in formal Arabic,
                           // but "رموز" reads naturally across all counts in UI.
  };
  const anomPhraseAR = (n: number) => {
    if (n === 0) return '';
    if (n === 1) return 'تنبيه واحد';
    if (n === 2) return 'تنبيهان';
    return `${n} تنبيهات`;
  };
  const pidCountAR = (n: number) => {
    if (n === 1) return 'قراءة واحدة';
    if (n === 2) return 'قراءتين';
    return `${n} قراءات`;
  };

  const dtcPhraseEN = (n: number) =>
    n === 1 ? '1 trouble code' : `${n} trouble codes`;
  const anomPhraseEN = (n: number) =>
    n === 1 ? '1 alert' : `${n} alerts`;

  let introLine = '';
  if (isAR) {
    if (isHealthy) {
      introLine = `تم تحليل ${pidCountAR(nPids)}. جميع القراءات طبيعية ولا توجد أي ملاحظات تستدعي المتابعة.`;
    } else if (nDtcs > 0 && nAnom > 0) {
      introLine = `تم رصد ${dtcPhraseAR(nDtcs)} و ${anomPhraseAR(nAnom)} تستدعي المتابعة لضمان سلامة وأمان سيارتك.`;
    } else if (nDtcs > 0) {
      introLine = `تم رصد ${dtcPhraseAR(nDtcs)} يستدعي المتابعة لضمان سلامة وأمان سيارتك.`;
    } else if (nAnom > 0) {
      introLine = `تم رصد ${anomPhraseAR(nAnom)} تستدعي المتابعة لضمان سلامة وأمان سيارتك.`;
    }
  } else {
    if (isHealthy) {
      introLine = `Analyzed ${nPids} reading${nPids === 1 ? '' : 's'}. All readings are normal with no issues requiring attention.`;
    } else if (nDtcs > 0 && nAnom > 0) {
      introLine = `Detected ${dtcPhraseEN(nDtcs)} and ${anomPhraseEN(nAnom)} requiring attention to ensure your car's safety.`;
    } else if (nDtcs > 0) {
      introLine = `Detected ${dtcPhraseEN(nDtcs)} requiring attention to ensure your car's safety.`;
    } else if (nAnom > 0) {
      introLine = `Detected ${anomPhraseEN(nAnom)} requiring attention to ensure your car's safety.`;
    }
  }

  // Final AI recommendation (holistic, generated by DeepSeek)
  const finalRec = userFriendly.final_recommendation || null;
  const finalRecText = String(finalRec?.recommendation_ar || '').trim();
  const needsMechanic = !!finalRec?.needs_mechanic;
  const mechanicNote = String(finalRec?.mechanic_note_ar || '').trim();

  // Smart summary card ("تحليل تنبّه الذكي").
  // Holistic one-liner: normal vs abnormal readings + DTC code with a brief
  // meaning — the deeper root-cause story still lives on each DTC card's
  // smart_insight_ar.
  // e.g. "جميع القراءات طبيعية باستثناء حرارة المحرك ... مع وجود كود P0104
  //       الذي يشير إلى خلل في حساس تدفق الهواء".
  const rawPidOverview = String(pidInterp.overview_ar || pidInterp.summary_ar || '').trim();
  const dtcInterpList: any[] = (dtcInterp.interpretations || []);
  const pidOverview = rawPidOverview;
  const aiActive = sensorData.some((s: any) => s.aiInterpretation) || dtcInterpList.length > 0;
  const aiNarrativeParts = [pidOverview].filter(Boolean);

  return (
    <>
      <StatusBar barStyle={darkModeEnabled ? 'light-content' : 'dark-content'} backgroundColor={COLORS.bg} />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 + insets.bottom }}
        >
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
            <View style={styles.headerButton} />
          </View>
          <View style={styles.headerDivider} />

          <View style={styles.content}>
            {/* البطاقة الرئيسية */}
            <View style={styles.mainCard}>
              <View style={styles.mainCardTopRow}>
                <View style={styles.mainCardMetaCol}>
                  {report.report_id ? (
                    <Text style={styles.reportIdText}>
                      {t.reportId} <Text style={styles.reportIdMono}>{report.report_id}</Text>
                    </Text>
                  ) : null}
                  {carName ? (
                    <Text style={styles.carNameText}>
                      {t.carName} <Text style={styles.carNameMono}>{carName}</Text>
                    </Text>
                  ) : null}
                </View>
                <View style={[styles.severityBadgeMain, { backgroundColor: sevStyle.bg, borderColor: sevStyle.border }]}>
                  <Text style={[styles.severityBadgeMainText, { color: sevStyle.fg }]}>{sevLabel}</Text>
                </View>
              </View>
              <View style={styles.mainCardIcon}>
                {isHealthy ? (
                  <Icon name="check-circle" size={32} color="#fff" />
                ) : (
                  <MaterialCommunityIcons name="car-search" size={32} color="#fff" />
                )}
              </View>
              <Text style={styles.mainCardTitle}>
                {isHealthy ? t.healthyTitle : t.issuesTitle}
              </Text>
              {!!introLine && (
                <Text style={styles.introLine}>{introLine}</Text>
              )}
            </View>

            {/* Segmented Control */}
            <View style={styles.segmentedControl}>
              <TouchableOpacity
                style={[
                  styles.segmentedButton,
                  selectedTab === 'pids' && styles.segmentedButtonActiveState,
                ]}
                onPress={() => setSelectedTab('pids')}
                activeOpacity={0.7}
              >
                {React.createElement(Animated.View, { style: [styles.segmentedButtonInner, selectedTab === 'pids' && styles.segmentedButtonInnerActive, selectedTab === 'pids' && { transform: [{ scale: tabScaleAnim }] }] as any }, <>                
                  <Icon name="list" size={13} color={selectedTab === 'pids' ? '#fff' : COLORS.gray} />
                  <Text style={[
                    styles.segmentedButtonText,
                    { color: selectedTab === 'pids' ? '#fff' : COLORS.gray }
                  ]}>
                    {t.tabPids} ({sensorData.length})
                  </Text>
                </>)}
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.segmentedButton,
                  selectedTab === 'analysis' && styles.segmentedButtonActiveState,
                ]}
                onPress={() => setSelectedTab('analysis')}
                activeOpacity={0.7}
              >
                {React.createElement(Animated.View, { style: [styles.segmentedButtonInner, selectedTab === 'analysis' && styles.segmentedButtonInnerActive, selectedTab === 'analysis' && { transform: [{ scale: tabScaleAnim }] }] as any }, <>                
                  <Icon name="zap" size={13} color={selectedTab === 'analysis' ? '#fff' : COLORS.gray} />
                  <Text style={[
                    styles.segmentedButtonText,
                    { color: selectedTab === 'analysis' ? '#fff' : COLORS.gray }
                  ]}>
                    {t.tabAnalysis}
                  </Text>
                </>)}
              </TouchableOpacity>
            </View>

            {/* Tab Content */}
            {selectedTab === 'analysis' ? (
              <>
            {/* الملخص الذكي + التوصية (قسم موحّد: التحليل ثم الإجراء المطلوب) */}
            {(aiNarrativeParts.length > 0 || !!finalRecText) && (
              <View style={styles.recCard}>

                {/* التحليل الميكانيكي */}
                {aiNarrativeParts.map((part, i) => (
                  <Text
                    key={i}
                    style={[styles.unifiedBodyText, !isAR && { textAlign: 'left' }, i > 0 && { marginTop: 8 }]}
                  >
                    {tr(part)}
                  </Text>
                ))}

                {/* التوصية تتبع التحليل مباشرة */}
                {!!finalRecText && (
                  <>
                    {aiNarrativeParts.length > 0 && <View style={styles.unifiedDivider} />}
                    <Text style={[styles.unifiedSubLabel, !isAR && { textAlign: 'left' }]}>
                      {t.smartRecommendation}
                    </Text>
                    <Text style={[styles.recText, !isAR && { textAlign: 'left' }]}>
                      {tr(finalRecText)}
                    </Text>
                    {needsMechanic && (
                      <View style={styles.mechanicBox}>
                        <Icon name="tool" size={16} color={COLORS.primary} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.mechanicTitle}>{t.needsMechanic}</Text>
                          {!!mechanicNote && (
                            <Text style={styles.mechanicNote}>{tr(mechanicNote)}</Text>
                          )}
                        </View>
                      </View>
                    )}
                  </>
                )}
              </View>
            )}

            {/* قسم أكواد الأعطال */}
            {dtcItems.length > 0 && (
              <View>
                <View style={styles.listHeader}>
                  <Text style={styles.listTitle}>{t.dtcs}</Text>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{t.dtcsCount(dtcItems.length)}</Text>
                  </View>
                </View>
                {dtcItems.map((dtc: any, idx: number) => {
                  const ds = String(dtc.severity || 'NORMAL').toUpperCase();
                  const dStyle = SEVERITY_MAP[ds] || SEVERITY_MAP.NORMAL;
                  const aiSentence = dtc.aiInterpretation?.smart_insight_ar?.trim();
                  const urgency = dtc.aiInterpretation?.urgency_ar;
                  return (
                    <View key={idx} style={[styles.dtcCard, { borderColor: dStyle.border, backgroundColor: dStyle.bg }]}>
                      <View style={styles.dtcHeader}>
                        <View style={[styles.dtcIconBox, { borderColor: dStyle.border }]}>
                          <DtcGlyph
                            code={dtc.code}
                            meaning={`${dtc.name || ''} ${dtc.description || ''}`}
                            size={20}
                            color={dStyle.fg}
                          />
                        </View>
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
                          <View style={[styles.severityBadge, { backgroundColor: dStyle.bg, borderColor: dStyle.border }]}>
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
            </>
            ) : (
              <>
            {/* قائمة القراءات */}
            {sensorData.length > 0 && (
              <View>
                <View style={styles.listHeader}>
                  <Text style={styles.listTitle}>{t.sensorReadings}</Text>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{t.sensorsCount(sensorData.length)}</Text>
                  </View>
                </View>
            {sensorData.map((item, idx) => {
              const isOpen = openIndex === idx;
              const sevLevel: string = item.severityLevel || (item.status === 'WARNING' ? 'MEDIUM' : 'NORMAL');
              const sevColors = SEVERITY_MAP[sevLevel] || SEVERITY_MAP.NORMAL;
              const statusColor = sevColors.fg;
              const defaultLevelLabel = t.severity[sevLevel] || t.severity.NORMAL;
              const rawAiUrgency = item.aiInterpretation?.urgency_ar;
              const SAFE_LABELS = ['آمن', 'طبيعي'];
              let aiUrgency: string | undefined = rawAiUrgency;
              if (sevLevel !== 'NORMAL' && rawAiUrgency && SAFE_LABELS.includes(rawAiUrgency)) {
                aiUrgency = undefined;
              } else if (rawAiUrgency === 'آمن') {
                aiUrgency = 'طبيعي';
              }
              const statusText = aiUrgency
                ? tr(aiUrgency)
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
                        <PidGlyph item={item} size={18} color={statusColor} />
                      </View>
                      <View>
                        <View style={styles.labelRow}>
                          <Text style={styles.sensorLabel}>{tr(item.label)}</Text>
                          {hasAI && <Icon name="zap" size={12} color={COLORS.primary} style={styles.aiIndicator} />}
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
                              <Icon name="zap" size={10} color="#fff" />
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
              </>
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
              <Icon name="shield-off" size={20} color={COLORS.border} />
              <Text style={styles.footerText}>
                {t.footer}
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

function createStyles(COLORS: typeof LIGHT_COLORS, isAR = true) {
  const rowDirection = isAR ? 'row-reverse' : 'row';
  const textAlign = isAR ? 'right' : 'left';
  const alignSelf = isAR ? 'flex-end' : 'flex-start';
  return StyleSheet.create({
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
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.error,
    includeFontPadding: true,
  },
  header: {
    backgroundColor: COLORS.bg,
    flexDirection: rowDirection,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 8,
  },
  headerDivider: {
    height: 1,
    backgroundColor: COLORS.border,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.2,
    color: COLORS.ink,
    fontFamily: FONT_BOLD,
    textAlign: 'center',
    lineHeight: 26,
    includeFontPadding: true,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  dateText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.gray,
    letterSpacing: 0.3,
    includeFontPadding: true,
  },
  headerIcon: {
    width: 40,
    height: 40,
  },
  langButton: {
    minWidth: 56,
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: COLORS.soft,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  langButtonText: {
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: 0.5,
    includeFontPadding: true,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 16,
    gap: 16,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 5,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  segmentedButton: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  segmentedButtonActiveState: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  segmentedButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  segmentedButtonInnerActive: {
    backgroundColor: COLORS.primary,
  },
  segmentedButtonText: {
    fontSize: 11,
    lineHeight: 17,
    color: COLORS.gray,
    fontFamily: FONT_BOLD,
    includeFontPadding: true,
  },
  healthBar: {
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  healthHeader: {
    flexDirection: rowDirection,
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  healthLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.ink,
    includeFontPadding: true,
  },
  healthPercent: {
    fontSize: 18,
    fontWeight: '900',
    includeFontPadding: true,
  },
  healthProgressContainer: {
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border,
    overflow: 'hidden',
  },
  healthProgress: {
    height: '100%',
    borderRadius: 4,
  },
  mainCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 28,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.035,
    shadowRadius: 6,
    elevation: 1,
  },
  mainCardIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 4,
  },
  mainCardTitle: {
    fontSize: 21,
    fontWeight: '900',
    marginBottom: 8,
    color: COLORS.ink,
    textAlign: 'center',
    includeFontPadding: true,
  },
  mainCardSubtitle: {
    fontSize: 13,
    color: COLORS.gray,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 22,
    includeFontPadding: true,
  },
  listHeader: {
    flexDirection: rowDirection,
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 4,
  },
  listTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.ink,
    includeFontPadding: true,
  },
  badge: {
    backgroundColor: COLORS.soft,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.gray,
    includeFontPadding: true,
  },
  sensorItem: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  sensorItemOpen: {
    borderColor: 'rgba(135,27,23,0.25)',
  },
  sensorButton: {
    flexDirection: rowDirection,
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  sensorLeft: {
    flexDirection: rowDirection,
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 14,
    backgroundColor: COLORS.soft,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxOpen: {
    backgroundColor: 'rgba(135,27,23,0.08)',
    borderColor: 'rgba(135,27,23,0.2)',
  },
  sensorLabel: {
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.ink,
    marginBottom: 3,
    includeFontPadding: true,
  },
  statusRow: {
    flexDirection: rowDirection,
    alignItems: 'center',
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    includeFontPadding: true,
  },
  sensorRight: {
    flexDirection: rowDirection,
    alignItems: 'center',
    gap: 10,
  },
  valueContainer: {
    flexDirection: rowDirection,
    alignItems: 'baseline',
    gap: 2,
  },
  value: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.ink,
    includeFontPadding: true,
  },
  valueError: {
    color: COLORS.error,
  },
  unit: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.gray,
    includeFontPadding: true,
  },
  explanationBox: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  explanationHeader: {
    flexDirection: rowDirection,
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  explanationIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  explanationTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: 0.5,
    includeFontPadding: true,
  },
  explanationText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.gray,
    lineHeight: 20,
    includeFontPadding: true,
  },
  labelRow: {
    flexDirection: rowDirection,
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  aiIndicator: {
    marginHorizontal: 2,
  },
  recommendationBox: {
    flexDirection: rowDirection,
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  recommendationText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.warning,
    lineHeight: 18,
    includeFontPadding: true,
  },
  mainCardTopRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reportIdText: {
    fontSize: 11,
    color: COLORS.gray,
    fontWeight: '700',
    includeFontPadding: true,
  },
  reportIdMono: {
    fontFamily: 'monospace',
    color: COLORS.gray,
  },
  mainCardMetaCol: {
    flex: 1,
  },
  carNameText: {
    fontSize: 11,
    color: COLORS.gray,
    marginTop: 2,
    fontWeight: '700',
    includeFontPadding: true,
  },
  carNameMono: {
    fontWeight: '900',
    color: COLORS.ink,
  },
  severityBadgeMain: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  severityBadgeMainText: {
    fontSize: 12,
    fontWeight: '900',
    includeFontPadding: true,
  },
  introLine: {
    fontSize: 13,
    color: COLORS.gray,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 10,
    includeFontPadding: true,
  },
  urgencyText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: 8,
    includeFontPadding: true,
  },
  dtcAiBox: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  dtcAiTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.primary,
    marginBottom: 4,
    includeFontPadding: true,
  },
  dtcAiText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.ink,
    lineHeight: 20,
    includeFontPadding: true,
  },
  dtcAiUrgency: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.gray,
    marginTop: 4,
    includeFontPadding: true,
  },
  dtcCategory: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.gray,
    marginTop: 6,
    includeFontPadding: true,
  },
  causeEvidence: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.warning,
    marginTop: 4,
    lineHeight: 18,
    includeFontPadding: true,
  },
  maintenanceMeta: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.gray,
    marginBottom: 12,
    includeFontPadding: true,
  },
  maintenanceMetaBold: {
    fontWeight: '900',
    color: COLORS.ink,
  },
  recCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 28,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.035,
    shadowRadius: 6,
    elevation: 1,
  },
  recHeader: {
    flexDirection: rowDirection,
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 14,
    alignSelf: alignSelf,
    marginBottom: 14,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 3,
  },
  recHeaderText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
    includeFontPadding: true,
  },
  recText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.ink,
    lineHeight: 24,
    textAlign,
    includeFontPadding: true,
  },
  unifiedBodyText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.ink,
    lineHeight: 24,
    textAlign,
    includeFontPadding: true,
  },
  unifiedDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 14,
  },
  unifiedSubLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: 0.5,
    marginBottom: 6,
    textAlign,
    includeFontPadding: true,
  },
  mechanicBox: {
    flexDirection: rowDirection,
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.softRed,
    borderRadius: 16,
    padding: 12,
  },
  mechanicTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.primary,
    marginBottom: 4,
    includeFontPadding: true,
  },
  mechanicNote: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.gray,
    lineHeight: 20,
    includeFontPadding: true,
  },
  footer: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  footerText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 16,
    includeFontPadding: true,
  },
  dtcCategoryPill: {
    alignSelf: 'flex-start',
    marginTop: 5,
    backgroundColor: COLORS.soft,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dtcCategoryPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.gray,
    includeFontPadding: true,
  },
  dtcCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  dtcHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 12,
  },
  dtcIconBox: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: COLORS.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dtcCode: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.ink,
    includeFontPadding: true,
  },
  dtcName: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.gray,
    marginTop: 2,
    lineHeight: 18,
    includeFontPadding: true,
  },
  severityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  severityCritical: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
  },
  severityHigh: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  severityText: {
    fontSize: 10,
    fontWeight: '900',
    includeFontPadding: true,
  },
  dtcDescription: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.gray,
    lineHeight: 18,
    includeFontPadding: true,
  },
  causeCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  causeContent: {
    flex: 1,
  },
  causeText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.ink,
    lineHeight: 20,
    includeFontPadding: true,
  },
  causeMetrics: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.muted,
    marginTop: 6,
    includeFontPadding: true,
  },
  maintenanceCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.035,
    shadowRadius: 6,
    elevation: 1,
  },
  maintenanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  maintenanceTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.ink,
    includeFontPadding: true,
  },
  maintenanceAction: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.ink,
    marginBottom: 12,
    lineHeight: 20,
    includeFontPadding: true,
  },
  measuresTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.gray,
    marginBottom: 8,
    includeFontPadding: true,
  },
  measureItem: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  measureBullet: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '900',
    includeFontPadding: true,
  },
  measureText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.ink,
    lineHeight: 18,
    includeFontPadding: true,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 28,
    gap: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 4,
  },
  primaryButtonDisabled: {
    backgroundColor: COLORS.success,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
    includeFontPadding: true,
  },
  });
}

export default ReportScreen;