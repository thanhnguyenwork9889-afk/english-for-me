import { SiteHeader } from "@/components/site-header";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const [locale, dict] = await Promise.all([getLocale(), getDictionary()]);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-16">
        <h1 className="text-2xl font-bold">{dict.login.title}</h1>
        <p className="mt-2 mb-6 text-sm text-zinc-600 dark:text-zinc-400">{dict.login.subtitle}</p>
        <LoginForm lang={locale} t={dict.login} />
      </main>
    </>
  );
}
