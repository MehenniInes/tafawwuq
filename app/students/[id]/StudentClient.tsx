"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { ui } from "@/components/ui";

const money = (n: number) => Number(n).toLocaleString() + " DA";
const localDate = (d = new Date()) =>
  new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

function CycleCard({
  e,
  cycles,
  payments,
  records,
  reload,
}: {
  e: any;
  cycles: any[];
  payments: any[];
  records: any[];
  reload: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [editingFee, setEditingFee] = useState(false);
  const [feeVal, setFeeVal] = useState(String(e.monthly_fee));
  const c = cycles[0];
  const [cycleNote, setCycleNote] = useState(c?.notes ?? "");
  const oldDebt = cycles.slice(1).reduce((s, x) => s + Number(x.remaining), 0);
  const sub = e.subjects;

  const rec = [...records].sort(
    (a, b) => a.date.localeCompare(b.date) || String(a.created_at ?? "").localeCompare(String(b.created_at ?? ""))
  );
  const presentN = rec.filter((r) => r.present).length;
  const absentN = rec.length - presentN;

  async function addPayment() {
    const a = Number(amount);
    if (!a || a <= 0) return alert("Enter an amount");
    if (a > Number(c.remaining) && !confirm("More than the remaining amount. Continue?")) return;
    const { error } = await supabase.from("payments").insert({
      cycle_id: c.id,
      amount: a,
      paid_on: localDate(),
      note: note || null,
    });
    if (error) return alert(error.message);
    setAmount("");
    setNote("");
    reload();
  }

  async function deletePayment(pid: string) {
    if (!confirm("Delete this payment?")) return;
    const { error } = await supabase.from("payments").delete().eq("id", pid);
    if (error) return alert(error.message);
    reload();
  }

  async function addSession(present: boolean) {
    if (c.sessions_done >= c.sessions_total) return alert("Month finished. Start a new month.");
    const { error } = await supabase
      .from("attendance")
      .insert({ cycle_id: c.id, date: localDate(), present });
    if (error)
      return alert(error.code === "23505" ? "Today is already recorded. Change it in the list below." : error.message);
    reload();
  }

  async function togglePresent(r: any) {
    const { error } = await supabase.from("attendance").update({ present: !r.present }).eq("id", r.id);
    if (error) return alert(error.message);
    reload();
  }

  async function deleteRecord(rid: string) {
    if (!confirm("Delete this session?")) return;
    const { error } = await supabase.from("attendance").delete().eq("id", rid);
    if (error) return alert(error.message);
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

  async function saveFee() {
    const f = Number(feeVal);
    if (!f || f <= 0) return alert("Enter a fee");
    const share = (f * Number(sub.teacher_share_percent)) / 100;
    const r1 = await supabase.from("enrollments").update({ monthly_fee: f }).eq("id", e.id);
    if (r1.error) return alert(r1.error.message);
    if (c) {
      const r2 = await supabase.from("cycles").update({ fee: f, teacher_share: share }).eq("id", c.id);
      if (r2.error) return alert(r2.error.message);
    }
    setEditingFee(false);
    reload();
  }

  async function removeEnrollment() {
    if (payments.length > 0) return alert("This student has payments in this group. Delete the payments first.");
    if (!confirm("Remove this student from the group? Their sessions here will be deleted.")) return;
    const { error } = await supabase.from("enrollments").delete().eq("id", e.id);
    if (error) return alert(error.message);
    reload();
  }

  return (
    <section className={`${ui.card} space-y-4`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">
            {sub.name}
            {sub.level ? ` · ${sub.level}` : ""}
          </h2>
          <p className={ui.muted}>
            {sub.teachers?.name} · {money(e.monthly_fee)} per month
          </p>
        </div>
        <button onClick={() => setEditingFee(!editingFee)} className={ui.link}>
          {editingFee ? "Close" : "Change fee"}
        </button>
      </div>

      {editingFee && (
        <div className="space-y-2 rounded-xl bg-gray-50 p-3">
          <p className="text-sm text-gray-600">Changes this month and all future months.</p>
          <input className={ui.input} type="number" value={feeVal} onChange={(x) => setFeeVal(x.target.value)} />
          <button onClick={saveFee} className={ui.btn}>
            Save fee
          </button>
        </div>
      )}

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

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className={ui.label}>Sessions</p>
                <div className="mt-1 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    {Array.from({ length: c.sessions_total }).map((_, i) => {
                      const r = rec[i];
                      return (
                        <span
                          key={i}
                          className={`h-3 w-3 rounded-full ${
                            r ? (r.present ? "bg-teal-700" : "bg-red-500") : "bg-gray-300"
                          }`}
                        />
                      );
                    })}
                  </div>
                  <span className="text-sm font-medium">
                    {c.sessions_done}/{c.sessions_total}
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {presentN} present · {absentN} absent
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => addSession(true)} className="rounded-xl bg-teal-700 px-4 py-2 font-medium text-white">
                Present today
              </button>
              <button onClick={() => addSession(false)} className="rounded-xl bg-red-500 px-4 py-2 font-medium text-white">
                Absent today
              </button>
            </div>

            {rec.length > 0 && (
              <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 px-3">
                {rec.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-2 py-2">
                    <div>
                      <p className={`font-medium ${r.present ? "text-teal-700" : "text-red-600"}`}>
                        {r.present ? "Present" : "Absent"}
                      </p>
                      <p className="text-xs text-gray-500">{r.date}</p>
                    </div>
                    <div className="flex gap-3 text-sm font-medium">
                      <button onClick={() => togglePresent(r)} className={ui.link}>
                        {r.present ? "Mark absent" : "Mark present"}
                      </button>
                      <button onClick={() => deleteRecord(r.id)} className="text-red-600">
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
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
            <p className={ui.label}>Payment history ({payments.length})</p>
            {payments.length === 0 && <p className={ui.muted}>No payments yet.</p>}
            <ul className="divide-y divide-gray-100">
              {payments.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-2 py-2">
                  <div className="min-w-0">
                    <p className="font-medium tabular-nums">{money(p.amount)}</p>
                    <p className="truncate text-xs text-gray-500">
                      {p.paid_on}
                      {p.note ? ` · ${p.note}` : ""}
                    </p>
                  </div>
                  <button onClick={() => deletePayment(p.id)} className="text-sm font-medium text-red-600">
                    Delete
                  </button>
                </li>
              ))}
            </ul>
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

      <button onClick={removeEnrollment} className="text-sm font-medium text-red-600">
        Remove from this group
      </button>
    </section>
  );
}

