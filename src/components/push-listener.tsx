"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type InAppPush = { title: string; body: string; url: string };

/** Short two-tone "ding" with Web Audio (no audio file needed). Silently ignored if blocked. */
function ding() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    [880, 1320].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const t = ctx.currentTime + i * 0.18;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.4);
    });
    setTimeout(() => ctx.close(), 1000);
  } catch {
    /* audio not allowed yet — the system notification still shows */
  }
}

/**
 * Mounted on every page: clears the app-icon badge when the app is opened and, while the
 * app is in the foreground, turns incoming pushes into a sound + in-app banner.
 */
export function PushListener({ openLabel, closeLabel }: { openLabel: string; closeLabel: string }) {
  const [msg, setMsg] = useState<InAppPush | null>(null);

  useEffect(() => {
    const nav = navigator as Navigator & { clearAppBadge?: () => Promise<void> };
    nav.clearAppBadge?.().catch(() => {});
    if (!("serviceWorker" in navigator)) return;

    let timer: ReturnType<typeof setTimeout> | undefined;
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type !== "push") return;
      ding();
      setMsg({ title: event.data.title, body: event.data.body, url: event.data.url });
      nav.clearAppBadge?.().catch(() => {});
      clearTimeout(timer);
      timer = setTimeout(() => setMsg(null), 10_000);
    };
    navigator.serviceWorker.addEventListener("message", onMessage);
    return () => {
      navigator.serviceWorker.removeEventListener("message", onMessage);
      clearTimeout(timer);
    };
  }, []);

  if (!msg) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 top-3 z-50 mx-auto w-[min(28rem,calc(100vw-2rem))] rounded-2xl border border-indigo-200 bg-background p-4 shadow-lg dark:border-indigo-500/40"
    >
      <p className="font-semibold">{msg.title}</p>
      {msg.body && <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-400">{msg.body}</p>}
      <div className="mt-3 flex justify-end gap-2 text-sm">
        <button type="button" className="rounded-lg px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/10" onClick={() => setMsg(null)}>
          {closeLabel}
        </button>
        <Link
          href={msg.url}
          onClick={() => setMsg(null)}
          className="rounded-lg bg-indigo-600 px-3 py-1.5 font-semibold text-white hover:bg-indigo-500"
        >
          {openLabel}
        </Link>
      </div>
    </div>
  );
}
