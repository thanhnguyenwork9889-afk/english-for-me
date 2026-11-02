"use server";

import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { z } from "zod";
import { db } from "@/db";
import { pushSubscriptions, userSettings } from "@/db/schema";
import { defaultLocale, hasLocale } from "@/i18n/config";
import { requireUserIdForAction } from "@/lib/auth";
import { sendPushToUser } from "./send";

const subscriptionSchema = z.object({
  endpoint: z.url({ protocol: /^https$/ }).max(1000),
  keys: z.object({ p256dh: z.string().min(1).max(200), auth: z.string().min(1).max(100) }),
});

export type PushResult = { ok: true } | { ok: false; error: "invalid" | "server" | "noDevice" };

/** Store (or move to this user) the browser's push subscription. */
export async function savePushSubscription(sub: unknown): Promise<PushResult> {
  const userId = await requireUserIdForAction();
  const parsed = subscriptionSchema.safeParse(sub);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const { endpoint, keys } = parsed.data;
  const userAgent = ((await headers()).get("user-agent") ?? "").slice(0, 300);

  try {
    await db
      .insert(pushSubscriptions)
      .values({ userId, endpoint, p256dh: keys.p256dh, auth: keys.auth, userAgent })
      .onConflictDoUpdate({
        target: pushSubscriptions.endpoint,
        set: { userId, p256dh: keys.p256dh, auth: keys.auth, userAgent },
      });
    await db.update(userSettings).set({ pushEnabled: true }).where(eq(userSettings.userId, userId));
  } catch (e) {
    console.error("[savePushSubscription]", e);
    return { ok: false, error: "server" };
  }
  return { ok: true };
}

export async function removePushSubscription(endpoint: string): Promise<PushResult> {
  const userId = await requireUserIdForAction();
  if (typeof endpoint !== "string" || endpoint.length > 1000) return { ok: false, error: "invalid" };
  await db
    .delete(pushSubscriptions)
    .where(and(eq(pushSubscriptions.userId, userId), eq(pushSubscriptions.endpoint, endpoint)));
  return { ok: true };
}

export async function sendTestPush(lang: string): Promise<PushResult> {
  const userId = await requireUserIdForAction();
  const l = hasLocale(lang) ? lang : defaultLocale;
  const res = await sendPushToUser(userId, {
    title: l === "vi" ? "🔔 Thông báo thử" : "🔔 Test notification",
    body: l === "vi" ? "Tuyệt! Bạn sẽ nhận nhắc nhở trước giờ học." : "Great! You'll get reminders before study time.",
    url: `/${l}/schedule`,
    tag: "test",
  });
  if (res.sent > 0) return { ok: true };
  return { ok: false, error: res.failed > 0 ? "server" : "noDevice" };
}