export default function StudentClient({ id }: { id: string }) {
  const [student, setStudent] = useState<any>(null);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [cycles, setCycles] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [notes, setNotes] = useState("");
  const [editing, setEditing] = useState(false);
  const [nameVal, setNameVal] = useState("");
  const [phoneVal, setPhoneVal] = useState("");

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
    const cids = (c.data ?? []).map((x: any) => x.id);
    let pays: any[] = [];
    let atts: any[] = [];
    if (cids.length) {
      const p = await supabase
        .from("payments")
        .select("*")
        .in("cycle_id", cids)
        .order("paid_on", { ascending: false });
      pays = p.data ?? [];
      const a = await supabase
        .from("attendance")
        .select("id, cycle_id, date, present, created_at")
        .in("cycle_id", cids);
      atts = a.data ?? [];
    }
    setStudent(s.data);
    setNotes(s.data?.notes ?? "");
    setNameVal(s.data?.name ?? "");
    setPhoneVal(s.data?.phone ?? "");
    setEnrollments(e.data ?? []);
    setCycles(c.data ?? []);
    setPayments(pays);
    setAttendance(atts);
  }
  useEffect(() => {
    load();
  }, [id]);

  async function saveNotes() {
    await supabase.from("students").update({ notes: notes || null }).eq("id", id);
  }

  async function saveStudent() {
    if (!nameVal) return alert("Name can't be empty");
    const { error } = await supabase
      .from("students")
      .update({ name: nameVal, phone: phoneVal || null })
      .eq("id", id);
    if (error) return alert(error.message);
    setEditing(false);
    load();
  }

  if (!student) return <main className={ui.page}>Loading...</main>;

  return (
    <main className={ui.page}>
      <Link href="/students" className={ui.link}>
        Back to students
      </Link>

      <div className={`${ui.card} space-y-3`}>
        {editing ? (
          <>
            <input className={ui.input} value={nameVal} onChange={(e) => setNameVal(e.target.value)} />
            <input
              className={ui.input}
              placeholder="Phone"
              value={phoneVal}
              onChange={(e) => setPhoneVal(e.target.value)}
            />
            <button onClick={saveStudent} className={ui.btn}>
              Save
            </button>
          </>
        ) : (
          <div className="flex items-start justify-between gap-2">
            <div>
              <h1 className="text-xl font-semibold">{student.name}</h1>
              {student.phone && (
                <a href={`tel:${student.phone}`} className={ui.link}>
                  {student.phone}
                </a>
              )}
            </div>
            <button onClick={() => setEditing(true)} className={ui.link}>
              Edit
            </button>
          </div>
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
      {enrollments.map((e) => {
        const ec = cycles.filter((c) => c.enrollment_id === e.id);
        const cidSet = new Set(ec.map((c) => c.id));
        const latestId = ec[0]?.id;
        return (
          <CycleCard
            key={e.id}
            e={e}
            cycles={ec}
            payments={payments.filter((p) => cidSet.has(p.cycle_id))}
            records={attendance.filter((a) => a.cycle_id === latestId)}
            reload={load}
          />
        );
      })}
    </main>
  );
}