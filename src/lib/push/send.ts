import "server-only";
import { eq, inArray } from "drizzle-orm";
import webpush, { WebPushError } from "web-push";
import { db } from "@/db";
import { pushSubscriptions } from "@/db/schema";

/** `sticky`: keep the notification on screen until dismissed (desktop browsers). */
export type PushPayload = { title: string; body: string; url: string; tag?: string; sticky?: boolean };

let configured = false;
function configure(): boolean {
  if (configured) return true;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!pub || !priv || !subject) {
    console.error("[push] VAPID env vars missing");
    return false;
  }
  webpush.setVapidDetails(subject, pub, priv);
  configured = true;
  return true;
}

/**
 * Send a payload to every device the user subscribed. Expired subscriptions
 * (404/410 from the push service) are deleted. Returns how many devices accepted it.
 */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<{ sent: number; failed: number }> {
  if (!configure()) return { sent: 0, failed: 0 };
  const subs = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));

  const gone: string[] = [];
  let sent = 0;
  let failed = 0;
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify(payload),
          { TTL: 60 * 60, urgency: "high" },
        );
        sent++;
      } catch (e) {
        failed++;
        if (e instanceof WebPushError && (e.statusCode === 404 || e.statusCode === 410)) gone.push(s.id);
        else console.error("[push] send failed", e instanceof WebPushError ? e.statusCode : e);
      }
    }),
  );
  if (gone.length) await db.delete(pushSubscriptions).where(inArray(pushSubscriptions.id, gone));
  return { sent, failed };
}
