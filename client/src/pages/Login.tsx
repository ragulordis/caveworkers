import { motion } from "framer-motion";
import { ArrowRight, Check, LockKeyhole, ShieldCheck, Sparkles, type LucideIcon } from "lucide-react";
import React from "react";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";

const benefits: Array<{ Icon: LucideIcon; label: string }> = [
  { Icon: LockKeyhole, label: "Private tenant" },
  { Icon: ShieldCheck, label: "Scoped access" },
  { Icon: Sparkles, label: "Ready workforce" },
];

function CaveMark() {
  return <div className="relative grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-[#a58cff] via-[#7d5df3] to-[#3a2a85] shadow-[0_10px_24px_rgba(102,73,224,.28)]"><div className="absolute inset-[1px] rounded-[14px] border border-white/15" /><svg className="relative size-6" viewBox="0 0 24 24" fill="none"><path d="M4 18V11.5a8 8 0 0 1 16 0V18" stroke="white" strokeWidth="2.1" strokeLinecap="round" /><path d="M7.5 18v-5.3a4.5 4.5 0 0 1 9 0V18" stroke="white" strokeOpacity=".58" strokeWidth="1.6" strokeLinecap="round" /></svg></div>;
}

function GoogleMark() {
  return <svg className="size-5" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.35 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.24a4.48 4.48 0 0 1-1.94 2.94v2.52h3.14c1.84-1.69 2.91-4.19 2.91-7.29Z" /><path fill="#34A853" d="M12 21.75c2.63 0 4.84-.87 6.45-2.36L15.3 16.9c-.88.59-2 .94-3.3.94-2.54 0-4.69-1.72-5.46-4.03H3.3v2.6A9.74 9.74 0 0 0 12 21.75Z" /><path fill="#FBBC05" d="M6.54 13.81A5.85 5.85 0 0 1 6.24 12c0-.63.11-1.24.3-1.81v-2.6H3.3A9.75 9.75 0 0 0 2.25 12c0 1.57.38 3.05 1.05 4.41l3.24-2.6Z" /><path fill="#EA4335" d="M12 6.16c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.83 3.25 14.63 2.25 12 2.25A9.74 9.74 0 0 0 3.3 7.59l3.24 2.6C7.31 7.88 9.46 6.16 12 6.16Z" /></svg>;
}

export default function Login() {
  const { isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();
  useEffect(() => { if (!loading && isAuthenticated) setLocation("/"); }, [isAuthenticated, loading, setLocation]);
  return <main className="app-noise mesh-glow grid min-h-screen place-items-center overflow-hidden bg-[#0a0b0e] px-4 py-8 text-white"><motion.section initial={{ opacity: 0, y: 16, scale: .985 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: .32, ease: [0.23, 1, 0.32, 1] }} className="glass-panel grid w-full max-w-5xl overflow-hidden rounded-[30px] lg:grid-cols-[1.05fr_.95fr]"><div className="terrain-lines relative min-h-[330px] border-b border-white/[.07] bg-gradient-to-br from-[#20194a] via-[#151027] to-[#101115] p-7 sm:p-10 lg:min-h-[580px] lg:border-b-0 lg:border-r"><div className="flex h-full flex-col"><div className="flex items-center gap-3"><CaveMark /><div><p className="text-sm font-semibold tracking-[-.03em] text-white">Caveworkers</p><p className="mt-0.5 text-xs text-violet-100/55">Private AI workforce</p></div></div><div className="mt-auto"><p className="mono text-[10px] uppercase tracking-[.16em] text-violet-200">Workspace access</p><h1 className="mt-4 max-w-md text-4xl font-semibold leading-[1.04] tracking-[-.055em] text-white sm:text-5xl">Your company context stays in your company.</h1><p className="mt-5 max-w-md text-sm leading-6 text-violet-100/65">Every account receives a separate workspace. Tasks, chat, documents, Activity, and specialist workflows are scoped to your authenticated company tenant.</p><div className="mt-8 grid gap-3 sm:grid-cols-3">{benefits.map(({ Icon, label }) => <div key={label} className="rounded-xl border border-white/10 bg-black/10 p-3"><Icon className="size-4 text-violet-200" /><p className="mt-3 text-[11px] font-medium text-violet-50">{label}</p></div>)}</div></div></div></div><div className="flex min-h-[420px] flex-col justify-center p-7 sm:p-10"><p className="mono text-[10px] uppercase tracking-[.14em] text-violet-300">Sign in securely</p><h2 className="mt-3 text-3xl font-semibold tracking-[-.045em] text-white">Enter your workspace.</h2><p className="mt-3 max-w-sm text-sm leading-6 text-zinc-500">Continue with the Google account you use for Caveworkers. Your work remains isolated from every other tenant.</p><button onClick={startLogin} disabled={loading} className="mt-8 flex h-12 w-full items-center justify-center gap-3 rounded-xl bg-white px-4 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-100 active:scale-[.98] disabled:cursor-wait disabled:opacity-65"><GoogleMark />{loading ? "Checking your session…" : "Continue with Google"}<ArrowRight className="size-4" /></button><div className="mt-6 flex gap-2 text-xs leading-5 text-zinc-600"><Check className="mt-0.5 size-3.5 shrink-0 text-emerald-300" />The secure sign-in flow returns you to Caveworkers after your account is verified.</div></div></motion.section></main>;
}
