import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import vi from "@/i18n/dictionaries/vi.json";
import { SpeakButton } from "./speak-button";
import { SpeakingPractice } from "./speaking-practice";

const t = vi.speaking;

// These components call into `window.speechSynthesis` / `SpeechRecognition`, which do not
// exist on the server. Rendering them here proves nothing touches `window` during render
// and that the first paint matches what the browser will hydrate.
describe("server rendering", () => {
  it("renders the listen button as nothing, rather than a dead button", () => {
    const html = renderToStaticMarkup(<SpeakButton text="Hello" label={t.listen} slowLabel={t.listenSlow} />);
    expect(html).toBe("");
  });

  it("renders speaking practice with the unsupported notice and no crash", () => {
    const html = renderToStaticMarkup(
      <SpeakingPractice phrases={["Good morning.", "See you tomorrow!"]} t={t} closeLabel="Đóng" />,
    );
    expect(html).toContain("Good morning.");
    expect(html).toContain(t.noMic);
    expect(html).toContain("Câu 1/2");
  });

  it("says so when a lesson has no phrases", () => {
    const html = renderToStaticMarkup(<SpeakingPractice phrases={[]} t={t} closeLabel="Đóng" />);
    expect(html).toContain(t.none);
  });
});
