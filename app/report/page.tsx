"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { ui } from "@/components/ui";

const money = (n: number) => Number(n).toLocaleString() + " DA";
const pad = (n: number) => String(n).padStart(2, "0");
const thisMonth = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`; };
const shift = (m: string, delta: number) => {
  const [y, mo] = m.split("-").map(Number);
  const d = new Date(y, mo - 1 + delta, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
};
const bounds = (m: string) => ({ start: `${m}-01`, end: `${shift(m, 1)}-01` });
const label = (m: string) => {
  const [y, mo] = m.split("-").map(Number);
  return new Date(y, mo - 1, 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
};

export default function Report() {
  const router = useRouter();
  const [month, setMonth] = useState("");
  const [allCycles, setAllCycles] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [ready, setReady] = useState(false);

  async function load(m: string) {
    const { data } = await supabase.auth.getSession();
    if (!data.session) return router.push("/login");
    const { start, end } = bounds(m);
    const [cy, pay, out, st, su, te] = await Promise.all([
      supabase.from("cycle_status").select("id, student_id, subject_id, start_date, fee, teacher_share, remaining"),
      supabase.from("payments").select("*").gte("paid_on", start).lt("paid_on", end).order("paid_on", { ascending: false }),
      supabase.from("teacher_payouts").select("*").gte("paid_on", start).lt("paid_on", end),
      supabase.from("students").select("id, name"),
      supabase.from("subjects").select("id, name, level, teacher_id"),
      supabase.from("teachers").select("id, name").order("name"),
    ]);
    setAllCycles(cy.data ?? []); setPayments(pay.data ?? []); setPayouts(out.data ?? []);
    setStudents(st.data ?? []); setSubjects(su.data ?? []); setTeachers(te.data ?? []);
    setReady(true);
  }

  useEffect(() => { setMonth(thisMonth()); }, []);
  useEffect(() => { if (month) load(month); }, [month]);

  if (!month) return <main className={ui.page}><p className={ui.muted}>Loading...</p></main>;

  const { start, end } = bounds(month);
  const monthCycles = allCycles.filter((c) => c.start_date >= start && c.start_date < end);
  const sum = (arr: any[], k: string) => arr.reduce((s, x) => s + Number(x[k]), 0);

  const collected = sum(payments, "amount");
  const paidOut = sum(payouts, "amount");
  const net = collected - paidOut;
  const billed = sum(monthCycles, "fee");
  const shares = sum(monthCycles, "teacher_share");
  const expectedNet = billed - shares;
  const notCollected = sum(monthCycles, "remaining");

  const nameOf = (id: string) => students.find((s) => s.id === id)?.name ?? "?";
  const subjOf = (id: string) => {
    const s = subjects.find((x) => x.id === id);
    return s ? `${s.name}${s.level ? ` · ${s.level}` : ""}` : "";
  };
  const cycleOf = (cid: string) => allCycles.find((c) => c.id === cid);

  const teacherRows = teachers.map((t) => {
    const subjIds = new Set(subjects.filter((s) => s.teacher_id === t.id).map((s) => s.id));
    const earned = sum(monthCycles.filter((c) => subjIds.has(c.subject_id)), "teacher_share");
    const paid = sum(payouts.filter((p) => p.teacher_id === t.id), "amount");
    return { ...t, earned, paid, diff: earned - paid };
  });

  return (
    <main className={ui.page}>
      <div>
        <p className={ui.muted}>Center Analytics</p>
        <h1 className={ui.title}>Reports</h1>
      </div>

      <div className="bg-white border border-slate-200 rounded-full p-1 flex items-center justify-between shadow-2xs">
        <button onClick={() => setMonth(shift(month, -1))} aria-label="Prev"
          className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-700 spring-press">‹</button>
        <span className="font-display text-[14px] font-bold text-slate-900">{label(month)}</span>
        <button onClick={() => setMonth(shift(month, 1))} aria-label="Next"
          className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-700 spring-press">›</button>
      </div>

      {!ready ? (
        <p className={ui.muted}>Loading...</p>
      ) : (
        <>
          <div className="rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-slate-900 p-5 text-white shadow-md">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-200">NET THIS MONTH</span>
            <p className="font-display text-[30px] font-extrabold tracking-tight mt-1 tabular-nums">{money(net)}</p>
            <p className="text-[12px] text-indigo-200 mt-0.5">
              Collected {money(collected)} minus paid to teachers {money(paidOut)}
            </p>
          </div>

          <section className={`${ui.card} space-y-2.5`}>
            <p className={ui.label}>Months started in {label(month)}</p>
            <div className="flex justify-between text-[13px]"><span className="text-slate-600">Fees billed</span><b className="tabular-nums">{money(billed)}</b></div>
            <div className="flex justify-between text-[13px]"><span className="text-slate-600">Teacher shares</span><b className="tabular-nums">{money(shares)}</b></div>
            <div className="flex justify-between text-[13px] border-t border-slate-100 pt-2.5"><span className="text-slate-600">Expected net</span><b className="tabular-nums">{money(expectedNet)}</b></div>
            <div className="flex justify-between text-[13px]"><span className="text-slate-600">Not collected</span><b className="tabular-nums text-rose-600">{money(notCollected)}</b></div>
          </section>

          <section className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-0.5">Teachers</p>
            {teacherRows.map((t) => (
              <div key={t.id} className={`${ui.card} !p-3`}>
                <div className="flex items-center justify-between">
                  <p className="font-display font-bold text-slate-900">{t.name}</p>
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                    t.diff > 0 ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}>
                    {t.diff > 0 ? `${money(t.diff)} unpaid` : "Paid in full"}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Earned {money(t.earned)} · Paid {money(t.paid)}</p>
              </div>
            ))}
          </section>

          <section className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-0.5">
              Payments Received ({payments.length})
            </p>
            {payments.length === 0 && <p className={ui.muted}>No payments this month.</p>}
            {payments.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200/90 divide-y divide-slate-100 overflow-hidden">
                {payments.map((p) => {
                  const c = cycleOf(p.cycle_id);
                  return (
                    <Link key={p.id} href={c ? `/students/${c.student_id}` : "/students"}
                      className="flex items-center justify-between gap-2 px-4 py-3">
                      <div className="min-w-0">
                        <p className="truncate font-display font-bold text-slate-900">{c ? nameOf(c.student_id) : "?"}</p>
                        <p className="truncate text-[11px] text-slate-500">
                          {p.paid_on}{c ? ` · ${subjOf(c.subject_id)}` : ""}{p.note ? ` · ${p.note}` : ""}
                        </p>
                      </div>
                      <span className="shrink-0 font-bold tabular-nums text-emerald-700">{money(p.amount)}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}