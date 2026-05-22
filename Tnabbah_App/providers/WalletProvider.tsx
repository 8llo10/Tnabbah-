import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthProvider";

// تم التعليق مؤقتًا لأن Push Notifications على iPhone الحقيقي تحتاج Apple Developer مدفوع.
// التنبيهات داخل التطبيق والمحفظة والصيانة ما زالت شغالة بدون هذا الاستيراد.
// import * as Notifications from "expo-notifications";

type ReportStatus = "pending" | "saved" | "temp_rejected" | "deleted";

export interface ReportItem {
    id: string;
    title: string;
    date: string;
    type: "PDF" | "DTC";
    status: ReportStatus;
    createdAt: string;
}

export interface MaintenanceItem {
    reminderId: number | null;
    maintenanceTypeId: number;
    title: string;
    lastDate: string;
    nextDate: string;
    intervalDays: number;
    remainingDays: number | null;
    status: "upcoming" | "due" | "overdue";
}

type WalletContextValue = {
    reports: ReportItem[];
    setReports: React.Dispatch<React.SetStateAction<ReportItem[]>>;
    reportsLoading: boolean;
    maintenance: MaintenanceItem[];
    setMaintenance: React.Dispatch<React.SetStateAction<MaintenanceItem[]>>;
    maintenanceLoading: boolean;
    fetchReports: () => Promise<void>;
    fetchMaintenance: () => Promise<void>;
    refreshWallet: () => Promise<void>;
};

