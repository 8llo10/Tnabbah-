import React from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";

const COLORS = {
    primary: "#871B17",
};

export function ConfirmModal({
    visible,
    title,
    message,
    confirmText,
    cancelText,
    icon,
    theme,
    isRTL,
    danger = false,
    onCancel,
    onConfirm,
    styles,
}: any) {
    const textAlign = isRTL ? "right" : "left";
    const rowDirection = isRTL ? "row-reverse" : "row";

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
            <View style={[styles.modalOverlay, { backgroundColor: theme.modalOverlay }]}>
                <View style={[styles.confirmModal, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}>
                    <View style={[styles.confirmIconCircle, { backgroundColor: theme.iconBg }]}>
                        <Feather name={icon} size={28} color={theme.iconColor} />
                    </View>

                    <Text style={[styles.confirmTitle, { color: theme.textPrimary }]}>
                        {title}
                    </Text>

                    <Text style={[styles.confirmMessage, { color: theme.textSecondary, textAlign }]}>
                        {message}
                    </Text>

                    <View style={[styles.confirmButtons, { flexDirection: rowDirection }]}>
                        <Pressable
                            style={[
                                styles.confirmSecondaryButton,
                                { backgroundColor: theme.iconBg, borderColor: theme.cardBorder },
                            ]}
                            onPress={onCancel}
                        >
                            <Text style={[styles.confirmSecondaryText, { color: theme.textPrimary }]}>
                                {cancelText}
                            </Text>
                        </Pressable>

                        <Pressable
                            style={[styles.confirmPrimaryButton, { backgroundColor: COLORS.primary }]}
                            onPress={onConfirm}
                        >
                            <Text style={styles.confirmPrimaryText}>{confirmText}</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

export function MessageModal({
    visible,
    title,
    message,
    icon,
    buttonText,
    theme,
    isRTL,
    onClose,
    styles,
}: any) {
    const textAlign = isRTL ? "right" : "left";

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={[styles.modalOverlay, { backgroundColor: theme.modalOverlay }]}>
                <View style={[styles.confirmModal, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}>
                    <View style={[styles.confirmIconCircle, { backgroundColor: theme.iconBg }]}>
                        <Feather name={icon} size={28} color={theme.iconColor} />
                    </View>

                    <Text style={[styles.confirmTitle, { color: theme.textPrimary }]}>
                        {title}
                    </Text>

                    <Text style={[styles.confirmMessage, { color: theme.textSecondary, textAlign }]}>
                        {message}
                    </Text>

                    <Pressable
                        style={[styles.singleModalButton, { backgroundColor: COLORS.primary }]}
                        onPress={onClose}
                    >
                        <Text style={styles.confirmPrimaryText}>{buttonText}</Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
}