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
} from 'react-native';
import { Feather as Icon } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

const COLORS = {
  red: "#871B17",
  bg: "#F9FAFB",
  ink: "#111827",
  gray: "#6B7280",
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444"
};

const API_URL = process.env.EXPO_PUBLIC_DIAGNOSTICS_API || "http://127.0.0.1:8001";

const HistoryScreen = () => {
  const params = useLocalSearchParams();
  const userId = String(params.user_id);
  
  const [saved, setSaved] = useState<any[]>([]);
  const [pending, setPending] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'saved' | 'pending'>('saved');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, [userId]);

  const loadReports = async () => {
    try {
      setLoading(true);
      
      // Load saved reports
      const savedRes = await fetch(`${API_URL}/api/reports/saved/${userId}`);
      if (savedRes.ok) {
        const savedData = await savedRes.json();
        setSaved(savedData.reports || []);
      }
      
      // Load pending reports
      const pendingRes = await fetch(`${API_URL}/api/reports/pending/${userId}`);
      if (pendingRes.ok) {
        const pendingData = await pendingRes.json();
        setPending(pendingData.reports || []);
      }
    } catch (err) {
      console.error("Failed to load reports:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReport = (reportId: string, status: string) => {
    Alert.alert(
      "حذف التقرير",
      "هل تريد حذف هذا التقرير بشكل نهائي؟",
      [
        { text: "إلغاء", style: "cancel" },
        {
          text: "حذف",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await fetch(`${API_URL}/api/delete-report`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  report_id: reportId,
                  user_id: userId,
                }),
              });

              if (response.ok) {
                Alert.alert("✅", "تم حذف التقرير");
                loadReports();
              }
            } catch (err) {
              Alert.alert("❌", "فشل الحذف");
            }
          },
        },
      ]
    );
  };

  const handleViewReport = (report: any) => {
    router.push({
      pathname: "/report",
      params: { report: JSON.stringify(report.content) }
    });
  };

  const reports = activeTab === 'saved' ? saved : pending;

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <Icon name="arrow-left" size={24} color={COLORS.ink} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>التقارير</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'saved' && styles.tabActive
            ]}
            onPress={() => setActiveTab('saved')}
          >
            <Icon name="archive" size={18} color={activeTab === 'saved' ? COLORS.red : COLORS.gray} />
            <Text style={[
              styles.tabText,
              activeTab === 'saved' && styles.tabTextActive
            ]}>
              محفوظة ({saved.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'pending' && styles.tabActive
            ]}
            onPress={() => setActiveTab('pending')}
          >
            <Icon name="clock" size={18} color={activeTab === 'pending' ? COLORS.red : COLORS.gray} />
            <Text style={[
              styles.tabText,
              activeTab === 'pending' && styles.tabTextActive
            ]}>
              مؤقتة ({pending.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {loading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={COLORS.red} />
            </View>
          ) : reports.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Icon name="inbox" size={48} color={COLORS.gray} />
              <Text style={styles.emptyText}>
                {activeTab === 'saved' ? 'لا توجد تقارير محفوظة' : 'لا توجد تقارير مؤقتة'}
              </Text>
            </View>
          ) : (
            reports.map((report, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.reportCard}
                onPress={() => handleViewReport(report)}
              >
                <View style={styles.reportHeader}>
                  <Text style={styles.reportTitle}>
                    {report.content?.drive_advice || 'تقرير فحص'}
                  </Text>
                  <Icon name="chevron-left" size={20} color={COLORS.gray} />
                </View>

                <View style={styles.reportMeta}>
                  <Text style={styles.reportDate}>
                    {new Date(report.created_at).toLocaleDateString('ar-SA')}
                  </Text>
                  {activeTab === 'pending' && report.hours_until_expiry !== undefined && (
                    <Text style={styles.expiryTime}>
                      ينتهي خلال: {report.hours_until_expiry.toFixed(1)} ساعة
                    </Text>
                  )}
                </View>

                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDeleteReport(report.id, activeTab)}
                >
                  <Icon name="trash-2" size={16} color={COLORS.error} />
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E3E3E3',
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: COLORS.ink },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E3E3E3',
    gap: 6,
  },
  tabActive: {
    backgroundColor: COLORS.red + '10',
    borderColor: COLORS.red,
  },
  tabText: { fontSize: 13, fontWeight: '600', color: COLORS.gray },
  tabTextActive: { color: COLORS.red, fontWeight: '700' },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingVertical: 16, paddingBottom: 40 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 80,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 12,
  },
  reportCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E3E3E3',
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  reportTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.ink,
    flex: 1,
  },
  reportMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reportDate: {
    fontSize: 12,
    color: COLORS.gray,
  },
  expiryTime: {
    fontSize: 11,
    color: COLORS.warning,
    fontWeight: '600',
  },
  deleteBtn: {
    marginTop: 10,
    padding: 8,
    justifyContent: 'center',
  },
});

export default HistoryScreen;
