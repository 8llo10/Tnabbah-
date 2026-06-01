import React from "react";
import {
    ActivityIndicator,
    Modal,
    Pressable,
    Text,
    TextInput,
    View,
} from "react-native";
import { Feather } from "@expo/vector-icons";

const COLORS = {
    primary: "#871B17",
    danger: "#871B17",
};

export function EditNameModal({
    visible,
    value,
    onChangeText,
    onCancel,
    onSave,
    saving,
    theme,
    isRTL,
    t,
    styles,
}: any) {
    const textAlign = isRTL ? "right" : "left";
    const rowDirection = isRTL ? "row-reverse" : "row";

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
            <View style={[styles.modalOverlay, { backgroundColor: theme.modalOverlay }]}>
                <View style={[styles.confirmModal, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}>
                    <Text style={[styles.confirmTitle, { color: theme.textPrimary }]}>
                        {isRTL ? "تعديل الاسم" : "Edit Name"}
                    </Text>

                    <TextInput
                        value={value}
                        onChangeText={onChangeText}
                        placeholder={isRTL ? "اكتبي الاسم" : "Enter name"}
                        placeholderTextColor={theme.textSecondary}
                        style={[
                            styles.nameInput,
                            {
                                color: theme.textPrimary,
                                borderColor: theme.cardBorder,
                                backgroundColor: theme.subtle,
                                textAlign,
                            },
                        ]}
                    />

                    <View style={[styles.confirmButtons, { flexDirection: rowDirection }]}>
                        <Pressable
                            style={[styles.confirmSecondaryButton, { backgroundColor: theme.iconBg, borderColor: theme.cardBorder }]}
                            onPress={onCancel}
                            disabled={saving}
                        >
                            <Text style={[styles.confirmSecondaryText, { color: theme.textPrimary }]}>
                                {t.cancel}
                            </Text>
                        </Pressable>

                        <Pressable
                            style={[styles.confirmPrimaryButton, { backgroundColor: COLORS.primary }, saving && { opacity: 0.7 }]}
                            onPress={onSave}
                            disabled={saving}
                        >
                            {saving ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <Text style={styles.confirmPrimaryText}>{t.confirm}</Text>
                            )}
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

export function EditEmailModal({
    visible,
    value,
    onChangeText,
    onCancel,
    onSave,
    saving,
    theme,
    isRTL,
    t,
    styles,
}: any) {
    const textAlign = isRTL ? "right" : "left";
    const rowDirection = isRTL ? "row-reverse" : "row";

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
            <View style={[styles.modalOverlay, { backgroundColor: theme.modalOverlay }]}>
                <View style={[styles.confirmModal, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}>
                    <Text style={[styles.confirmTitle, { color: theme.textPrimary }]}>
                        {isRTL ? "تعديل الإيميل" : "Edit Email"}
                    </Text>

                    <TextInput
                        value={value}
                        onChangeText={onChangeText}
                        placeholder={isRTL ? "اكتبي الإيميل الجديد" : "Enter new email"}
                        placeholderTextColor={theme.textSecondary}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        style={[
                            styles.nameInput,
                            {
                                color: theme.textPrimary,
                                borderColor: theme.cardBorder,
                                backgroundColor: theme.subtle,
                                textAlign,
                            },
                        ]}
                    />

                    <View style={[styles.confirmButtons, { flexDirection: rowDirection }]}>
                        <Pressable
                            style={[styles.confirmSecondaryButton, { backgroundColor: theme.iconBg, borderColor: theme.cardBorder }]}
                            onPress={onCancel}
                            disabled={saving}
                        >
                            <Text style={[styles.confirmSecondaryText, { color: theme.textPrimary }]}>
                                {t.cancel}
                            </Text>
                        </Pressable>

                        <Pressable
                            style={[styles.confirmPrimaryButton, { backgroundColor: COLORS.primary }, saving && { opacity: 0.7 }]}
                            onPress={onSave}
                            disabled={saving}
                        >
                            {saving ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <Text style={styles.confirmPrimaryText}>{t.confirm}</Text>
                            )}
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

export function DeleteAccountModal({
    visible,
    password,
    onChangePassword,
    onCancel,
    onConfirm,
    loading,
    theme,
    isRTL,
    styles,
}: any) {
    const textAlign = isRTL ? "right" : "left";
    const rowDirection = isRTL ? "row-reverse" : "row";

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
            <View style={[styles.modalOverlay, { backgroundColor: theme.modalOverlay }]}>
                <View style={[styles.confirmModal, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}>
                    <View style={[styles.confirmIconCircle, { backgroundColor: "rgba(135,27,23,0.12)" }]}>
                        <Feather name="trash-2" size={28} color={COLORS.danger} />
                    </View>

                    <Text style={[styles.confirmTitle, { color: theme.textPrimary }]}>
                        {isRTL ? "حذف الحساب" : "Delete Account"}
                    </Text>

                    <Text style={[styles.confirmMessage, { color: theme.textSecondary, textAlign }]}>
                        {isRTL
                            ? "هذا الإجراء نهائي. اكتبي كلمة المرور الحالية للمتابعة."
                            : "This action is permanent. Enter your current password to continue."}
                    </Text>

                    <TextInput
                        value={password}
                        onChangeText={onChangePassword}
                        secureTextEntry
                        placeholder={isRTL ? "كلمة المرور الحالية" : "Current password"}
                        placeholderTextColor={theme.textSecondary}
                        style={[
                            styles.nameInput,
                            {
                                color: theme.textPrimary,
                                borderColor: theme.cardBorder,
                                backgroundColor: theme.subtle,
                                textAlign,
                            },
                        ]}
                    />

                    <View style={[styles.confirmButtons, { flexDirection: rowDirection }]}>
                        <Pressable
                            style={[styles.confirmSecondaryButton, { backgroundColor: theme.iconBg, borderColor: theme.cardBorder }]}
                            onPress={onCancel}
                            disabled={loading}
                        >
                            <Text style={[styles.confirmSecondaryText, { color: theme.textPrimary }]}>
                                {isRTL ? "إلغاء" : "Cancel"}
                            </Text>
                        </Pressable>

                        <Pressable
                            style={[styles.confirmPrimaryButton, { backgroundColor: COLORS.danger }, loading && { opacity: 0.7 }]}
                            onPress={onConfirm}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <Text style={styles.confirmPrimaryText}>
                                    {isRTL ? "متابعة" : "Continue"}
                                </Text>
                            )}
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

export function LogoutLoadingModal({
    visible,
    text,
    theme,
    styles,
}: any) {
    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={[styles.modalOverlay, { backgroundColor: theme.modalOverlay }]}>
                <View style={[styles.logoutLoadingModal, { backgroundColor: theme.surface }]}>
                    <ActivityIndicator size="small" color="#871B17" />
                    <Text style={[styles.logoutLoadingText, { color: theme.textPrimary }]}>
                        {text}
                    </Text>
                </View>
            </View>
        </Modal>
    );
}