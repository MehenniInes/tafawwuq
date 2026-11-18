"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { ui } from "@/components/ui";

const money = (n: number) => Number(n).toLocaleString() + " DA";
const localDate = (d = new Date()) =>
  new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

export default function Home() {
  const router = useRouter();
  const [cycles, setCycles] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [payAmt, setPayAmt] = useState<Record<string, string>>({});
  const [payNote, setPayNote] = useState<Record<string, string>>({});
  const [openHist, setOpenHist] = useState<Record<string, boolean>>({});
  const [ready, setReady] = useState(false);

  async function load() {
    const { data } = await supabase.auth.getSession();
    if (!data.session) return router.push("/login");
    const [c, t, po, st, su] = await Promise.all([
      supabase.from("cycle_status").select("*").order("created_at", { ascending: false }),
      supabase.from("teacher_balance").select("*").order("name"),
      supabase.from("teacher_payouts").select("*").order("paid_on", { ascending: false }),
      supabase.from("students").select("id, name"),
      supabase.from("subjects").select("id, name, level"),
    ]);
    setCycles(c.data ?? []);
    setTeachers(t.data ?? []);
    setPayouts(po.data ?? []);
    setStudents(st.data ?? []);
    setSubjects(su.data ?? []);
    setReady(true);
  }
  useEffect(() => { load(); }, []);

  async function payTeacher(teacherId: string) {
    const a = Number(payAmt[teacherId]);
    if (!a || a <= 0) return alert("Enter an amount");
    const { error } = await supabase.from("teacher_payouts").insert({
      teacher_id: teacherId,
      amount: a,
      paid_on: localDate(),
      note: payNote[teacherId] || null,
    });
    if (error) return alert(error.message);
    setPayAmt({ ...payAmt, [teacherId]: "" });
    setPayNote({ ...payNote, [teacherId]: "" });
    load();
  }

  async function deletePayout(id: string) {
    if (!confirm("Delete this payout?")) return;
    const { error } = await supabase.from("teacher_payouts").delete().eq("id", id);
    if (error) return alert(error.message);
    load();
  }

  const sum = (arr: any[], k: string) => arr.reduce((s, x) => s + Number(x[k]), 0);
  const totalFees = sum(cycles, "fee");
  const collected = sum(cycles, "paid");
  const stillOwed = sum(cycles, "remaining");
  const teacherOwed = sum(teachers, "owed");
  const teacherPaid = sum(teachers, "paid_out");
  const net = collected - teacherPaid;
  const expectedNet = totalFees - teacherOwed;

  const latest = new Map<string, any>();
  cycles.forEach((c) => { if (!latest.has(c.enrollment_id)) latest.set(c.enrollment_id, c); });
  const renew = Array.from(latest.values()).filter((c) => c.month_finished);
  const unpaid = cycles.filter((c) => Number(c.remaining) > 0);

  const nameOf = (id: string) => students.find((s) => s.id === id)?.name ?? "?";
  const subjOf = (id: string) => {
    const s = subjects.find((x) => x.id === id);
    return s ? `${s.name}${s.level ? ` · ${s.level}` : ""}` : "";
  };

  return (
    <main className={ui.page}>
      <div>
        <p className={ui.muted}>Cashflow & Payroll</p>
        <h1 className={ui.title}>Money</h1>
      </div>

      {!ready ? (
        <p className={ui.muted}>Loading...</p>
      ) : (
        <>
          {/* Emerald Hero */}
          <div className="rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-900 p-5 text-white shadow-md">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-100">NET BALANCE NOW</span>
            <p className="font-display text-[32px] font-extrabold tracking-tight mt-1 tabular-nums">{money(net)}</p>
            <div className="grid grid-cols-3 gap-2 mt-4 pt-3.5 border-t border-white/15">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-emerald-200 block">Collected</span>
                <span className="font-display text-[13px] font-bold tabular-nums">{money(collected)}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-emerald-200 block">Still Owed</span>
                <span className="font-display text-[13px] font-bold tabular-nums text-amber-200">{money(stillOwed)}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-emerald-200 block">Teachers Paid</span>
                <span className="font-display text-[13px] font-bold tabular-nums">{money(teacherPaid)}</span>
              </div>
            </div>
            <p className="mt-3 text-[11px] text-emerald-100">Expected when everyone pays: {money(expectedNet)}</p>
          </div>

          {/* Renewals */}
          <section className="space-y-2">
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1.5 px-0.5">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              Renewals Due ({renew.length})
            </h2>
            {renew.length === 0 && <p className={ui.muted}>No finished months.</p>}
            {renew.map((c) => (
              <Link key={c.id} href={`/students/${c.student_id}`}
                className="block rounded-2xl border border-amber-200 bg-amber-50 p-3.5 spring-press">
                <p className="font-display font-bold text-slate-900">{nameOf(c.student_id)}</p>
                <p className="text-[12px] text-amber-900 mt-0.5">
                  {subjOf(c.subject_id)} · left {money(c.remaining)}
                </p>
              </Link>
            ))}
          </section>

          {/* Unpaid */}
          <section className="space-y-2">
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-0.5">
              Pending Student Payments ({unpaid.length})
            </h2>
            {unpaid.length === 0 ? (
              <p className={ui.muted}>Nothing unpaid.</p>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200/90 divide-y divide-slate-100 overflow-hidden">
                {unpaid.map((c) => (
                  <Link key={c.id} href={`/students/${c.student_id}`}
                    className="flex items-center justify-between gap-2 px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate font-display font-bold text-slate-900">{nameOf(c.student_id)}</p>
                      <p className="truncate text-[11px] text-slate-500">{subjOf(c.subject_id)}</p>
                    </div>
                    <span className="shrink-0 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 text-[11px] font-bold tabular-nums">
                      {money(c.remaining)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Teachers */}
          <section className="space-y-2">
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-0.5">Teachers</h2>
            {teachers.map((t) => {
              const bal = Number(t.owed) - Number(t.paid_out);
              const hist = payouts.filter((p) => p.teacher_id === t.teacher_id);
              return (
                <div key={t.teacher_id} className={`${ui.card} space-y-3`}>
                  <div className="flex items-center justify-between">
                    <p className="font-display font-bold text-slate-900">{t.name}</p>
                    <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                      bal > 0 ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}>
                      {bal > 0 ? `${money(bal)} to pay` : "Settled"}
                    </span>
                  </div>
                  <p className={ui.muted}>Earned {money(t.owed)} · Paid {money(t.paid_out)}</p>

                  <div className="space-y-2">
                    <input className={ui.input} type="number" placeholder="Amount paid (DA)"
                      value={payAmt[t.teacher_id] ?? ""}
                      onChange={(e) => setPayAmt({ ...payAmt, [t.teacher_id]: e.target.value })} />
                    <input className={ui.input} placeholder="Note (optional)"
                      value={payNote[t.teacher_id] ?? ""}
                      onChange={(e) => setPayNote({ ...payNote, [t.teacher_id]: e.target.value })} />
                    <button onClick={() => payTeacher(t.teacher_id)} className={ui.btn}>
                      Pay teacher
                    </button>
                  </div>

                  <button onClick={() => setOpenHist({ ...openHist, [t.teacher_id]: !openHist[t.teacher_id] })}
                    className={ui.link}>
                    {openHist[t.teacher_id] ? "Hide" : "Show"} payout history ({hist.length})
                  </button>

                  {openHist[t.teacher_id] && (
                    <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 px-3">
                      {hist.length === 0 && <li className="py-2 text-[12px] text-slate-500">No payouts yet.</li>}
                      {hist.map((p) => (
                        <li key={p.id} className="flex items-center justify-between gap-2 py-2">
                          <div className="min-w-0">
                            <p className="font-semibold tabular-nums text-slate-900">{money(p.amount)}</p>
                            <p className="truncate text-[11px] text-slate-500">
                              {p.paid_on}{p.note ? ` · ${p.note}` : ""}
                            </p>
                          </div>
                          <button onClick={() => deletePayout(p.id)}
                            className="text-[12px] font-semibold text-rose-600">Delete</button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </section>
        </>
      )}
    </main>
  );
}