const calcRemainingDays = (nextDate: string): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const next = new Date(nextDate);
    next.setHours(0, 0, 0, 0);

    return Math.ceil((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

const getMaintenanceStatus = (
    remainingDays: number | null
): "upcoming" | "due" | "overdue" => {
    if (remainingDays === null) return "upcoming";
    if (remainingDays < 0) return "overdue";
    if (remainingDays <= 7) return "due";
    return "upcoming";
};

// تم التعطيل مؤقتًا:
// هذه الدالة كانت ترسل Push Notifications خارج التطبيق باستخدام expo-notifications.
// حساب Apple المجاني لا يدعم Push Notifications على iPhone الحقيقي.
// خليتها no-op عشان ما نكسر أي استدعاء لها مستقبلًا.
const scheduleMaintenanceNotification = async (
    title: string,
    nextDate: string,
    maintenanceTypeId: number
) => {
    console.log(
        "Push notification disabled temporarily:",
        title,
        nextDate,
        maintenanceTypeId
    );

    return null;

    /*
    const notificationId = `maintenance-${maintenanceTypeId}`;

    try {
        await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch { }

    const targetDate = new Date(nextDate);
    const now = new Date();

    const notifyDate = new Date(targetDate);
    notifyDate.setDate(notifyDate.getDate() - 7);
    notifyDate.setHours(9, 0, 0, 0);

    // متأخر
    if (targetDate.getTime() < now.getTime()) {
        return await Notifications.scheduleNotificationAsync({
            content: {
                title: "صيانة متأخرة",
                body: `موعد صيانة ${title} متأخر`,
                sound: true,
            },
            trigger: null,
        });
    }

    // قريب
    if (notifyDate.getTime() <= now.getTime()) {
        return await Notifications.scheduleNotificationAsync({
            content: {
                title: "تذكير صيانة قريب",
                body: `اقترب موعد صيانة ${title}`,
                sound: true,
            },
            trigger: null,
        });
    }

    // جدولة مستقبلية
    return await Notifications.scheduleNotificationAsync({
        content: {
            title: "تذكير صيانة",
            body: `اقترب موعد صيانة ${title}`,
            sound: true,
        },
        trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: notifyDate,
        },
    });
    */
};

const mapRowToReport = (row: any): ReportItem => {
    const content = row?.content || {};
    const hasDtc =
        Array.isArray(content.detected_dtcs) && content.detected_dtcs.length > 0;

    const ts = content.timestamp || row.created_at;

    let dateLabel = "";
    try {
        dateLabel = new Date(ts).toLocaleDateString("ar-SA", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    } catch {
        dateLabel = String(ts || "");
    }

    return {
        id: row.id,
        title: hasDtc ? "تقرير أعطال DTC" : "تقرير فحص شامل",
        date: dateLabel,
        type: hasDtc ? "DTC" : "PDF",
        status: (row.status || "pending") as ReportStatus,
        createdAt: row.created_at,
    };
};

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
    const { session } = useAuth();
    const userId = session?.user?.id;

    const [reports, setReports] = useState<ReportItem[]>([]);
    const [maintenance, setMaintenance] = useState<MaintenanceItem[]>([]);

    const [reportsLoading, setReportsLoading] = useState(true);
    const [maintenanceLoading, setMaintenanceLoading] = useState(true);
    const [maintenanceTypes, setMaintenanceTypes] = useState<any[]>([]);

    const fetchReports = useCallback(async () => {
        if (!userId) {
            setReports([]);
            setReportsLoading(false);
            return;
        }

        setReportsLoading(true);

        try {
            const { data, error } = await supabase
                .from("reports")
                .select("id, content, status, created_at, is_permanently_saved")
                .eq("user_id", userId)
                .in("status", ["pending", "saved"])
                .order("created_at", { ascending: false });

            if (error) throw error;

            setReports((data || []).map(mapRowToReport));
        } catch (error) {
            console.log("WalletProvider fetchReports error:", error);
        } finally {
            setReportsLoading(false);
        }
    }, [userId]);

    const fetchMaintenance = useCallback(async () => {
        if (!userId) {
            setMaintenance([]);
            setMaintenanceLoading(false);
            return;
        }

        setMaintenanceLoading(true);

        try {
            const { data: typesData, error: typesError } = await supabase
                .from("maintenance_types")
                .select("id, key, name, interval_days, icon")
                .order("id");

            if (typesError) throw typesError;

            setMaintenanceTypes(typesData || []);

            const { data, error } = await supabase
                .from("maintenance_reminders")
                .select("reminder_id, maintenance_type_id, last_date, next_date")
                .eq("user_id", userId)
                .eq("is_active", true);

            if (error) throw error;

            const remindersMap = new Map(
                (data || []).map((r: any) => [r.maintenance_type_id, r])
            );

            const items = (typesData || []).map((type: any) => {
                const reminder: any = remindersMap.get(type.id);
                const nextDate = reminder?.next_date ?? "";
                const remainingDays = nextDate ? calcRemainingDays(nextDate) : null;

                return {
                    maintenanceTypeId: type.id,
                    title: type.name,
                    intervalDays: type.interval_days ?? 90,

                    reminderId: reminder?.reminder_id ?? null,
                    lastDate: reminder?.last_date ?? "",
                    nextDate,

                    remainingDays,
                    status: getMaintenanceStatus(remainingDays),
                };
            });

            setMaintenance(items);
        } catch (error) {
            console.log("WalletProvider fetchMaintenance error:", error);
            setMaintenance([]);
        } finally {
            setMaintenanceLoading(false);
        }
    }, [userId]);

    const refreshWallet = useCallback(async () => {
        await Promise.all([fetchReports(), fetchMaintenance()]);
    }, [fetchReports, fetchMaintenance]);

    useEffect(() => {
        refreshWallet();
    }, [refreshWallet]);

    useEffect(() => {
        if (!userId) return;

        const channel = supabase
            .channel(`wallet-reports-${userId}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "reports",
                    filter: `user_id=eq.${userId}`,
                },
                () => {
                    fetchReports();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId, fetchReports]);

    const value = useMemo(
        () => ({
            reports,
            setReports,
            reportsLoading,
            maintenance,
            setMaintenance,
            maintenanceLoading,
            fetchReports,
            fetchMaintenance,
            refreshWallet,
        }),
        [
            reports,
            reportsLoading,
            maintenance,
            maintenanceLoading,
            fetchReports,
            fetchMaintenance,
            refreshWallet,
        ]
    );

    return (
        <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
    );
}

export const useWallet = () => {
    const context = useContext(WalletContext);

    if (!context) {
        throw new Error("useWallet must be used inside WalletProvider");
    }

    return context;
};