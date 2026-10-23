import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import si from "./locales/si.json";
const dictionary: Record<string, string> = si;
type Language = "en" | "si";
const Locale = createContext<{ language: Language; setLanguage: (language: Language) => void; t: (text: string) => string }>({ language: "en", setLanguage: () => {}, t: text => text });
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => localStorage.getItem("mediassure-language") === "si" ? "si" : "en");
  useEffect(() => { localStorage.setItem("mediassure-language", language); document.documentElement.lang = language; }, [language]);
  return <Locale.Provider value={{ language, setLanguage, t: text => language === "si" ? dictionary[text] ?? text : text }}>{children}</Locale.Provider>;
}
export function useI18n() { return useContext(Locale); }
export function LanguageSwitch() {
  const { language, setLanguage } = useI18n();
  return <label className="inline-flex min-w-0 max-w-full flex-wrap items-center gap-2 text-sm"><span className="hidden sm:inline">Language / භාෂාව</span><select aria-label="Language / භාෂාව" value={language} onChange={e => setLanguage(e.target.value as Language)} className="min-h-11 min-w-0 max-w-full rounded border bg-white p-2 text-base text-[#092C46]"><option value="en">English</option><option value="si">සිංහල</option></select></label>;
}
