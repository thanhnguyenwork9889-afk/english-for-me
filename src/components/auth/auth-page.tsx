import { SiteHeader } from "@/components/site-header";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";
import { AuthForm } from "./auth-form";

/** Shared shell for login / signup / forgot / reset pages. */
export async function AuthPage({ mode }: { mode: "login" | "signup" | "forgot" | "reset" }) {
  const [locale, dict] = await Promise.all([getLocale(), getDictionary()]);
  const t = dict.auth;
  const copy = t[mode];

  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-12">
        <h1 className="text-2xl font-bold">{copy.title}</h1>
        <p className="mt-2 mb-6 text-sm text-zinc-600 dark:text-zinc-400">{copy.subtitle}</p>
        <AuthForm mode={mode} lang={locale} t={t} />
      </main>
    </>
  );
}
