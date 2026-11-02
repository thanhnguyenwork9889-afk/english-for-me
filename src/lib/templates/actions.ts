"use server";

import { redirect } from "next/navigation";
import { db } from "@/db";
import { lessons, phases, roadmaps } from "@/db/schema";
import { defaultLocale, hasLocale } from "@/i18n/config";
import { requireUserIdForAction } from "@/lib/auth";
import { getUserPrefs } from "@/lib/progress/queries";
import { addDays, todayIn } from "@/lib/progress/streak";
import { getTemplate } from "./index";

export type TemplateState = { error?: "notFound" | "server" };

/** Copy a template into a new roadmap owned by the user, starting today, then open it. */
export async function createRoadmapFromTemplate(_prev: TemplateState, formData: FormData): Promise<TemplateState> {
  const userId = await requireUserIdForAction();
  const rawLang = String(formData.get("lang") ?? "");
  const lang = hasLocale(rawLang) ? rawLang : defaultLocale;
  const template = getTemplate(String(formData.get("templateId") ?? ""));
  if (!template) return { error: "notFound" };

  const { timezone } = await getUserPrefs(userId);
  const startDate = todayIn(timezone);
  const weeksPerPhase = template.weeks / template.phases.length;

  let id: string;
  try {
    id = await db.transaction(async (tx) => {
      const [rm] = await tx
        .insert(roadmaps)
        .values({
          userId,
          title: template.title,
          goal: template.goal,
          startDate,
          targetDate: addDays(startDate, template.weeks * 7 - 1),
        })
        .returning({ id: roadmaps.id });

      const phaseRows = await tx
        .insert(phases)
        .values(
          template.phases.map((p, i) => ({
            roadmapId: rm.id,
            title: p.title,
            orderIndex: i,
            targetDate: addDays(startDate, Math.round((i + 1) * weeksPerPhase * 7) - 1),
          })),
        )
        .returning({ id: phases.id, orderIndex: phases.orderIndex });

      const phaseIdByIndex = new Map(phaseRows.map((p) => [p.orderIndex, p.id]));
      await tx.insert(lessons).values(
        template.phases.flatMap((p, pi) =>
          p.lessons.map((l, li) => ({
            phaseId: phaseIdByIndex.get(pi)!,
            title: l.title,
            estimatedMinutes: l.estimatedMinutes,
            contentMd: l.contentMd,
            resourceUrls: l.resourceUrls,
            orderIndex: li,
          })),
        ),
      );
      return rm.id;
    });
  } catch (e) {
    console.error("[createRoadmapFromTemplate]", e);
    return { error: "server" };
  }
  redirect(`/${lang}/roadmaps/${id}`);
}
