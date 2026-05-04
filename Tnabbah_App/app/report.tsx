import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  StyleSheet,
} from 'react-native';
import { Feather as Icon } from '@expo/vector-icons';

// الألوان (نفس المثال الأصلي)
const COLORS = {
  red: "#871B17",
  bg: "#F9FAFB",
  ink: "#111827",
  gray: "#6B7280",
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444"
};

// بيانات الحساسات مع أسماء أيقونات مناسبة من Feather
const SENSOR_DATA = [
  { 
    label: "حمل المحرك المحسوب", 
    desc: "نسبة الحمل الحالية للمحرك.", 
    value: "100.0", 
    unit: "%", 
    status: "ERROR",
    icon: "gauge",
    explanation: "هذا الرقم يمثل الجهد الذي يبذله المحرك. وجود نسبة 100% وأنت متوقف يعني أن المحرك يظن أنه يعمل بأقصى طاقته، وهذا غالباً ناتج عن خلل في حساسات الهواء (مثل MAF) أو انسداد في نظام العادم، مما يسبب استهلاك عالي جداً للوقود."
  },
  { 
    label: "حرارة سائل التبريد", 
    desc: "درجة حرارة سائل تبريد المحرك.", 
    value: "96.0", 
    unit: "°C", 
    status: "SUCCESS",
    icon: "thermometer",
    explanation: "حرارة المحرك الآن في النطاق الذهبي (90-105 درجة مئوية). هذا يعني أن الرديتر، المروحة، وبلف الحرارة يعملون بانسجام تام لمنع ارتفاع الحرارة."
  },
  { 
    label: "ضبط الوقود قصير المدى (بنك 1)", 
    desc: "تعديل الوقود الفوري للبنك 1.", 
    value: "1.56", 
    unit: "%", 
    status: "SUCCESS",
    icon: "zap",
    explanation: "هذا الحساس هو رد فعل السيارة اللحظي. نسبة 1.56% تعني أن الكمبيوتر يضيف كمية وقود ضئيلة جداً لموازنة الهواء، وهو مؤشر ممتاز على أن الاحتراق نظيف."
  },
  { 
    label: "ضبط الوقود طويل المدى (بنك 1)", 
    desc: "تعديل الوقود طويل المدى للبنك 1.", 
    value: "1.56", 
    unit: "%", 
    status: "SUCCESS",
    icon: "zap",
    explanation: "هذا يمثل 'ذاكرة' السيارة في استهلاك الوقود. الأرقام القريبة من الصفر تدل على أن المحرك لا يعاني من مشاكل مزمنة مثل تهريب الهواء أو ضعف البخاخات."
  },
  { 
    label: "سرعة المحرك (RPM)", 
    desc: "سرعة دوران عمود الكرنك.", 
    value: "714.0", 
    unit: "rpm", 
    status: "SUCCESS",
    icon: "activity",
    explanation: "دوران المحرك في حالة الوقوف (Idle) يجب أن يكون بين 600-800 دورة. رقم 714 يدل على استقرار تام للمحرك وعدم وجود تفتفة أو اهتزاز."
  },
  { 
    label: "سرعة السيارة", 
    desc: "سرعة السيارة الفعلية.", 
    value: "0.0", 
    unit: "km/h", 
    status: "SUCCESS",
    icon: "navigation",
    explanation: "الحساس يؤكد أن السيارة متوقفة تماماً. يتم ربط هذه القيمة مع حمل المحرك للتأكد من دقة البيانات الميكانيكية."
  },
  { 
    label: "معدل تدفق الهواء (MAF)", 
    desc: "كتلة الهواء الداخلة إلى المحرك بالجرام/ثانية.", 
    value: "2.09", 
    unit: "g/s", 
    status: "SUCCESS",
    icon: "wind",
    explanation: "حساس الماف هو رئة المحرك. القيمة 2.09 جرام/ثانية طبيعية جداً لسيارة متوقفة، وتؤكد أن بوابة الهواء (الثروتل) والفلتر نظيفان."
  },
  { 
    label: "جهد وحدة التحكم", 
    desc: "جهد دخل وحدة التحكم الرئيسية.", 
    value: "13.125", 
    unit: "V", 
    status: "SUCCESS",
    icon: "battery",
    explanation: "هذا الرقم يطمئنك على النظام الكهربائي. طالما أنه فوق 13 فولت والمحرك يعمل، فهذا يعني أن الدينامو (المولد) يشحن البطارية ويغذي كمبيوتر السيارة بكفاءة."
  }
];

