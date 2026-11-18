"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ui } from "@/components/ui";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function submit() {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    else router.push("/today");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 bg-[#F8FAFC]">
      <div className={`${ui.card} w-full max-w-sm space-y-4 !p-6`}>
        <div className="text-center">
          <p className="text-[11px] font-bold uppercase tracking-widest text-indigo-600">Center Management</p>
          <h1 className="font-display text-3xl font-extrabold text-slate-900 mt-1">تفوق</h1>
          <p className="text-[12px] text-slate-500 mt-1">Sign in to manage the center</p>
        </div>
        <input className={ui.input} placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className={ui.input} type="password" placeholder="Password" value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()} />
        {error && <p className="text-[12px] font-semibold text-rose-600">{error}</p>}
        <button onClick={submit} className={ui.btn}>Sign in</button>
      </div>
    </main>
  );
}