import "server-only";
import { eq } from "drizzle-orm";
import { cache } from "react";
import { db } from "@/db";
import { users } from "@/db/schema";

export type Profile = {
  id: string;
  email: string;
  displayName: string | null;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
};

export const getProfile = cache(async (userId: string): Promise<Profile | null> => {
  const [row] = await db
    .select({
      id: users.id,
      email: users.email,
      displayName: users.displayName,
      firstName: users.firstName,
      lastName: users.lastName,
      avatarUrl: users.avatarUrl,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return row ?? null;
});

/** Best label for greeting/menus: display name → "First Last" → email local part. */
export function profileLabel(p: Pick<Profile, "displayName" | "firstName" | "lastName" | "email">): string {
  const full = [p.firstName, p.lastName].filter(Boolean).join(" ").trim();
  return p.displayName?.trim() || full || p.email.split("@")[0];
}