const App = () => {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          {/* رأس الصفحة */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.headerButton}>
              <Icon name="chevron-right" size={22} color={COLORS.ink} />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>تقرير تنبّه الذكي</Text>
              <View style={styles.dateContainer}>
                <Icon name="calendar" size={10} color={COLORS.gray} />
                <Text style={styles.dateText}>25 مايو 2024</Text>
              </View>
            </View>
            <View style={styles.headerIcon}>
              <Icon name="activity" size={20} color={COLORS.red} />
            </View>
          </View>

          <View style={styles.content}>
            {/* البطاقة الرئيسية */}
            <View style={styles.mainCard}>
              <View style={styles.mainCardIcon}>
                <Icon name="cpu" size={32} color="#fff" />
              </View>
              <Text style={styles.mainCardTitle}>تحليل أداء المحرك</Text>
              <Text style={styles.mainCardSubtitle}>
                تم فحص 8 قراءات حيوية. {'\n'} اضغط على أي قراءة لمعرفة التفسير الميكانيكي.
              </Text>
            </View>

            {/* قسم الاستنتاج الذكي */}
            <View style={styles.insightCard}>
              <View style={styles.insightHeader}>
                <Icon name="zap" size={18} color="#fff" />
                <Text style={styles.insightLabel}>الاستنتاج الذكي</Text>
              </View>
              <Text style={styles.insightText}>
                تنبيه: محرك سيارتك يسجل "حملاً كاملاً" بنسبة 100% رغم أن السرعة 0. هذا تناقض واضح يشير لخلل في حساسات القراءات الهوائية.
              </Text>
            </View>

            {/* قائمة القراءات */}
            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>القراءات وقت الفحص</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>8 حساسات</Text>
              </View>
            </View>

            {SENSOR_DATA.map((item, idx) => {
              const isOpen = openIndex === idx;
              const statusColor = item.status === 'ERROR' ? COLORS.error : COLORS.success;
              const statusText = item.status === 'ERROR' ? 'غير مستقر' : 'طبيعي';

              return (
                <View key={idx} style={[styles.sensorItem, isOpen && styles.sensorItemOpen]}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.sensorButton}
                  >
                    <View style={styles.sensorLeft}>
                      <View style={[styles.iconBox, isOpen && styles.iconBoxOpen]}>
                      </View>
                      <View>
                        <Text style={styles.sensorLabel}>{item.label}</Text>
                        <View style={styles.statusRow}>
                          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                          <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
                        </View>
                      </View>
                    </View>
                    <View style={styles.sensorRight}>
                      <View style={styles.valueContainer}>
                        <Text style={[styles.value, item.status === 'ERROR' && styles.valueError]}>
                          {item.value}
                        </Text>
                        <Text style={styles.unit}>{item.unit}</Text>
                      </View>
                      <Icon name={isOpen ? "chevron-up" : "chevron-down"} size={16} color={COLORS.gray} />
                    </View>
                  </TouchableOpacity>

                  {isOpen && (
                    <View style={styles.explanationBox}>
                      <View style={styles.explanationHeader}>
                        <View style={styles.explanationIcon}>
                          <Icon name="info" size={10} color="#fff" />
                        </View>
                        <Text style={styles.explanationTitle}>التفسير الميكانيكي</Text>
                      </View>
                      <Text style={styles.explanationText}>{item.explanation}</Text>
                    </View>
                  )}
                </View>
              );
            })}

            {/* تذييل */}
            <View style={styles.footer}>
              <Icon name="shield-off" size={20} color="#E5E7EB" />
              <Text style={styles.footerText}>
                ملاحظة: هذا التقرير مقدم من "تنبّه" كدليل استرشادي ذكي. التشخيص النهائي يجب أن يتم بواسطة فني متخصص باستخدام أدوات احترافية.
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
  container: {
    flex: 1,
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
});

export default App;