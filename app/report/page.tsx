"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ui } from "@/components/ui";

const money = (n: number) => Number(n).toLocaleString() + " DA";

export default function Report() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [stats, setStats] = useState({ collected: 0, paidOut: 0, net: 0, owed: 0, billed: 0 });

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) return router.push("/login");
      const [pay, out, cy] = await Promise.all([
        supabase.from("payments").select("amount"),
        supabase.from("teacher_payouts").select("amount"),
        supabase.from("cycle_status").select("fee, remaining"),
      ]);
      const collected = (pay.data ?? []).reduce((s, x) => s + Number(x.amount), 0);
      const paidOut = (out.data ?? []).reduce((s, x) => s + Number(x.amount), 0);
      const owed = (cy.data ?? []).reduce((s, x) => s + Number(x.remaining), 0);
      const billed = (cy.data ?? []).reduce((s, x) => s + Number(x.fee), 0);
      setStats({ collected, paidOut, net: collected - paidOut, owed, billed });
      setReady(true);
    })();
  }, [router]);

  if (!ready) return <main className={ui.page}>Loading...</main>;

  const pct = stats.billed > 0 ? Math.round((stats.collected / stats.billed) * 100) : 0;
  const C = 289; // Circumference of donut
  const netArc = (Math.max(0, stats.net) / stats.billed) * C || 0;
  const teacherArc = (stats.paidOut / stats.billed) * C || 0;
  const owedArc = (stats.owed / stats.billed) * C || 0;

  return (
    <main className={ui.page}>
      <header className="mb-4">
        <p className="text-[12px] font-medium text-slate-500">Center Analytics</p>
        <h1 className="font-display text-[24px] font-extrabold text-slate-900">Reports</h1>
      </header>

      {/* 1. Donut Chart */}
      <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-2xs mb-4">
        <h2 className="font-display text-[15px] font-bold text-slate-900 mb-3">Collection Breakdown</h2>
        <div className="flex items-center gap-4">
          <div className="relative w-32 h-32 shrink-0 flex items-center justify-center">
            <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="46" fill="none" stroke="#F1F5F9" strokeWidth="14" />
              <circle cx="60" cy="60" r="46" fill="none" stroke="#10B981" strokeWidth="14" strokeDasharray={`${netArc} ${C}`} />
              <circle cx="60" cy="60" r="46" fill="none" stroke="#6366F1" strokeWidth="14" strokeDasharray={`${teacherArc} ${C}`} strokeDashoffset={-netArc} />
              <circle cx="60" cy="60" r="46" fill="none" stroke="#F43F5E" strokeWidth="14" strokeDasharray={`${owedArc} ${C}`} strokeDashoffset={-(netArc + teacherArc)} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="font-display text-[18px] font-extrabold text-slate-900">{pct}%</span>
              <span className="text-[10px] text-slate-400">Collected</span>
            </div>
          </div>
          <div className="flex-1 space-y-2 text-[12px]">
            <div className="flex justify-between"><span className="flex items-center gap-1.5 text-slate-600"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>Net Profit</span><span className="font-bold">{money(stats.net)}</span></div>
            <div className="flex justify-between"><span className="flex items-center gap-1.5 text-slate-600"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>Teachers</span><span className="font-bold">{money(stats.paidOut)}</span></div>
            <div className="flex justify-between"><span className="flex items-center gap-1.5 text-slate-600"><span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>Unpaid</span><span className="font-bold text-rose-600">{money(stats.owed)}</span></div>
          </div>
        </div>
      </div>

      {/* 2. Bar Chart */}
      <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-2xs space-y-4">
        <h2 className="font-display text-[15px] font-bold text-slate-900">Revenue Trend</h2>
        <div className="grid grid-cols-6 gap-2 items-end h-36 pt-4">
          {[21000, 18500, 15000, 27800, 30000, 31000].map((val, i) => {
            const max = 31000;
            const h = Math.round((val / max) * 100);
            return (
              <div key={i} className="flex flex-col items-center gap-1 h-full justify-end">
                <div style={{ height: `${h}%` }} className="w-2.5 rounded-t-md bg-indigo-600"></div>
                <span className="text-[10px] font-bold text-slate-400">{["Jun", "Jul", "Aug", "Sep", "Oct", "Nov"][i]}</span>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}