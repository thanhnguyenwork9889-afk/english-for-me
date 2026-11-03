"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ProgressMeter } from "@/components/progress/progress-meter";
import { btnGhost, btnPrimary } from "@/components/ui";
import { format } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { canListen, createRecognizer, stopSpeaking, transcriptOf, type Recognizer } from "@/lib/speech/browser";
import { compareSpeech, type SpeechScore } from "@/lib/speech/compare";
import { SpeakButton } from "./speak-button";
import { useSupport } from "./use-support";

/**
 * Say-it-back practice: hear the phrase, say it, see which words came through.
 * Recognition runs in the browser, so nothing is uploaded by us and it costs nothing.
 */
export function SpeakingPractice({
  phrases,
  t,
  onClose,
  closeLabel,
}: {
  phrases: string[];
  t: Dictionary["speaking"];
  onClose?: () => void;
  closeLabel: string;
}) {
  const [index, setIndex] = useState(0);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [result, setResult] = useState<SpeechScore | null>(null);
  const [error, setError] = useState<string | null>(null);
  // False until hydration, so the markup matches the server render.
  const micSupported = useSupport(canListen);

  const recognizer = useRef<Recognizer | null>(null);
  const finalText = useRef("");
  // `onend` needs the latest interim text; a closure would capture a stale one.
  const interimRef = useRef("");
  const phrase = phrases[index] ?? "";
  const last = index + 1 >= phrases.length;

  // Never leave the microphone running behind a closed dialog.
  useEffect(() => () => recognizer.current?.abort(), []);
  useEffect(() => {
    interimRef.current = interim;
  }, [interim]);

  const grade = useCallback(
    (heard: string) => {
      setResult(compareSpeech(phrase, heard));
      setInterim("");
    },
    [phrase],
  );

  function stop() {
    recognizer.current?.stop();
  }

  function listen() {
    const engine = createRecognizer();
    if (!engine) {
      setError(t.noMic);
      return;
    }
    stopSpeaking(); // don't record the app reading the phrase out
    recognizer.current = engine;
    finalText.current = "";
    setResult(null);
    setInterim("");
    setError(null);

    engine.onstart = () => setListening(true);
    engine.onresult = (event) => {
      const { text, final } = transcriptOf(event);
      setInterim(text);
      if (final && text) finalText.current = text;
    };
    engine.onerror = (event) => {
      setListening(false);
      // "aborted" is what unmounting or a second tap looks like — not worth a message.
      if (event.error === "aborted") return;
      setError(
        event.error === "not-allowed" || event.error === "service-not-allowed"
          ? t.micDenied
          : event.error === "no-speech"
            ? t.heardNothing
            : t.micError,
      );
    };
    engine.onend = () => {
      setListening(false);
      // Grade whatever arrived; some browsers end without ever marking a result final.
      const heard = finalText.current || interimRef.current;
      if (heard) grade(heard);
      else setError(t.heardNothing);
    };

    try {
      engine.start();
    } catch {
      setError(t.micError);
    }
  }

  function next() {
    setResult(null);
    setInterim("");
    setError(null);
    setIndex((i) => i + 1);
  }

  if (phrases.length === 0) return <p className="text-sm text-zinc-500">{t.none}</p>;

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-1.5 text-sm text-zinc-500">{format(t.phraseOf, { n: index + 1, total: phrases.length })}</p>
        <ProgressMeter
          value={index}
          max={phrases.length}
          label={format(t.phraseOf, { n: index + 1, total: phrases.length })}
          size="sm"
        />
      </div>

      <div className="flex items-start gap-2 rounded-xl bg-zinc-50 p-4 dark:bg-white/5">
        <p className="min-w-0 flex-1 text-lg font-medium">{phrase}</p>
        <SpeakButton text={phrase} label={t.listen} slowLabel={t.listenSlow} />
      </div>

      {!micSupported ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm dark:border-amber-500/30 dark:bg-amber-500/10">
          ⚠️ {t.noMic}
        </p>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          {listening ? (
            <button type="button" className={btnPrimary} onClick={stop}>
              ⏹ {t.stop}
            </button>
          ) : (
            <button type="button" className={btnPrimary} onClick={listen}>
              🎤 {result ? t.tryAgain : t.record}
            </button>
          )}
          {listening && (
            <span className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
              <span aria-hidden className="size-2.5 animate-pulse rounded-full bg-red-500" />
              {t.listening}
            </span>
          )}
        </div>
      )}

      {interim && <p className="text-sm italic text-zinc-500">“{interim}”</p>}
      {error && <p className="text-sm text-amber-700 dark:text-amber-400">{error}</p>}

      {result && (
        <div role="status" aria-live="polite" className="rounded-xl border border-black/10 p-4 dark:border-white/15">
          <p className="font-semibold">
            <span aria-hidden>{result.band === "great" ? "🎉" : result.band === "close" ? "👍" : "💪"}</span>{" "}
            {format(t.scored, { score: result.score })} · {t.bands[result.band]}
          </p>

          <p className="mt-3 text-lg">
            {result.target.map((word, i) => (
              <span
                key={`${word.word}-${i}`}
                // Missed words carry an underline as well as colour, so the feedback
                // survives colour blindness and a greyscale screen.
                className={
                  word.ok
                    ? "text-emerald-700 dark:text-emerald-400"
                    : "text-amber-700 underline decoration-wavy decoration-2 dark:text-amber-400"
                }
              >
                {word.word}{" "}
              </span>
            ))}
          </p>
          <p className="sr-only">
            {result.target.some((w) => !w.ok)
              ? `${t.missedWords}: ${result.target.filter((w) => !w.ok).map((w) => w.word).join(", ")}`
              : t.bands.great}
          </p>

          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            {t.youSaid}: “{result.heard}”
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {last ? (
              onClose && (
                <button type="button" className={btnPrimary} onClick={onClose}>
                  {closeLabel}
                </button>
              )
            ) : (
              <button type="button" className={btnPrimary} onClick={next}>
                {t.nextPhrase}
              </button>
            )}
          </div>
        </div>
      )}

      {!result && !listening && onClose && (
        <div className="flex gap-2">
          {!last && (
            <button type="button" className={btnGhost} onClick={next}>
              {t.skip}
            </button>
          )}
          <button type="button" className={btnGhost} onClick={onClose}>
            {closeLabel}
          </button>
        </div>
      )}
    </div>
  );
}
