"use client";

import { useEffect, useState, useTransition } from "react";
import { btnGhost, btnPrimary } from "@/components/ui";
import type { Dictionary } from "@/i18n/get-dictionary";
import { removePushSubscription, savePushSubscription, sendTestPush } from "@/lib/push/actions";

type Status = "loading" | "unsupported" | "denied" | "off" | "on";

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

async function registration() {
  return navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
}

/** Subscribe / unsubscribe this browser to Web Push, and send a test notification. */
export function PushDevice({ lang, t }: { lang: string; t: Dictionary["settings"] }) {
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState<string | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    // Feature detection must run in the browser; this effect syncs with that external state.
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    let cancelled = false;
    (async () => {
      let next: Status = "off";
      if (!supported) next = "unsupported";
      else if (Notification.permission === "denied") next = "denied";
      else {
        const reg = await registration();
        next = (await reg.pushManager.getSubscription()) ? "on" : "off";
      }
      if (!cancelled) {
        setIsIOS(ios);
        setStatus(next);
      }
    })().catch(() => !cancelled && setStatus("unsupported"));
    return () => {
      cancelled = true;
    };
  }, []);

  function enable() {
    setMessage(null);
    startTransition(async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          setStatus(permission === "denied" ? "denied" : "off");
          return;
        }
        const reg = await registration();
        await navigator.serviceWorker.ready;
        const sub =
          (await reg.pushManager.getSubscription()) ??
          (await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
          }));
        const res = await savePushSubscription(sub.toJSON());
        setStatus(res.ok ? "on" : "off");
        if (!res.ok) setMessage(t.testFailed);
      } catch (e) {
        console.error("[push] enable failed", e);
        setMessage(t.testFailed);
      }
    });
  }

  function disable() {
    setMessage(null);
    startTransition(async () => {
      const reg = await navigator.serviceWorker.getRegistration("/");
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await removePushSubscription(sub.endpoint);
        await sub.unsubscribe();
      }
      setStatus("off");
    });
  }

  function test() {
    setMessage(null);
    startTransition(async () => {
      const res = await sendTestPush(lang);
      setMessage(res.ok ? t.testSent : res.error === "noDevice" ? t.noDevice : t.testFailed);
    });
  }

  return (
    <div className="rounded-xl border border-black/5 p-4 dark:border-white/10">
      <p className="text-sm font-medium">📱 {t.device}</p>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        {status === "on"
          ? t.deviceOn
          : status === "denied"
            ? t.denied
            : status === "unsupported"
              ? t.unsupported
              : status === "off"
                ? t.deviceOff
                : t.working}
      </p>
      {isIOS && status !== "on" && <p className="mt-2 text-xs text-zinc-500">{t.iosHint}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        {status === "off" && (
          <button type="button" className={btnPrimary} onClick={enable} disabled={pending}>
            🔔 {pending ? t.working : t.enable}
          </button>
        )}
        {status === "on" && (
          <>
            <button type="button" className={btnPrimary} onClick={test} disabled={pending}>
              {pending ? t.working : t.test}
            </button>
            <button type="button" className={btnGhost} onClick={disable} disabled={pending}>
              {t.disable}
            </button>
          </>
        )}
      </div>
      {message && <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">{message}</p>}
    </div>
  );
}
