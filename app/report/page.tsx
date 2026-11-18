"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ui } from "@/components/ui";

const money = (n: number) => Number(n).toLocaleString() + " DA";
const initials = (n: string) => n.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");

export default function Report() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [stats, setStats] = useState({ collected: 0, paidOut: 0, net: 0, owed: 0, billed: 0 });
  const [subjectsData, setSubjectsData] = useState<any[]>([]);
  const [teachersData, setTeachersData] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) return router.push("/login");
      
      const [pay, out, cy, sub, tch, enr] = await Promise.all([
        supabase.from("payments").select("amount, cycle_id"),
        supabase.from("teacher_payouts").select("amount, teacher_id"),
        supabase.from("cycle_status").select("fee, remaining, subject_id, teacher_share"),
        supabase.from("subjects").select("id, name, teacher_id"),
        supabase.from("teachers").select("id, name"),
        supabase.from("enrollments").select("id, subject_id"),
      ]);

      const collected = (pay.data ?? []).reduce((s, x) => s + Number(x.amount), 0);
      const paidOut = (out.data ?? []).reduce((s, x) => s + Number(x.amount), 0);
      const owed = (cy.data ?? []).reduce((s, x) => s + Number(x.remaining), 0);
      const billed = (cy.data ?? []).reduce((s, x) => s + Number(x.fee), 0);

      setStats({ collected, paidOut, net: collected - paidOut, owed, billed });

      // 1. Calculate Revenue by Subject
      const subMap: Record<string, number> = {};
      (cy.data ?? []).forEach(c => {
        const subName = (sub.data ?? []).find(x => x.id === c.subject_id)?.name || "Other";
        subMap[subName] = (subMap[subName] || 0) + Number(c.fee);
      });
      const subArr = Object.keys(subMap).map(k => ({ name: k, val: subMap[k] })).sort((a,b)=>b.val-a.val);
      setSubjectsData(subArr);

      // 2. Calculate Teacher Payouts
      const tchArr = (tch.data ?? []).map(t => {
        const tSubs = (sub.data ?? []).filter(s => s.teacher_id === t.id).map(s => s.id);
        const earned = (cy.data ?? []).filter(c => tSubs.includes(c.subject_id)).reduce((s, x) => s + Number(x.teacher_share), 0);
        const paid = (out.data ?? []).filter(o => o.teacher_id === t.id).reduce((s, x) => s + Number(x.amount), 0);
        const studentCount = (enr.data ?? []).filter(e => tSubs.includes(e.subject_id)).length;
        return { ...t, earned, paid, pending: earned - paid, studentCount };
      });
      setTeachersData(tchArr);
      setReady(true);
    })();
  }, [router]);

  if (!ready) return <main className={ui.page}>Loading...</main>;

  const pct = stats.billed > 0 ? Math.round((stats.collected / stats.billed) * 100) : 0;
  const C = 289;
  const netArc = (Math.max(0, stats.net) / stats.billed) * C || 0;
  const teacherArc = (stats.paidOut / stats.billed) * C || 0;
  const owedArc = (stats.owed / stats.billed) * C || 0;

  return (
    <main className={ui.page}>
      <header className="mb-4">
        <p className="text-[12px] font-medium text-slate-500">Center Analytics</p>
        <h1 className="font-display text-[24px] font-extrabold text-slate-900">Reports</h1>
      </header>

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

      {/* 6-Month Trend Chart (Keep from previous code) */}

      {/* MISSING: Revenue by Subject (Screenshot 4 & 5) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-2xs mb-4">
        <h2 className="font-display text-[15px] font-bold text-slate-900 mb-3">Revenue by Subject</h2>
        <div className="space-y-3">
          {subjectsData.map((s, i) => {
            const width = (s.val / Math.max(...subjectsData.map(x=>x.val))) * 100;
            const colors = ["bg-indigo-600", "bg-emerald-500", "bg-amber-500", "bg-rose-500"];
            return (
              <div key={s.name}>
                <div className="flex justify-between text-[12px] mb-1"><span className="font-bold text-slate-800">{s.name}</span><span className="font-semibold text-slate-600">{money(s.val)}</span></div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden"><div style={{ width: `${width}%` }} className={`h-full ${colors[i % colors.length]} rounded-full`}></div></div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MISSING: Teacher Payouts & Splits (Screenshot 4 & 5) */}
      <div className="space-y-2">
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-0.5">Teacher Payouts & Splits</h2>
        <div className="space-y-2">
          {teachersData.map(t => (
            <div key={t.id} className="bg-white rounded-2xl border border-slate-200 p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center">{initials(t.name)}</div>
                <div>
                  <p className="font-display font-bold text-[14px] text-slate-900">{t.name}</p>
                  <p className="text-[11px] text-slate-500">{t.studentCount} students · 50% split</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-display font-extrabold text-[14px] text-emerald-700">{money(t.earned)}</p>
                <span className={`text-[10px] font-bold ${t.pending > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>{t.pending > 0 ? 'Pending' : 'Paid Nov ✓'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}