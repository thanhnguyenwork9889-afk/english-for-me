"use client";

import { useActionState, useRef, useState } from "react";
import { Avatar } from "@/components/avatar";
import { btnGhost, btnPrimary, inputCls, labelCls } from "@/components/ui";
import type { Dictionary } from "@/i18n/get-dictionary";
import { updateProfile, type ProfileState } from "@/lib/profile/actions";
import { AVATAR_BUCKET, AVATAR_SIZE, NAME_MAX } from "@/lib/profile/config";
import { createClient } from "@/lib/supabase/client";

type Initial = {
  email: string;
  displayName: string;
  firstName: string;
  lastName: string;
  avatarUrl: string;
};

export function ProfileForm({
  userId,
  initial,
  t,
}: {
  userId: string;
  initial: Initial;
  t: Dictionary["profile"];
}) {
  const [state, formAction, saving] = useActionState<ProfileState, FormData>(updateProfile, {});
  const [avatarUrl, setAvatarUrl] = useState(initial.avatarUrl);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [names, setNames] = useState({
    displayName: initial.displayName,
    firstName: initial.firstName,
    lastName: initial.lastName,
  });
  const fileRef = useRef<HTMLInputElement>(null);

  const previewName =
    names.displayName.trim() ||
    [names.firstName, names.lastName].filter(Boolean).join(" ").trim() ||
    initial.email.split("@")[0];

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow picking the same file again
    if (!file) return;
    setUploadError(null);
    if (!file.type.startsWith("image/")) {
      setUploadError(t.errors.notImage);
      return;
    }
    setUploading(true);
    try {
      const blob = await squareResize(file, AVATAR_SIZE);
      const supabase = createClient();
      const path = `${userId}/${crypto.randomUUID()}.webp`;
      const { error } = await supabase.storage
        .from(AVATAR_BUCKET)
        .upload(path, blob, { contentType: "image/webp", cacheControl: "31536000", upsert: false });
      if (error) throw error;
      setAvatarUrl(supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path).data.publicUrl);
      setDirty(true);
    } catch (err) {
      console.error("[avatar upload]", err);
      setUploadError(t.errors.avatar);
    } finally {
      setUploading(false);
    }
  }

  const error = uploadError ?? (state.error ? t.errors[state.error] : null);
  const showSaved = state.ok && !dirty && !saving;

  return (
    <form
      action={(fd) => {
        setDirty(false);
        return formAction(fd);
      }}
      onChange={() => setDirty(true)}
      className="space-y-6"
    >
      <input type="hidden" name="avatarUrl" value={avatarUrl} />

      {/* Avatar */}
      <div>
        <span className={labelCls}>{t.avatar}</span>
        <div className="flex items-center gap-4">
          <Avatar src={avatarUrl || null} name={previewName} size={80} />
          <div className="space-y-2">
            <div className="flex gap-2">
              <button
                type="button"
                className={`${btnGhost} border border-black/10 dark:border-white/15`}
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? t.uploading : t.changeAvatar}
              </button>
              {avatarUrl && (
                <button
                  type="button"
                  className={btnGhost}
                  onClick={() => {
                    setAvatarUrl("");
                    setDirty(true);
                  }}
                  disabled={uploading}
                >
                  {t.removeAvatar}
                </button>
              )}
            </div>
            <p className="text-xs text-zinc-500">{t.avatarHint}</p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={onPickFile}
          />
        </div>
      </div>

      {/* Names */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls} htmlFor="p-last">{t.lastName}</label>
          <input
            id="p-last"
            name="lastName"
            maxLength={NAME_MAX}
            autoComplete="family-name"
            value={names.lastName}
            onChange={(e) => setNames((n) => ({ ...n, lastName: e.target.value }))}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="p-first">{t.firstName}</label>
          <input
            id="p-first"
            name="firstName"
            maxLength={NAME_MAX}
            autoComplete="given-name"
            value={names.firstName}
            onChange={(e) => setNames((n) => ({ ...n, firstName: e.target.value }))}
            className={inputCls}
          />
        </div>
      </div>

      <div>
        <label className={labelCls} htmlFor="p-display">{t.displayName}</label>
        <input
          id="p-display"
          name="displayName"
          maxLength={NAME_MAX}
          autoComplete="nickname"
          value={names.displayName}
          onChange={(e) => setNames((n) => ({ ...n, displayName: e.target.value }))}
          className={inputCls}
        />
        <p className="mt-1 text-xs text-zinc-500">{t.displayNameHint}</p>
      </div>

      <div>
        <label className={labelCls} htmlFor="p-email">{t.email}</label>
        <input id="p-email" value={initial.email} readOnly disabled className={`${inputCls} opacity-70`} />
        <p className="mt-1 text-xs text-zinc-500">{t.emailHint}</p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {showSaved && <p className="text-sm text-emerald-600">✓ {t.saved}</p>}

      <button type="submit" className={btnPrimary} disabled={saving || uploading}>
        {saving ? t.saving : t.save}
      </button>
    </form>
  );
}

/** Center-crop to a square and resize to `size`×`size` WebP (keeps uploads tiny). */
async function squareResize(file: File, size: number): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - side) / 2;
  const sy = (bitmap.height - side) / 2;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, size, size);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Encode failed"))), "image/webp", 0.85),
  );
}
