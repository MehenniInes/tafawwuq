"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { ui } from "@/components/ui";

const money = (n: number) => Number(n).toLocaleString() + " DA";
const localDate = (d = new Date()) =>
  new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

export default function Pay() {
  const router = useRouter();
  const [students, setStudents] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [cycles, setCycles] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [student, setStudent] = useState<any>(null);
  const [cycle, setCycle] = useState<any>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState<any>(null);

  async function load() {
    const { data } = await supabase.auth.getSession();
    if (!data.session) return router.push("/login");
    const [st, su, cy] = await Promise.all([
      supabase.from("students").select("id, name, phone").order("name"),
      supabase.from("subjects").select("id, name, level"),
      supabase
        .from("cycle_status")
        .select("id, enrollment_id, student_id, subject_id, fee, paid, remaining, created_at")
        .order("created_at", { ascending: false }),
    ]);
    setStudents(st.data ?? []);
    setSubjects(su.data ?? []);
    setCycles(cy.data ?? []);
  }
  useEffect(() => {
    load();
  }, []);

  const subjLabel = (id: string) => {
    const s = subjects.find((x) => x.id === id);
    return s ? `${s.name}${s.level ? ` · ${s.level}` : ""}` : "";
  };

  const owedBy = new Map<string, number>();
  cycles.forEach((c) => {
    if (Number(c.remaining) > 0) owedBy.set(c.student_id, (owedBy.get(c.student_id) ?? 0) + Number(c.remaining));
  });

  const latest = new Set<string>();
  const seen = new Set<string>();
  cycles.forEach((c) => {
    if (!seen.has(c.enrollment_id)) {
      seen.add(c.enrollment_id);
      latest.add(c.id);
    }
  });

  function pickCycle(c: any) {
    setCycle(c);
    setAmount(String(c.remaining));
    setNote("");
  }

  function pickStudent(s: any) {
    setStudent(s);
    const unpaid = cycles.filter((c) => c.student_id === s.id && Number(c.remaining) > 0);
    if (unpaid.length === 1) pickCycle(unpaid[0]);
    else {
      setCycle(null);
      setAmount("");
    }
  }

  function reset() {
    setStudent(null);
    setCycle(null);
    setAmount("");
    setNote("");
    setDone(null);
    setQ("");
  }

  async function save() {
    const a = Number(amount);
    if (!cycle || !a || a <= 0) return alert("Enter an amount");
    if (a > Number(cycle.remaining) && !confirm("More than what is left. Continue?")) return;
    setSaving(true);
    const { error } = await supabase.from("payments").insert({
      cycle_id: cycle.id,
      amount: a,
      paid_on: localDate(),
      note: note || null,
    });
    setSaving(false);
    if (error) return alert(error.message);
    setDone({
      student: student.name,
      subject: subjLabel(cycle.subject_id),
      amount: a,
      left: Number(cycle.remaining) - a,
    });
    load();
  }

  if (done) {
    return (
      <main className={ui.page}>
        <div className={`${ui.card} space-y-3 text-center !p-6`}>
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Payment saved</p>
          <p className="text-3xl font-bold tabular-nums text-navy">{money(done.amount)}</p>
          <p className="text-gray-600">
            {done.student} · {done.subject}
          </p>
          <p className={done.left > 0 ? "font-semibold text-red-600" : "font-semibold text-teal-700"}>
            {done.left > 0 ? `${money(done.left)} still left` : "Fully paid"}
          </p>
        </div>
        <button onClick={reset} className={ui.btn}>
          Record another payment
        </button>
        <Link href="/" className={`${ui.btn2} block text-center`}>
          Done
        </Link>
      </main>
    );
  }

  if (!student) {
    const list = students
      .filter((s) => s.name.toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => {
        const ao = owedBy.has(a.id) ? 0 : 1;
        const bo = owedBy.has(b.id) ? 0 : 1;
        return ao - bo || a.name.localeCompare(b.name);
      });
    return (
      <main className={ui.page}>
        <Link href="/" className={ui.link}>
          Back
        </Link>
        <h1 className={ui.title}>Record a payment</h1>
        <input
          autoFocus
          className={ui.input}
          placeholder="Search student name"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {list.map((s) => {
          const owes = owedBy.get(s.id) ?? 0;
          return (
            <button
              key={s.id}
              onClick={() => pickStudent(s)}
              className={`${ui.card} flex w-full items-center justify-between text-left active:bg-gray-50`}
            >
              <span className="font-semibold">{s.name}</span>
              <span className={`text-sm font-semibold ${owes > 0 ? "text-red-600" : "text-teal-700"}`}>
                {owes > 0 ? `Owes ${money(owes)}` : "Paid up"}
              </span>
            </button>
          );
        })}
      </main>
    );
  }

  const unpaid = cycles.filter((c) => c.student_id === student.id && Number(c.remaining) > 0);

  if (!cycle) {
    return (
      <main className={ui.page}>
        <button onClick={reset} className={ui.link}>
          Change student
        </button>
        <h1 className={ui.title}>{student.name}</h1>
        {unpaid.length === 0 ? (
          <div className={`${ui.card} text-center`}>
            <p className="font-semibold text-teal-700">Nothing to pay. This student is paid up.</p>
          </div>
        ) : (
          <>
            <p className={ui.muted}>Which group is this payment for?</p>
            {unpaid.map((c) => (
              <button
                key={c.id}
                onClick={() => pickCycle(c)}
                className={`${ui.card} flex w-full items-center justify-between text-left active:bg-gray-50`}
              >
                <span>
                  <span className="block font-semibold">{subjLabel(c.subject_id)}</span>
                  {!latest.has(c.id) && <span className="text-xs text-amber-800">Older month</span>}
                </span>
                <span className="font-semibold tabular-nums text-red-600">{money(c.remaining)} left</span>
              </button>
            ))}
          </>
        )}
      </main>
    );
  }

  const after = Number(cycle.remaining) - (Number(amount) || 0);

  return (
    <main className={ui.page}>
      <button onClick={reset} className={ui.link}>
        Change student
      </button>
      <div>
        <h1 className={ui.title}>{student.name}</h1>
        <p className={ui.muted}>
          {subjLabel(cycle.subject_id)} · {money(cycle.remaining)} left
        </p>
        {unpaid.length > 1 && (
          <button onClick={() => setCycle(null)} className={`${ui.link} mt-1`}>
            Pick a different group
          </button>
        )}
      </div>

      <div className={`${ui.card} space-y-3`}>
        <p className={ui.label}>Amount (DA)</p>
        <input
          autoFocus
          inputMode="numeric"
          type="number"
          className={`${ui.input} !text-2xl font-bold`}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => setAmount(String(cycle.remaining))} className={ui.btn2}>
            Full {money(cycle.remaining)}
          </button>
          <button onClick={() => setAmount(String(Math.round(Number(cycle.remaining) / 2)))} className={ui.btn2}>
            Half
          </button>
        </div>
        <input className={ui.input} placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
        <p className="text-sm text-gray-500">
          Left after this payment: <b>{money(Math.max(after, 0))}</b>
        </p>
      </div>

      <button onClick={save} disabled={saving || !Number(amount)} className={ui.btn}>
        {saving ? "Saving..." : `Save payment of ${money(Number(amount) || 0)}`}
      </button>
    </main>
  );
}