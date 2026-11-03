// Thin wrappers over the two Web Speech APIs, with the typings TypeScript doesn't ship.
// Both are free and built into the browser: no service, no key, no cost.
// Everything here touches `window`, so it only runs in client components.

// ---------- Speaking to the user: speechSynthesis ----------

export const canSpeak = () => typeof window !== "undefined" && "speechSynthesis" in window;

let voicePromise: Promise<SpeechSynthesisVoice[]> | null = null;

/**
 * The voice list loads asynchronously and is empty on the first call in most browsers,
 * so wait for `voiceschanged` once and cache the result.
 */
function voices(): Promise<SpeechSynthesisVoice[]> {
  if (!canSpeak()) return Promise.resolve([]);
  voicePromise ??= new Promise((resolve) => {
    const ready = window.speechSynthesis.getVoices();
    if (ready.length > 0) {
      resolve(ready);
      return;
    }
    const done = () => resolve(window.speechSynthesis.getVoices());
    window.speechSynthesis.addEventListener("voiceschanged", done, { once: true });
    // Some browsers never fire the event if the list is already final.
    setTimeout(done, 1500);
  });
  return voicePromise;
}

/** Prefer a US or UK voice; fall back to any English one, then to the browser default. */
async function englishVoice(): Promise<SpeechSynthesisVoice | null> {
  const list = await voices();
  const english = list.filter((v) => v.lang.toLowerCase().startsWith("en"));
  const preferred = ["en-us", "en-gb"];
  for (const tag of preferred) {
    const hit = english.find((v) => v.lang.toLowerCase() === tag);
    if (hit) return hit;
  }
  return english[0] ?? null;
}

/** Read `text` aloud in English. `rate` 1 is normal, 0.7 is the "slow" button. */
export async function say(text: string, rate = 1): Promise<void> {
  if (!canSpeak()) return;
  const synth = window.speechSynthesis;
  synth.cancel(); // never let two sentences overlap
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = rate;
  utterance.lang = "en-US";
  const voice = await englishVoice();
  if (voice) {
    utterance.voice = voice;
    utterance.lang = voice.lang;
  }
  synth.speak(utterance);
}

export const stopSpeaking = () => {
  if (canSpeak()) window.speechSynthesis.cancel();
};

/** True when the browser has no English voice installed — speaking would be unintelligible. */
export async function hasEnglishVoice(): Promise<boolean> {
  return canSpeak() && (await englishVoice()) !== null;
}

// ---------- Listening to the user: SpeechRecognition ----------

type Alternative = { transcript: string; confidence: number };
type Result = ArrayLike<Alternative> & { isFinal: boolean };
type ResultEvent = { results: ArrayLike<Result>; resultIndex: number };
type ErrorEvent = { error: string };

export type Recognizer = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: ResultEvent) => void) | null;
  onerror: ((e: ErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
};

type RecognizerCtor = new () => Recognizer;

const recognizerCtor = (): RecognizerCtor | null => {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognizerCtor; webkitSpeechRecognition?: RecognizerCtor };
  // Safari (including iOS) and older Chrome only expose the prefixed name.
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
};

export const canListen = () => recognizerCtor() !== null;

/** A recognizer set up for one short English sentence, or null if unsupported. */
export function createRecognizer(lang = "en-US"): Recognizer | null {
  const Ctor = recognizerCtor();
  if (!Ctor) return null;
  const recognizer = new Ctor();
  recognizer.lang = lang;
  recognizer.continuous = false; // one sentence, then stop
  recognizer.interimResults = true; // show words as they arrive
  recognizer.maxAlternatives = 1;
  return recognizer;
}

/** Join every alternative in an event into one transcript. */
export function transcriptOf(event: ResultEvent): { text: string; final: boolean } {
  let text = "";
  let final = false;
  for (let i = 0; i < event.results.length; i++) {
    const result = event.results[i];
    text += result[0]?.transcript ?? "";
    if (result.isFinal) final = true;
  }
  return { text: text.trim(), final };
}
