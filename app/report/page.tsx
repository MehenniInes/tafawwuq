"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { ui } from "@/components/ui";

const money = (n: number) => Number(n).toLocaleString() + " DA";

const pad = (n: number) => String(n).padStart(2, "0");
const thisMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
};
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
    setAllCycles(cy.data ?? []);
    setPayments(pay.data ?? []);
    setPayouts(out.data ?? []);
    setStudents(st.data ?? []);
    setSubjects(su.data ?? []);
    setTeachers(te.data ?? []);
    setReady(true);
  }

  useEffect(() => {
    setMonth(thisMonth());
  }, []);

  useEffect(() => {
    if (month) load(month);
  }, [month]);

  if (!month) {
    return (
      <main className={ui.page}>
        <p className={ui.muted}>Loading...</p>
      </main>
    );
  }

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
      <h1 className={ui.title}>Monthly report</h1>

      <div className="flex items-center gap-2">
        <button onClick={() => setMonth(shift(month, -1))} className={ui.btn2}>
          Prev
        </button>
        <p className="flex-1 text-center font-semibold">{label(month)}</p>
        <button onClick={() => setMonth(shift(month, 1))} className={ui.btn2}>
          Next
        </button>
      </div>

      {!ready ? (
        <p className={ui.muted}>Loading...</p>
      ) : (
        <>
          <div className="rounded-2xl bg-teal-700 p-5 text-white">
            <p className="text-xs font-medium uppercase tracking-wide opacity-80">Net this month</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums">{money(net)}</p>
            <p className="mt-2 text-sm opacity-80">
              Collected {money(collected)} minus paid to teachers {money(paidOut)}
            </p>
          </div>

          <section className={`${ui.card} space-y-3`}>
            <p className={ui.label}>Months started in {label(month)}</p>
            <div className="flex justify-between">
              <span>Fees billed</span>
              <b className="tabular-nums">{money(billed)}</b>
            </div>
            <div className="flex justify-between">
              <span>Teacher shares earned</span>
              <b className="tabular-nums">{money(shares)}</b>
            </div>
            <div className="flex justify-between border-t border-gray-100 pt-3">
              <span>Expected net</span>
              <b className="tabular-nums">{money(expectedNet)}</b>
            </div>
            <div className="flex justify-between">
              <span>Still not collected</span>
              <b className="tabular-nums text-red-600">{money(notCollected)}</b>
            </div>
          </section>

          <section className="space-y-2">
            <p className={ui.label}>Teachers</p>
            {teacherRows.map((t) => (
              <div key={t.id} className={`${ui.card} !p-3`}>
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{t.name}</p>
                  <span className={`text-sm font-medium ${t.diff > 0 ? "text-red-600" : "text-teal-700"}`}>
                    {t.diff > 0 ? `${money(t.diff)} not paid yet` : "Paid in full"}
                  </span>
                </div>
                <p className={ui.muted}>
                  Earned {money(t.earned)} · Paid {money(t.paid)}
                </p>
              </div>
            ))}
          </section>

          <section className="space-y-2">
            <p className={ui.label}>Payments received ({payments.length})</p>
            {payments.length === 0 && <p className={ui.muted}>No payments this month.</p>}
            {payments.map((p) => {
              const c = cycleOf(p.cycle_id);
              return (
                <Link
                  key={p.id}
                  href={c ? `/students/${c.student_id}` : "/students"}
                  className={`${ui.card} flex items-center justify-between gap-2 !p-3`}
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{c ? nameOf(c.student_id) : "?"}</p>
                    <p className="truncate text-xs text-gray-500">
                      {p.paid_on}
                      {c ? ` · ${subjOf(c.subject_id)}` : ""}
                      {p.note ? ` · ${p.note}` : ""}
                    </p>
                  </div>
                  <span className="shrink-0 font-semibold tabular-nums text-teal-700">{money(p.amount)}</span>
                </Link>
              );
            })}
          </section>
        </>
      )}
    </main>
  );
}