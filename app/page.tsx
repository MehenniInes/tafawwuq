"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

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
  useEffect(() => { load(); }, []);

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

  // latest cycle per enrollment (cycles are sorted newest first)
  const latest = new Map<string, any>();
  cycles.forEach((c) => { if (!latest.has(c.enrollment_id)) latest.set(c.enrollment_id, c); });
  const latestList = Array.from(latest.values());

  const nameOf = (id: string) => students.find((s) => s.id === id)?.name ?? "?";
  const subjOf = (id: string) => {
    const s = subjects.find((x) => x.id === id);
    return s ? `${s.name}${s.level ? ` · ${s.level}` : ""}` : "";
  };

  const renew = latestList.filter((c) => c.month_finished);
  const unpaid = cycles.filter((c) => Number(c.remaining) > 0);

  const card = "border rounded p-3 text-center";
  return (
    <main className="p-4 max-w-lg mx-auto space-y-5">
      <h1 className="text-xl font-bold">تفوق — Dashboard</h1>

      {!ready ? <p>Loading...</p> : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className={card}><p className="text-xs">Collected</p><p className="font-bold text-green-700">{money(collected)}</p></div>
            <div className={card}><p className="text-xs">Still owed to you</p><p className="font-bold text-red-600">{money(stillOwed)}</p></div>
            <div className={card}><p className="text-xs">Paid to teachers</p><p className="font-bold">{money(teacherPaid)}</p></div>
            <div className={card}>
              <p className="text-xs">Net now</p>
              <p className={`font-bold ${net < 0 ? "text-red-600" : "text-green-700"}`}>{money(net)}</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 text-center">
            Expected net when everyone pays: <b>{money(expectedNet)}</b>
          </p>

          <section className="space-y-2">
            <h2 className="font-bold">Renew now ({renew.length})</h2>
            {renew.length === 0 && <p className="text-sm text-gray-500">No finished months.</p>}
            {renew.map((c) => (
              <Link key={c.id} href={`/students/${c.student_id}`} className="block border rounded p-2 bg-yellow-50">
                <b>{nameOf(c.student_id)}</b> — {subjOf(c.subject_id)}
                <span className="block text-sm">Month finished · left {money(c.remaining)}</span>
              </Link>
            ))}
          </section>

          <section className="space-y-2">
            <h2 className="font-bold">Unpaid ({unpaid.length})</h2>
            {unpaid.length === 0 && <p className="text-sm text-gray-500">Nothing unpaid.</p>}
            {unpaid.map((c) => (
              <Link key={c.id} href={`/students/${c.student_id}`} className="flex justify-between border rounded p-2">
                <span><b>{nameOf(c.student_id)}</b> — {subjOf(c.subject_id)}</span>
                <span className="text-red-600">{money(c.remaining)}</span>
              </Link>
            ))}
          </section>

          <section className="space-y-2">
            <h2 className="font-bold">Teachers</h2>
            {teachers.map((t) => {
              const bal = Number(t.owed) - Number(t.paid_out);
              return (
                <div key={t.teacher_id} className="border rounded p-3 space-y-2">
                  <div className="flex justify-between">
                    <b>{t.name}</b>
                    <span className={bal > 0 ? "text-red-600 font-bold" : "text-green-700 font-bold"}>
                      {bal > 0 ? `${money(bal)} to pay` : "settled"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">Earned {money(t.owed)} · Paid {money(t.paid_out)}</p>
                  <div className="flex gap-2">
                    <input
                      className="flex-1 border rounded p-2" type="number" placeholder="Amount paid (DA)"
                      value={payAmt[t.teacher_id] ?? ""}
                      onChange={(e) => setPayAmt({ ...payAmt, [t.teacher_id]: e.target.value })}
                    />
                    <button onClick={() => payTeacher(t.teacher_id)} className="bg-black text-white rounded px-4">Pay</button>
                  </div>
                </div>
              );
            })}
          </section>

          <nav className="flex flex-col gap-3">
            <Link href="/students" className="border rounded p-3 text-center">Students</Link>
            <Link href="/setup" className="border rounded p-3 text-center">Teachers & subjects</Link>
          </nav>
        </>
      )}
    </main>
  );
}