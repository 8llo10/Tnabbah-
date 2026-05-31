import "dotenv/config";
import cron from "node-cron";
import WebSocket from "ws";
import { createClient } from "@supabase/supabase-js";
import http from "http";

globalThis.WebSocket = WebSocket;

const PORT = process.env.PORT || 3102;
const REMIND_AGAIN_AFTER_DAYS = 1;

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

function todayStart() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
}

async function sendExpoPush(token, title, body, data = {}) {
    const res = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            to: token,
            sound: "default",
            title,
            body,
            data,
        }),
    });

    const json = await res.json().catch(() => null);
    console.log("Expo push response:", json);
}

async function checkMaintenance() {
    console.log("Checking maintenance reminders...");

    const today = todayStart();

    const { data, error } = await supabase
        .from("maintenance_reminders")
        .select(`
      reminder_id,
      next_date,
      user_id,
      profiles (
        expo_push_token
      ),
      maintenance_types (
        name
      )
    `)
        .eq("is_active", true);

    if (error) {
        console.log("Supabase error:", error);
        return;
    }

    for (const item of data || []) {
        if (!item.next_date) continue;

        const nextDate = new Date(item.next_date);
        nextDate.setHours(0, 0, 0, 0);

        const diffDays = Math.ceil(
            (nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (diffDays > 7) continue;

        const maintenanceName =
            item.maintenance_types?.[0]?.name ||
            item.maintenance_types?.name ||
            "الصيانة";

        const title =
            diffDays < 0
                ? "صيانة متأخرة"
                : diffDays === 0
                    ? "صيانة مستحقة اليوم"
                    : "صيانة قريبة";

        const body =
            diffDays < 0
                ? `صيانة ${maintenanceName} متأخرة منذ ${Math.abs(diffDays)} يوم. يفضّل تنفيذها قريبًا.`
                : diffDays === 0
                    ? `صيانة ${maintenanceName} مستحقة اليوم. افحصها قبل القيادة.`
                    : `اقترب موعد صيانة ${maintenanceName}. باقي ${diffDays} يوم.`;

        const repeatAfter = new Date(today);
        repeatAfter.setDate(repeatAfter.getDate() - REMIND_AGAIN_AFTER_DAYS);

        const { data: existing, error: existingError } = await supabase
            .from("notifications")
            .select("id, is_read, created_at")
            .eq("user_id", item.user_id)
            .eq("reminder_id", item.reminder_id)
            .eq("type", "maintenance")
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        if (existingError) {
            console.log("Existing notification error:", existingError);
            continue;
        }

        if (existing && existing.is_read === false) {
            const lastSent = new Date(existing.created_at);

            if (lastSent.getTime() > repeatAfter.getTime()) {
                console.log("Skip unread reminder, less than 1 day:", item.reminder_id);
                continue;
            }

            const { error: updateError } = await supabase
                .from("notifications")
                .update({
                    title,
                    body,
                    is_read: false,
                    delivered_locally: false,
                    created_at: new Date().toISOString(),
                    sent_at: new Date().toISOString(),
                })
                .eq("id", existing.id);

            if (updateError) {
                console.log("Update notification error:", updateError);
                continue;
            }

            console.log("Updated existing unread notification:", body);
        } else if (existing && existing.is_read === true) {
            console.log("Already read, no repeat:", item.reminder_id);
            continue;
        } else {
            const { error: insertError } = await supabase.from("notifications").insert({
                user_id: item.user_id,
                reminder_id: item.reminder_id,
                title,
                body,
                type: "maintenance",
                is_read: false,
                delivered_locally: false,
            });

            if (insertError) {
                console.log("Insert notification error:", insertError);
                continue;
            }

            console.log("Inserted notification:", body);
        }

        const token =
            item.profiles?.[0]?.expo_push_token ||
            item.profiles?.expo_push_token;

        if (token) {
            await sendExpoPush(token, title, body, {
                type: "maintenance",
                reminder_id: item.reminder_id,
            });
        } else {
            console.log("No expo_push_token for user:", item.user_id);
        }
    }
}

cron.schedule("* * * * *", checkMaintenance);

const server = http.createServer(async (req, res) => {
    if (req.method === "POST" && req.url === "/check-now") {
        try {
            await checkMaintenance();

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ ok: true }));
        } catch (error) {
            console.log("check-now error:", error);

            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ ok: false, error: String(error) }));
        }

        return;
    }

    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: false, error: "Not found" }));
});

server.listen(PORT, () => {
    console.log(`Notifications worker HTTP running on ${PORT}`);
});

checkMaintenance();

console.log("Notifications worker running...");