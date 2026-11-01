"use server";

import { eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireUserIdForAction } from "@/lib/auth";
import { AVATAR_BUCKET, NAME_MAX } from "./config";

export type ProfileState = { ok?: boolean; error?: "invalid" | "avatar" | "server" };



const optionalName = (max: number) =>
  z.string().trim().max(max).transform((v) => v || null);

export async function updateProfile(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const userId = await requireUserIdForAction();

  const parsed = z
    .object({
      displayName: optionalName(NAME_MAX),
      firstName: optionalName(NAME_MAX),
      lastName: optionalName(NAME_MAX),
      avatarUrl: z.string().trim().max(500),
    })
    .safeParse({
      displayName: formData.get("displayName") ?? "",
      firstName: formData.get("firstName") ?? "",
      lastName: formData.get("lastName") ?? "",
      avatarUrl: formData.get("avatarUrl") ?? "",
    });
  if (!parsed.success) return { error: "invalid" };

  // Only accept avatars stored in this user's own folder of our public bucket.
  const { avatarUrl, ...names } = parsed.data;
  const allowedPrefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${AVATAR_BUCKET}/${userId}/`;
  if (avatarUrl && !avatarUrl.startsWith(allowedPrefix)) return { error: "avatar" };

  try {
    await db
      .update(users)
      .set({ ...names, avatarUrl: avatarUrl || null })
      .where(eq(users.id, userId));
  } catch (e) {
    console.error("[updateProfile]", e);
    return { error: "server" };
  }

  refresh();
  return { ok: true };
}
