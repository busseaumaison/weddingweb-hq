"use client";
import{createContext,useContext,useEffect,useMemo,useState}from"react";import type{Lang}from"@/lib/i18n";import{copy}from"@/lib/i18n";
type C={lang:Lang;setLang:(l:Lang)=>void;t:typeof copy.fr|typeof copy.en};const Ctx=createContext<C|null>(null);
export function LanguageProvider({children}:{children:React.ReactNode}){const[lang,setLangState]=useState<Lang>("fr");useEffect(()=>{const s=localStorage.getItem("wedding-lang");if(s==="fr"||s==="en")setLangState(s)},[]);function setLang(l:Lang){setLangState(l);localStorage.setItem("wedding-lang",l);document.documentElement.lang=l}const value=useMemo(()=>({lang,setLang,t:copy[lang]}),[lang]);return <Ctx.Provider value={value}>{children}</Ctx.Provider>}
export function useLanguage(){const c=useContext(Ctx);if(!c)throw new Error("LanguageProvider missing");return c}
