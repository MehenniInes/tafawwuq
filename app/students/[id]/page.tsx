"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const money = (n: number) => Number(n).toLocaleString() + " DA";

function CycleCard({ e, cycles, reload }: { e: any; cycles: any[]; reload: () => void }) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const c = cycles[0]; // latest cycle
  const [cycleNote, setCycleNote] = useState(c?.notes ?? "");
  const oldDebt = cycles.slice(1).reduce((s, x) => s + Number(x.remaining), 0);
  const sub = e.subjects;

  async function addPayment() {
    const a = Number(amount);
    if (!a || a <= 0) return alert("Enter an amount");
    if (a > Number(c.remaining) && !confirm("More than the remaining amount. Continue?")) return;
    const { error } = await supabase.from("payments").insert({
      cycle_id: c.id, amount: a, note: note || null,
    });
    if (error) return alert(error.message);
    setAmount(""); setNote(""); reload();
  }

  async function setSessions(n: number) {
    if (n < 0 || n > c.sessions_total) return;
    const { error } = await supabase.from("cycles").update({ sessions_done: n }).eq("id", c.id);
    if (error) return alert(error.message);
    reload();
  }

  async function saveNote() {
    await supabase.from("cycles").update({ notes: cycleNote || null }).eq("id", c.id);
  }

  async function newMonth() {
    const share = (Number(e.monthly_fee) * Number(sub.teacher_share_percent)) / 100;
    const { error } = await supabase.from("cycles").insert({
      enrollment_id: e.id, fee: e.monthly_fee, teacher_share: share,
    });
    if (error) return alert(error.message);
    reload();
  }

  const input = "w-full border rounded p-2";
  return (
    <section className="border rounded p-3 space-y-3">
      <div>
        <h2 className="font-bold">
          {sub.name}{sub.level ? ` · ${sub.level}` : ""}
        </h2>
        <p className="text-sm text-gray-600">{sub.teachers?.name} — {money(e.monthly_fee)}/month</p>
      </div>

      {!c ? (
        <button onClick={newMonth} className="w-full bg-black text-white rounded p-2">Start first month</button>
      ) : (
        <>
          <div className="grid grid-cols-3 text-center">
            <div><p className="text-xs">Fee</p><p className="font-bold">{money(c.fee)}</p></div>
            <div><p className="text-xs">Paid</p><p className="font-bold text-green-700">{money(c.paid)}</p></div>
            <div><p className="text-xs">Left</p><p className="font-bold text-red-600">{money(c.remaining)}</p></div>
          </div>

          {oldDebt > 0 && (
            <p className="text-sm text-red-600">Unpaid from previous months: {money(oldDebt)}</p>
          )}

          <div className="flex items-center justify-between">
            <span>Sessions: <b>{c.sessions_done}/{c.sessions_total}</b></span>
            <div className="flex gap-2">
              <button onClick={() => setSessions(c.sessions_done - 1)} className="border rounded px-4 py-2">−</button>
              <button onClick={() => setSessions(c.sessions_done + 1)} className="bg-black text-white rounded px-4 py-2">+1</button>
            </div>
          </div>

          {c.month_finished && (
            <div className="bg-yellow-100 rounded p-2 space-y-2">
              <p className="text-sm">Month finished — payment due again.</p>
              <button onClick={newMonth} className="w-full bg-black text-white rounded p-2">
                Start new month
              </button>
            </div>
          )}

          <div className="space-y-2">
            <input className={input} type="number" placeholder="Amount paid (DA)" value={amount} onChange={(x) => setAmount(x.target.value)} />
            <input className={input} placeholder="Payment note (optional)" value={note} onChange={(x) => setNote(x.target.value)} />
            <button onClick={addPayment} className="w-full bg-green-700 text-white rounded p-2">Add payment</button>
          </div>

          <textarea
            className={input}
            placeholder="Notes for this month"
            value={cycleNote}
            onChange={(x) => setCycleNote(x.target.value)}
            onBlur={saveNote}
          />
        </>
      )}
    </section>
  );
}

export default function StudentPage() {
  const { id } = useParams<{ id: string }>();
  const [student, setStudent] = useState<any>(null);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [cycles, setCycles] = useState<any[]>([]);
  const [notes, setNotes] = useState("");

  async function load() {
    const s = await supabase.from("students").select("*").eq("id", id).single();
    const e = await supabase
      .from("enrollments")
      .select("*, subjects(name, level, teacher_share_percent, teachers(name))")
      .eq("student_id", id);
    const c = await supabase
      .from("cycle_status")
      .select("*")
      .eq("student_id", id)
      .order("start_date", { ascending: false })
      .order("id", { ascending: false });
    setStudent(s.data);
    setNotes(s.data?.notes ?? "");
    setEnrollments(e.data ?? []);
    setCycles(c.data ?? []);
  }
  useEffect(() => { load(); }, [id]);

  async function saveNotes() {
    await supabase.from("students").update({ notes: notes || null }).eq("id", id);
  }

  if (!student) return <main className="p-4">Loading...</main>;

  return (
    <main className="p-4 max-w-lg mx-auto space-y-4">
      <Link href="/students" className="underline">← Students</Link>
      <h1 className="text-xl font-bold">{student.name}</h1>
      {student.phone && <a href={`tel:${student.phone}`} className="underline">{student.phone}</a>}

      <textarea
        className="w-full border rounded p-2"
        placeholder="Notes about this student"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={saveNotes}
      />

      {enrollments.length === 0 && <p>Not enrolled in any subject yet.</p>}
      {enrollments.map((e) => (
        <CycleCard
          key={e.id}
          e={e}
          cycles={cycles.filter((c) => c.enrollment_id === e.id)}
          reload={load}
        />
      ))}
    </main>
  );
}