import { Suspense } from "react";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { Locale } from "@/i18n/config";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "./actions";

export default async function DashboardPage() {
  const [locale, dict] = await Promise.all([getLocale(), getDictionary()]);

  return (
    <>
      <SiteHeader>
        <form action={signOut}>
          <input type="hidden" name="lang" value={locale} />
          <button type="submit" className="text-sm font-medium hover:underline">
            {dict.nav.logout}
          </button>
        </form>
      </SiteHeader>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
        {/* Session read happens at request time, so it streams behind Suspense. */}
        <Suspense fallback={<p className="text-zinc-500">{dict.dashboard.loading}</p>}>
          <UserDashboard locale={locale} t={dict.dashboard} />
        </Suspense>
      </main>
    </>
  );
}

async function UserDashboard({ locale, t }: { locale: Locale; t: Dictionary["dashboard"] }) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const email = data?.claims?.email as string | undefined;
  if (!data?.claims) redirect(`/${locale}/login`);

  return (
    <section>
      <h1 className="text-2xl font-bold">
        {t.greeting}, {email ?? "👋"}
      </h1>
      <div className="mt-6 rounded-2xl border border-dashed border-black/10 p-8 text-center text-zinc-500 dark:border-white/15">
        {t.empty}
      </div>
    </section>
  );
}
