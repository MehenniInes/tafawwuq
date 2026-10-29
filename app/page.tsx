"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { ui } from "@/components/ui";

const money = (n: number) => Number(n).toLocaleString() + " DA";

export default function Home() {
  const router = useRouter();
  const [cycles, setCycles] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [payAmt, setPayAmt] = useState<Record<string, string>>({});
  const [ready, setReady] = useState(false);

  async function load() {
    const { data } = await supabase.auth.getSession();
    if (!data.session) return router.push("/login");
    const [c, t, st, su] = await Promise.all([
      supabase.from("cycle_status").select("*").order("created_at", { ascending: false }),
      supabase.from("teacher_balance").select("*").order("name"),
      supabase.from("students").select("id, name"),
      supabase.from("subjects").select("id, name, level"),
    ]);
    setCycles(c.data ?? []);
    setTeachers(t.data ?? []);
    setStudents(st.data ?? []);
    setSubjects(su.data ?? []);
    setReady(true);
  }
  useEffect(() => {
    load();
  }, []);

  async function payTeacher(teacherId: string) {
    const a = Number(payAmt[teacherId]);
    if (!a || a <= 0) return alert("Enter an amount");
    const { error } = await supabase.from("teacher_payouts").insert({ teacher_id: teacherId, amount: a });
    if (error) return alert(error.message);
    setPayAmt({ ...payAmt, [teacherId]: "" });
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
  cycles.forEach((c) => {
    if (!latest.has(c.enrollment_id)) latest.set(c.enrollment_id, c);
  });
  const renew = Array.from(latest.values()).filter((c) => c.month_finished);
  const unpaid = cycles.filter((c) => Number(c.remaining) > 0);

  const nameOf = (id: string) => students.find((s) => s.id === id)?.name ?? "?";
  const subjOf = (id: string) => {
    const s = subjects.find((x) => x.id === id);
    return s ? `${s.name}${s.level ? ` · ${s.level}` : ""}` : "";
  };

  return (
    <main className={ui.page}>
      <h1 className={ui.title}>Money</h1>

      {!ready ? (
        <p className={ui.muted}>Loading...</p>
      ) : (
        <>
          <div className="rounded-2xl bg-teal-700 p-5 text-white">
            <p className="text-xs font-medium uppercase tracking-wide opacity-80">Net now</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums">{money(net)}</p>
            <p className="mt-2 text-sm opacity-80">Expected when everyone pays: {money(expectedNet)}</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className={ui.card}>
              <p className={ui.label}>Collected</p>
              <p className="mt-1 font-semibold tabular-nums">{money(collected)}</p>
            </div>
            <div className={ui.card}>
              <p className={ui.label}>Still owed</p>
              <p className="mt-1 font-semibold tabular-nums text-red-600">{money(stillOwed)}</p>
            </div>
            <div className={ui.card}>
              <p className={ui.label}>To teachers</p>
              <p className="mt-1 font-semibold tabular-nums">{money(teacherPaid)}</p>
            </div>
          </div>

          <section className="space-y-2">
            <p className={ui.label}>Renew now ({renew.length})</p>
            {renew.length === 0 && <p className={ui.muted}>No finished months.</p>}
            {renew.map((c) => (
              <Link
                key={c.id}
                href={`/students/${c.student_id}`}
                className="block rounded-2xl border border-amber-300 bg-amber-50 p-3"
              >
                <p className="font-semibold">{nameOf(c.student_id)}</p>
                <p className="text-sm text-gray-600">
                  {subjOf(c.subject_id)} · left {money(c.remaining)}
                </p>
              </Link>
            ))}
          </section>

          <section className="space-y-2">
            <p className={ui.label}>Unpaid ({unpaid.length})</p>
            {unpaid.length === 0 && <p className={ui.muted}>Nothing unpaid.</p>}
            {unpaid.map((c) => (
              <Link
                key={c.id}
                href={`/students/${c.student_id}`}
                className={`${ui.card} flex items-center justify-between gap-2 !p-3`}
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{nameOf(c.student_id)}</p>
                  <p className="truncate text-sm text-gray-500">{subjOf(c.subject_id)}</p>
                </div>
                <span className="shrink-0 font-semibold tabular-nums text-red-600">{money(c.remaining)}</span>
              </Link>
            ))}
          </section>

          <section className="space-y-2">
            <p className={ui.label}>Teachers</p>
            {teachers.map((t) => {
              const bal = Number(t.owed) - Number(t.paid_out);
              return (
                <div key={t.teacher_id} className={`${ui.card} space-y-3`}>
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{t.name}</p>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        bal > 0 ? "bg-red-50 text-red-700" : "bg-teal-50 text-teal-700"
                      }`}
                    >
                      {bal > 0 ? `${money(bal)} to pay` : "Settled"}
                    </span>
                  </div>
                  <p className={ui.muted}>
                    Earned {money(t.owed)} · Paid {money(t.paid_out)}
                  </p>
                  <div className="flex gap-2">
                    <input
                      className={ui.input}
                      type="number"
                      placeholder="Amount paid (DA)"
                      value={payAmt[t.teacher_id] ?? ""}
                      onChange={(e) => setPayAmt({ ...payAmt, [t.teacher_id]: e.target.value })}
                    />
                    <button onClick={() => payTeacher(t.teacher_id)} className="rounded-xl bg-teal-700 px-5 font-medium text-white">
                      Pay
                    </button>
                  </div>
                </div>
              );
            })}
          </section>
        </>
      )}
    </main>
  );
}