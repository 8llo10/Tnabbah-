import React from "react";
import {
    Modal,
    View,
    Text,
    ScrollView,
    Pressable,
} from "react-native";

import { Feather } from "@expo/vector-icons";

const COLORS = {
    primary: "#871B17",
};

export function HelpModal({
    visible,
    onClose,
    t,
    theme,
    isRTL,
    onEmail,
    onWhatsApp,
    onIssue,
    styles,
}: {
    visible: boolean;
    onClose: () => void;
    t: any;
    theme: any;
    isRTL: boolean;
    onEmail: () => void;
    onWhatsApp: () => void;
    onIssue: () => void;
    styles: any;
}) {
    const textAlign = isRTL ? "right" : "left";
    const rowDirection = isRTL ? "row-reverse" : "row";

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View
                style={[
                    styles.modalOverlay,
                    { backgroundColor: theme.modalOverlay },
                ]}
            >
                <View
                    style={[
                        styles.helpModal,
                        {
                            backgroundColor: theme.surface,
                            borderColor: theme.cardBorder,
                        },
                    ]}
                >
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 10 }}
                    >
                        <View
                            style={{
                                flexDirection: rowDirection,
                                alignItems: "center",
                                marginBottom: 18,
                            }}
                        >
                            <View
                                style={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: 16,
                                    backgroundColor: theme.iconBg,
                                    alignItems: "center",
                                    justifyContent: "center",
                                    marginRight: isRTL ? 0 : 12,
                                    marginLeft: isRTL ? 12 : 0,
                                }}
                            >
                                <Feather
                                    name="help-circle"
                                    size={24}
                                    color={theme.iconColor}
                                />
                            </View>

                            <View style={{ flex: 1 }}>
                                <Text
                                    style={[
                                        styles.helpTitle,
                                        {
                                            color: theme.textPrimary,
                                            textAlign,
                                        },
                                    ]}
                                >
                                    {isRTL ? "المساعدة والدعم" : "Help & Support"}
                                </Text>

                                <Text
                                    style={{
                                        color: theme.textSecondary,
                                        fontSize: 13,
                                        marginTop: 2,
                                        textAlign,
                                    }}
                                >
                                    {isRTL
                                        ? "نحن هنا لمساعدتك 🤍"
                                        : "We're here to help 🤍"}
                                </Text>
                            </View>
                        </View>

                        <View
                            style={[
                                styles.helpCard,
                                {
                                    backgroundColor: theme.subtle,
                                    borderColor: theme.cardBorder,
                                },
                            ]}
                        >
                            <Text
                                style={[
                                    styles.helpQuestion,
                                    {
                                        color: theme.textPrimary,
                                        textAlign,
                                    },
                                ]}
                            >
                                {isRTL
                                    ? "كيف أوصل قطعة السيارة؟"
                                    : "How do I connect the OBD device?"}
                            </Text>

                            <Text
                                style={[
                                    styles.helpAnswer,
                                    {
                                        color: theme.textSecondary,
                                        textAlign,
                                    },
                                ]}
                            >
                                {isRTL
                                    ? "من صفحة الاتصال اختاري البلوتوث ثم اختاري قطعة السيارة وابدئي الفحص."
                                    : "Go to the connection page, enable Bluetooth, select your device, and start scanning."}
                            </Text>
                        </View>

                        <View
                            style={[
                                styles.helpCard,
                                {
                                    backgroundColor: theme.subtle,
                                    borderColor: theme.cardBorder,
                                },
                            ]}
                        >
                            <Text
                                style={[
                                    styles.helpQuestion,
                                    {
                                        color: theme.textPrimary,
                                        textAlign,
                                    },
                                ]}
                            >
                                {isRTL
                                    ? "لماذا لا تظهر السيارة؟"
                                    : "Why can't I see my car?"}
                            </Text>

                            <Text
                                style={[
                                    styles.helpAnswer,
                                    {
                                        color: theme.textSecondary,
                                        textAlign,
                                    },
                                ]}
                            >
                                {isRTL
                                    ? "تأكدي أن القطعة تعمل وأن البلوتوث والصلاحيات مفعلة."
                                    : "Make sure the device is powered on and Bluetooth permissions are enabled."}
                            </Text>
                        </View>

                        <View
                            style={[
                                styles.helpCard,
                                {
                                    backgroundColor: theme.subtle,
                                    borderColor: theme.cardBorder,
                                },
                            ]}
                        >
                            <Text
                                style={[
                                    styles.helpQuestion,
                                    {
                                        color: theme.textPrimary,
                                        textAlign,
                                    },
                                ]}
                            >
                                {isRTL
                                    ? "هل التطبيق يحفظ بيانات السيارة؟"
                                    : "Does the app save vehicle data?"}
                            </Text>

                            <Text
                                style={[
                                    styles.helpAnswer,
                                    {
                                        color: theme.textSecondary,
                                        textAlign,
                                    },
                                ]}
                            >
                                {isRTL
                                    ? "يتم حفظ البيانات الضرورية فقط لتحسين تجربتك وعرض التقارير."
                                    : "Only necessary data is stored to improve your experience and reports."}
                            </Text>
                        </View>

                        <View style={{ marginTop: 8 }}>
                            <Pressable
                                onPress={onWhatsApp}
                                style={[
                                    styles.supportButton,
                                    {
                                        backgroundColor: "#25D366",
                                    },
                                ]}
                            >
                                <Feather name="message-circle" size={18} color="#FFF" />

                                <Text style={styles.supportButtonText}>
                                    {isRTL
                                        ? "التواصل عبر واتساب"
                                        : "Contact via WhatsApp"}
                                </Text>
                            </Pressable>

                            <Pressable
                                onPress={onEmail}
                                style={[
                                    styles.supportButton,
                                    {
                                        backgroundColor: COLORS.primary,
                                    },
                                ]}
                            >
                                <Feather name="mail" size={18} color="#FFF" />

                                <Text style={styles.supportButtonText}>
                                    {isRTL
                                        ? "إرسال بريد للدعم"
                                        : "Send Support Email"}
                                </Text>
                            </Pressable>

                            <Pressable
                                onPress={onIssue}
                                style={[
                                    styles.supportButton,
                                    {
                                        backgroundColor: theme.iconBg,
                                    },
                                ]}
                            >
                                <Feather
                                    name="alert-triangle"
                                    size={18}
                                    color={theme.textPrimary}
                                />

                                <Text
                                    style={[
                                        styles.supportIssueText,
                                        {
                                            color: theme.textPrimary,
                                        },
                                    ]}
                                >
                                    {isRTL
                                        ? "الإبلاغ عن مشكلة"
                                        : "Report an Issue"}
                                </Text>
                            </Pressable>
                        </View>

                        <Pressable
                            onPress={onClose}
                            style={[
                                styles.closeHelpButton,
                                {
                                    backgroundColor: theme.subtle,
                                    borderColor: theme.cardBorder,
                                },
                            ]}
                        >
                            <Text
                                style={{
                                    color: theme.textPrimary,
                                    fontWeight: "700",
                                    fontSize: 14,
                                }}
                            >
                                {t.done}
                            </Text>
                        </Pressable>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}