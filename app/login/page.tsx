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
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className={`${ui.card} w-full max-w-sm space-y-4 !p-6`}>
        <div>
          <h1 className="text-2xl font-semibold">تفوق</h1>
          <p className={ui.muted}>Sign in to manage the center</p>
        </div>
        <input className={ui.input} placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input
          className={ui.input}
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button onClick={submit} className={ui.btn}>
          Sign in
        </button>
      </div>
    </main>
  );
}