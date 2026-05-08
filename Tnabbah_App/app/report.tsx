import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Feather as Icon } from '@expo/vector-icons';
import { useAuth } from '../providers/AuthProvider';
import { router, useLocalSearchParams } from 'expo-router';

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

  useEffect(() => {
    if (params.report) {
      try {
        const parsed = JSON.parse(String(params.report));
        setReport(parsed);
        
        // Transform all_pid_readings to sensor data
        const transformed = (parsed.all_pid_readings || []).map((reading: any) => ({
          label: reading.name || reading.pid_name,
          value: String(reading.value),
          unit: reading.unit,
          status: reading.status === 'NORMAL' ? 'SUCCESS' : 'WARNING',
          explanation: reading.explanation || reading.professional_explanation || `قراءة ${reading.pid_name || reading.name}`,
          pidCode: reading.pid_code,
        }));

        // Add AI interpretations if available
        const pidInterp = parsed.user_friendly_report_ar?.pid_mechanical_interpretation?.interpretations || [];
        console.log("🔍 PID Interpretations:", pidInterp);
        console.log("🔍 All PID Readings:", parsed.all_pid_readings);
        
        const aiByPid: Record<string, any> = {};
        pidInterp.forEach((it: any) => {
          console.log(`📌 Processing interpretation for ${it.pid_code}:`, it);
          if (it.pid_code) {
            // Normalize the PID code to uppercase with 0x prefix
            const normalizedCode = String(it.pid_code).toUpperCase();
            aiByPid[normalizedCode] = it;
          }
        });

        const transformedWithAI = transformed.map((item: any) => {
          const normalizedPidCode = String(item.pidCode).toUpperCase();
          const aiData = aiByPid[normalizedPidCode];
          console.log(`🔎 Searching for ${normalizedPidCode}: ${aiData ? '✅ Found' : '❌ Not found'}`);
          return {
            ...item,
            aiInterpretation: aiData,
          };
        });

        console.log("📊 Final transformed data:", transformedWithAI);
        setSensorData(transformedWithAI);

        // Index DTC AI interpretations by code
        const dtcInterpList = parsed.user_friendly_report_ar?.dtc_mechanical_interpretation?.interpretations || [];
        const aiByDtc: Record<string, any> = {};
        dtcInterpList.forEach((it: any) => {
          if (it.code) aiByDtc[String(it.code).toUpperCase()] = it;
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
    }
  }, [params.report]);

  const handleSaveReport = async () => {
    if (!report || !session?.user?.id) {
      Alert.alert("خطأ", "يجب تسجيل الدخول أولاً");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/api/save-report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          report_id: report.report_id,
          user_id: session.user.id,
          is_permanent: true,
          expires_in_hours: 720,
        }),
      });

      if (response.ok) {
        setSaved(true);
        Alert.alert("✅ تم الحفظ", "تم حفظ التقرير بنجاح");
      } else {
        throw new Error("فشل الحفظ");
      }
    } catch (err) {
      console.error("Failed to save report:", err);
      Alert.alert("❌ خطأ", "فشل حفظ التقرير");
    } finally {
      setSaving(false);
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
          <Text style={styles.errorText}>لم يتم تحميل التقرير</Text>
        </View>
      </SafeAreaView>
    );
  }

  const reportDate = new Date(report.timestamp).toLocaleDateString('ar-SA');
  const isHealthy = report.analysis_metadata?.is_vehicle_healthy === true;
  const overallHealth = report.analysis_metadata?.overall_health ?? 100;
  const userFriendly = report.user_friendly_report_ar || {};
  const healthPct = userFriendly.overall_health_percent ?? Math.round(overallHealth);
  const healthLine = userFriendly.overall_health || '';

  // Severity styles (mirror web report)
  const severity = String(report.severity || 'LOW').toUpperCase();
  const SEVERITY_MAP: Record<string, { label: string; bg: string; fg: string; border: string }> = {
    LOW:      { label: '🟢 تنبيه بسيط', bg: '#DCFCE7', fg: '#166534', border: '#86EFAC' },
    MEDIUM:   { label: '🟡 تحذير',      bg: '#FEF9C3', fg: '#854D0E', border: '#FDE68A' },
    HIGH:     { label: '🟠 خطر',        bg: '#FFEDD5', fg: '#9A3412', border: '#FDBA74' },
    CRITICAL: { label: '🔴 خطر شديد',   bg: '#FEE2E2', fg: '#991B1B', border: '#FCA5A5' },
  };
  const sevStyle = SEVERITY_MAP[severity] || SEVERITY_MAP.LOW;

  // Get AI interpretations
  const pidInterp = userFriendly.pid_mechanical_interpretation || {};
  const dtcInterp = userFriendly.dtc_mechanical_interpretation || {};

  // Build intro line: "تم تحليل N مؤشرات حيوية. يوجد ..."
  const nPids = userFriendly.pid_count || (report.all_pid_readings || []).length || 0;
  const nDtcs = (report.detected_dtcs || []).length;
  const nAnom = (report.detected_anomalies || []).length;
  let introLine = '';
  if (nPids > 0) introLine = `تم تحليل ${nPids} مؤشرات حيوية لسيارتك. `;
  if (isHealthy) introLine += 'جميع القراءات ضمن النطاق الطبيعي.';
  else if (nDtcs > 0 && nAnom > 0) introLine += `يوجد ${nDtcs} كود عطل و${nAnom} تنبيه يتطلب المتابعة.`;
  else if (nDtcs > 0) introLine += `يوجد ${nDtcs === 1 ? 'كود عطل واحد' : nDtcs + ' أكواد أعطال'} يتطلب المتابعة.`;
  else if (nAnom > 0) introLine += `يوجد ${nAnom === 1 ? 'تنبيه واحد' : nAnom + ' تنبيهات'} يتطلب الملاحظة.`;

  // Final AI recommendation (holistic, generated by DeepSeek)
  const finalRec = userFriendly.final_recommendation || null;
  const finalRecText = String(finalRec?.recommendation_ar || '').trim();
  const needsMechanic = !!finalRec?.needs_mechanic;
  const mechanicNote = String(finalRec?.mechanic_note_ar || '').trim();

  // Combined AI narrative (PID overview + DTC smart insights)
  const pidOverview = String(pidInterp.overview_ar || pidInterp.summary_ar || '').trim();
  const dtcInterpList: any[] = (dtcInterp.interpretations || []);
  const dtcOverview = dtcInterpList
    .map((it: any) => String(it.smart_insight_ar || '').trim())
    .filter(Boolean)
    .join(' — ');
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
              onPress={() => router.back()}
            >
              <Icon name="chevron-right" size={22} color={COLORS.ink} />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>تقرير تنبّه الذكي</Text>
              <View style={styles.dateContainer}>
                <Icon name="calendar" size={10} color={COLORS.gray} />
                <Text style={styles.dateText}>{reportDate}</Text>
              </View>
            </View>
            <View style={styles.headerIcon}>
              <Icon name="activity" size={20} color={COLORS.red} />
            </View>
          </View>

          <View style={styles.content}>
            {/* البطاقة الرئيسية */}
            <View style={styles.mainCard}>
              <View style={styles.mainCardTopRow}>
                {report.report_id ? (
                  <Text style={styles.reportIdText}>
                    رقم التقرير: <Text style={styles.reportIdMono}>{report.report_id}</Text>
                  </Text>
                ) : <View />}
                <View style={[styles.severityBadgeMain, { backgroundColor: sevStyle.bg, borderColor: sevStyle.border }]}>
                  <Text style={[styles.severityBadgeMainText, { color: sevStyle.fg }]}>{sevStyle.label}</Text>
                </View>
              </View>
              <View style={styles.mainCardIcon}>
                <Icon name={isHealthy ? "check-circle" : "alert-circle"} size={32} color="#fff" />
              </View>
              <Text style={styles.mainCardTitle}>
                {isHealthy ? "سيارتك بحالة ممتازة 🎉" : "تم اكتشاف ملاحظات"}
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
                    {aiActive ? '✨ تحليل تنبّه الذكي' : '📋 ملخص التحليل'}
                  </Text>
                </View>
                {aiNarrativeParts.map((part, i) => (
                  <Text key={i} style={[styles.insightText, i > 0 && { marginTop: 8 }]}>
                    {part}
                  </Text>
                ))}
              </View>
            )}

            {/* قسم أكواد الأعطال */}
            {dtcItems.length > 0 && (
              <View>
                <View style={styles.listHeader}>
                  <Text style={styles.listTitle}>أكواد الأعطال المكتشفة</Text>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{dtcItems.length}</Text>
                  </View>
                </View>
                {dtcItems.map((dtc: any, idx: number) => {
                  const ds = String(dtc.severity || 'MEDIUM').toUpperCase();
                  const dStyle = SEVERITY_MAP[ds] || SEVERITY_MAP.MEDIUM;
                  const aiSentence = dtc.aiInterpretation?.smart_insight_ar?.trim();
                  const urgency = dtc.aiInterpretation?.urgency_ar;
                  return (
                    <View key={idx} style={[styles.dtcCard, { borderLeftColor: dStyle.fg, backgroundColor: dStyle.bg }]}>
                      <View style={styles.dtcHeader}>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.dtcCode, { color: dStyle.fg }]}>{dtc.code}</Text>
                          <Text style={styles.dtcName}>{dtc.name}</Text>
                        </View>
                        {urgency && (
                          <View style={[styles.severityBadge, { backgroundColor: '#fff', borderColor: dStyle.border, borderWidth: 1 }]}>
                            <Text style={[styles.severityText, { color: dStyle.fg }]}>{urgency}</Text>
                          </View>
                        )}
                      </View>
                      {dtc.description && (
                        <Text style={styles.dtcDescription}>{dtc.description}</Text>
                      )}
                      {aiSentence && (
                        <View style={styles.dtcAiBox}>
                          <Text style={styles.dtcAiTitle}>✨ تفسير ذكي</Text>
                          <Text style={styles.dtcAiText}>{aiSentence}</Text>
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
                  <Text style={styles.listTitle}>قراءات المستشعرات</Text>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{sensorData.length} حساس</Text>
                  </View>
                </View>
                {sensorData.some(s => s.aiInterpretation) && (
                  <View style={styles.aiEnabledBanner}>
                    <Text style={styles.aiEnabledText}>✨ تحليل ذكي مُفعَّل</Text>
                  </View>
                )}

            {sensorData.map((item, idx) => {
              const isOpen = openIndex === idx;
              const statusColor = item.status === 'WARNING' ? COLORS.warning : COLORS.success;
              const aiUrgency = item.aiInterpretation?.urgency_ar;
              const statusText = aiUrgency
                ? `✨ ${aiUrgency}`
                : (item.status === 'WARNING' ? 'تحذير' : 'طبيعي');
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
                          <Text style={styles.sensorLabel}>{item.label}</Text>
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
                            <Text style={styles.explanationTitle}>تحليل ذكي</Text>
                          </View>
                          <Text style={styles.explanationText}>
                            {item.aiInterpretation.smart_insight_ar || item.aiInterpretation.mechanical_explanation_ar}
                          </Text>
                          {item.aiInterpretation?.safety_tip_ar && (
                            <View style={styles.recommendationBox}>
                              <Icon name="alert-circle" size={14} color={COLORS.warning} />
                              <Text style={styles.recommendationText}>
                                {item.aiInterpretation.safety_tip_ar}
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
                            <Text style={styles.explanationTitle}>التفسير</Text>
                          </View>
                          <Text style={styles.explanationText}>{item.explanation}</Text>
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
                  <Text style={styles.listTitle}>الأسباب المحتملة</Text>
                </View>
                {causesData.slice(0, 5).map((cause: any, idx: number) => (
                  <View key={idx} style={styles.causeCard}>
                    <Icon name="alert-circle" size={16} color={COLORS.warning} />
                    <View style={styles.causeContent}>
                      <Text style={styles.causeText}>{cause.cause}</Text>
                      {!!cause.evidence && (
                        <Text style={styles.causeEvidence}>{cause.evidence}</Text>
                      )}
                      {(cause.likelihood || cause.confidence) && (
                        <Text style={styles.causeMetrics}>
                          احتمالية: {Math.round(cause.likelihood || 0)}% | ثقة: {Math.round(cause.confidence || 0)}%
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
                  <Text style={styles.recHeaderText}>✨ التوصية الذكية</Text>
                </View>
                <Text style={styles.recText}>{finalRecText}</Text>
                {needsMechanic && (
                  <View style={styles.mechanicBox}>
                    <Icon name="tool" size={16} color={COLORS.red} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.mechanicTitle}>تحتاج لزيارة فنّي/ميكانيكي مختص</Text>
                      {!!mechanicNote && (
                        <Text style={styles.mechanicNote}>{mechanicNote}</Text>
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
                      {saved ? "✅ محفوظ" : "💾 حفظ دائم"}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* تذييل */}
            <View style={styles.footer}>
              <Icon name="shield-off" size={20} color="#E5E7EB" />
              <Text style={styles.footerText}>
                ملاحظة: هذا التقرير مقدم من "تنبّه" كدليل استرشادي ذكي.
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
