"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { ui } from "@/components/ui";

const money = (n: number) => Number(n).toLocaleString() + " DA";
const localDate = (d = new Date()) =>
  new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

function CycleCard({ e, cycles, reload }: { e: any; cycles: any[]; reload: () => void }) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const c = cycles[0];
  const [cycleNote, setCycleNote] = useState(c?.notes ?? "");
  const oldDebt = cycles.slice(1).reduce((s, x) => s + Number(x.remaining), 0);
  const sub = e.subjects;

  async function addPayment() {
    const a = Number(amount);
    if (!a || a <= 0) return alert("Enter an amount");
    if (a > Number(c.remaining) && !confirm("More than the remaining amount. Continue?")) return;
    const { error } = await supabase.from("payments").insert({
      cycle_id: c.id,
      amount: a,
      note: note || null,
    });
    if (error) return alert(error.message);
    setAmount("");
    setNote("");
    reload();
  }

  async function addSession() {
    if (c.sessions_done >= c.sessions_total) return;
    const { error } = await supabase.from("attendance").insert({ cycle_id: c.id, date: localDate() });
    if (error) return alert(error.code === "23505" ? "Already marked today" : error.message);
    reload();
  }

  async function removeSession() {
    const { data } = await supabase
      .from("attendance")
      .select("id")
      .eq("cycle_id", c.id)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1);
    if (!data || data.length === 0) return;
    await supabase.from("attendance").delete().eq("id", data[0].id);
    reload();
  }

  async function saveNote() {
    await supabase.from("cycles").update({ notes: cycleNote || null }).eq("id", c.id);
  }

  async function newMonth() {
    const share = (Number(e.monthly_fee) * Number(sub.teacher_share_percent)) / 100;
    const { error } = await supabase.from("cycles").insert({
      enrollment_id: e.id,
      fee: e.monthly_fee,
      teacher_share: share,
    });
    if (error) return alert(error.message);
    reload();
  }

  return (
    <section className={`${ui.card} space-y-4`}>
      <div>
        <h2 className="text-lg font-semibold">
          {sub.name}
          {sub.level ? ` · ${sub.level}` : ""}
        </h2>
        <p className={ui.muted}>
          {sub.teachers?.name} · {money(e.monthly_fee)} per month
        </p>
      </div>

      {!c ? (
        <button onClick={newMonth} className={ui.btn}>
          Start first month
        </button>
      ) : (
        <>
          <div className="grid grid-cols-3 divide-x divide-gray-200 rounded-xl bg-gray-50 py-3 text-center">
            <div>
              <p className={ui.label}>Fee</p>
              <p className="font-semibold">{money(c.fee)}</p>
            </div>
            <div>
              <p className={ui.label}>Paid</p>
              <p className="font-semibold text-teal-700">{money(c.paid)}</p>
            </div>
            <div>
              <p className={ui.label}>Left</p>
              <p className={`font-semibold ${Number(c.remaining) > 0 ? "text-red-600" : "text-gray-900"}`}>
                {money(c.remaining)}
              </p>
            </div>
          </div>

          {oldDebt > 0 && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
              Unpaid from previous months: {money(oldDebt)}
            </p>
          )}

          <div className="flex items-center justify-between">
            <div>
              <p className={ui.label}>Sessions</p>
              <div className="mt-1 flex items-center gap-2">
                <div className="flex gap-1.5">
                  {Array.from({ length: c.sessions_total }).map((_, i) => (
                    <span
                      key={i}
                      className={`h-3 w-3 rounded-full ${i < c.sessions_done ? "bg-teal-700" : "bg-gray-300"}`}
                    />
                  ))}
                </div>
                <span className="text-sm font-medium">
                  {c.sessions_done}/{c.sessions_total}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={removeSession} className={ui.btn2}>
                Undo
              </button>
              <button onClick={addSession} className="rounded-xl bg-teal-700 px-4 py-2 font-medium text-white">
                Add session
              </button>
            </div>
          </div>

          {c.month_finished && (
            <div className="space-y-2 rounded-xl bg-amber-50 p-3">
              <p className="text-sm font-medium text-amber-900">Month finished. Payment is due again.</p>
              <button onClick={newMonth} className={ui.btn}>
                Start new month
              </button>
            </div>
          )}

          <div className="space-y-2">
            <p className={ui.label}>Add payment</p>
            <input
              className={ui.input}
              type="number"
              placeholder="Amount (DA)"
              value={amount}
              onChange={(x) => setAmount(x.target.value)}
            />
            <input
              className={ui.input}
              placeholder="Note (optional)"
              value={note}
              onChange={(x) => setNote(x.target.value)}
            />
            <button onClick={addPayment} className={ui.btn}>
              Save payment
            </button>
          </div>

          <div className="space-y-2">
            <p className={ui.label}>Notes for this month</p>
            <textarea
              className={ui.input}
              rows={2}
              placeholder="Write a note"
              value={cycleNote}
              onChange={(x) => setCycleNote(x.target.value)}
              onBlur={saveNote}
            />
          </div>
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
      .order("created_at", { ascending: false });
    setStudent(s.data);
    setNotes(s.data?.notes ?? "");
    setEnrollments(e.data ?? []);
    setCycles(c.data ?? []);
  }
  useEffect(() => {
    load();
  }, [id]);

  async function saveNotes() {
    await supabase.from("students").update({ notes: notes || null }).eq("id", id);
  }

  if (!student) return <main className={ui.page}>Loading...</main>;

  return (
    <main className={ui.page}>
      <Link href="/students" className={ui.link}>
        Back to students
      </Link>

      <div className={`${ui.card} space-y-3`}>
        <h1 className="text-xl font-semibold">{student.name}</h1>
        {student.phone && (
          <a href={`tel:${student.phone}`} className={ui.link}>
            {student.phone}
          </a>
        )}
        <textarea
          className={ui.input}
          rows={2}
          placeholder="Notes about this student"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={saveNotes}
        />
      </div>

      {enrollments.length === 0 && <p className={ui.muted}>Not enrolled in any subject yet.</p>}
      {enrollments.map((e) => (
        <CycleCard key={e.id} e={e} cycles={cycles.filter((c) => c.enrollment_id === e.id)} reload={load} />
      ))}
    </main>
  );
}