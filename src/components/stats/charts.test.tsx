import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import vi from "@/i18n/dictionaries/vi.json";
import { calendarWeeks, daySeries } from "@/lib/stats/calendar";
import { ActivityHeatmap } from "./activity-heatmap";
import { MinutesChart } from "./minutes-chart";
import { fillByLevel } from "./scale";

const TODAY = "2026-03-11"; // a Wednesday
const rows = [
  { date: "2026-03-02", lessons: 1, minutes: 15 },
  { date: "2026-03-05", lessons: 2, minutes: 60 },
  { date: "2026-03-09", lessons: 1, minutes: 30 },
  { date: "2026-03-11", lessons: 1, minutes: 45 },
];

const t = vi.insights;
const ts = vi.stats;

describe("MinutesChart", () => {
  const html = renderToStaticMarkup(
    <MinutesChart days={daySeries(rows, TODAY, 14)} goalMinutes={30} t={t} ts={ts} />,
  );

  it("scales bars against a rounded axis top, not the busiest bar", () => {
    // Busiest is 60 and the axis rounds to 60, so that bar fills the plot and 30 is half.
    expect(html).toContain("height:100%");
    expect(html).toContain("height:50%");
  });

  it("draws the daily target line at its share of the axis", () => {
    expect(html).toContain("bottom:50%");
    expect(html).toContain("Mục tiêu 30 phút/ngày");
  });

  it("labels only the busiest day", () => {
    expect(html.match(/>60</g)).toHaveLength(2); // the axis top and the one direct label
    expect(html).not.toContain(">45<"); // every other value stays in hover + table
  });

  it("gives every day an accessible name, studied or not", () => {
    expect(html).toContain('aria-label="2026-03-05: 2 bài · 60 phút"');
    expect(html).toContain('aria-label="2026-03-03: Chưa học"');
  });

  it("keeps a bar visible when a day has very few minutes", () => {
    const days = [
      { date: "2026-03-10", lessons: 1, minutes: 1 },
      { date: TODAY, lessons: 8, minutes: 300 },
    ];
    const tall = renderToStaticMarkup(
      <MinutesChart days={daySeries(days, TODAY, 2)} goalMinutes={0} t={t} ts={ts} />,
    );
    // 1 of a 300-minute axis is 0.3%, floored to 2% so the day is never invisible.
    expect(tall).toContain("height:2%");
  });
});

describe("ActivityHeatmap", () => {
  const html = renderToStaticMarkup(
    <ActivityHeatmap calendar={calendarWeeks(rows, TODAY, 4)} locale="vi" t={t} ts={ts} />,
  );

  it("renders one cell per day of every week in range", () => {
    expect(html.match(/aria-label="2026-/g)).toHaveLength(28);
  });

  it("shades each day by its share of the busiest day", () => {
    const classOf = (date: string) =>
      html.match(new RegExp(`aria-label="${date}[^"]*"\\s+class="([^"]*)"`))?.[1] ?? "";
    expect(classOf("2026-03-05")).toContain(fillByLevel[4]); // 60 of 60
    expect(classOf("2026-03-11")).toContain(fillByLevel[3]); // 45 of 60
    expect(classOf("2026-03-09")).toContain(fillByLevel[2]); // 30 of 60
    expect(classOf("2026-03-02")).toContain(fillByLevel[1]); // 15 of 60
    expect(classOf("2026-03-03")).toContain(fillByLevel[0]); // nothing studied
  });

  it("marks today and leaves the rest of this week as future", () => {
    expect(html).toContain("ring-indigo-600");
    expect(html).toContain('aria-label="2026-03-12: Chưa tới ngày này"');
  });

  it("labels a month column only where the month changes", () => {
    expect(html.match(/>Th2</g)).toHaveLength(1);
    expect(html.match(/>Th3</g)).toHaveLength(1);
    const en = renderToStaticMarkup(
      <ActivityHeatmap calendar={calendarWeeks(rows, TODAY, 4)} locale="en" t={t} ts={ts} />,
    );
    expect(en).toContain(">Feb<");
  });
});
