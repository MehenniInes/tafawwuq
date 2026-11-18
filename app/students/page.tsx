"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { ui } from "@/components/ui";

const money = (n: number) => Number(n).toLocaleString() + " DA";
const initials = (n: string) => n.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");

export default function Students() {
  const [students, setStudents] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [joined, setJoined] = useState<Set<string>>(new Set());
  const [owed, setOwed] = useState<Record<string, number>>({});
  const [q, setQ] = useState("");
  const [panel, setPanel] = useState<"" | "student" | "enroll">("");
  const [msg, setMsg] = useState("");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [studentId, setStudentId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [fee, setFee] = useState("");

  async function load() {
    const [st, su, cy, en] = await Promise.all([
      supabase.from("students").select("*").order("name"),
      supabase.from("subjects").select("*, teachers(name)").order("name"),
      supabase.from("cycle_status").select("student_id, remaining"),
      supabase.from("enrollments").select("student_id, subject_id"),
    ]);
    setStudents(st.data ?? []);
    setSubjects(su.data ?? []);
    setJoined(new Set((en.data ?? []).map((e: any) => `${e.student_id}|${e.subject_id}`)));
    const map: Record<string, number> = {};
    (cy.data ?? []).forEach((c: any) => { map[c.student_id] = (map[c.student_id] ?? 0) + Number(c.remaining); });
    setOwed(map);
  }
  useEffect(() => { load(); }, []);

  async function addStudent() {
    if (!name) return;
    const { error } = await supabase.from("students")
      .insert({ name, phone: phone || null, notes: notes || null });
    if (error) return alert(error.message);
    setName(""); setPhone(""); setNotes(""); setPanel(""); load();
  }

  function pickSubject(id: string) {
    setSubjectId(id);
    const s = subjects.find((x) => x.id === id);
    if (s) setFee(String(s.monthly_price));
  }

  async function enroll() {
    const s = subjects.find((x) => x.id === subjectId);
    if (!studentId || !s || !fee) return alert("Choose student, subject and fee");

    // Rule 3: duplicate enrollment guard
    if (joined.has(`${studentId}|${s.id}`))
      return alert("This student is already enrolled in this group.");

    const monthlyFee = Number(fee);
    const { data, error } = await supabase.from("enrollments")
      .insert({ student_id: studentId, subject_id: s.id, monthly_fee: monthlyFee })
      .select().single();
    if (error) return alert(error.code === "23505" ? "This student is already enrolled in this group." : error.message);
    const share = (monthlyFee * Number(s.teacher_share_percent)) / 100;
    const c = await supabase.from("cycles").insert({
      enrollment_id: data.id, fee: monthlyFee, teacher_share: share,
    });
    if (c.error) return alert(c.error.message);
    setMsg("Student enrolled");
    setSubjectId(""); setFee("");
    load();
  }

  const filtered = students.filter((s) => s.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <main className={ui.page}>
      <div>
        <p className={ui.muted}><span className="font-bold text-indigo-600">{students.length}</span> Enrolled Students</p>
        <h1 className={ui.title}>Directory</h1>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => setPanel(panel === "student" ? "" : "student")}
          className={panel === "student" ? ui.btn : ui.btn2 + " w-full"}>+ Add student</button>
        <button onClick={() => { setMsg(""); setPanel(panel === "enroll" ? "" : "enroll"); }}
          className={panel === "enroll" ? ui.btn : ui.btn2 + " w-full"}>Enroll in group</button>
      </div>

      {panel === "student" && (
        <section className={`${ui.card} space-y-3`}>
          <input className={ui.input} placeholder="Student name" value={name} onChange={(e) => setName(e.target.value)} />
          <input className={ui.input} placeholder="Phone (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <textarea className={ui.input} rows={2} placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
          <button onClick={addStudent} className={ui.btn}>Save student</button>
        </section>
      )}

      {panel === "enroll" && (
        <section className={`${ui.card} space-y-3`}>
          <select className={ui.input} value={studentId} onChange={(e) => setStudentId(e.target.value)}>
            <option value="">Choose student</option>
            {students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select className={ui.input} value={subjectId} onChange={(e) => pickSubject(e.target.value)}>
            <option value="">Choose group</option>
            {subjects.map((s) => {
              const already = !!studentId && joined.has(`${studentId}|${s.id}`);
              return (
                <option key={s.id} value={s.id} disabled={already}>
                  {s.name}{s.level ? ` · ${s.level}` : ""} — {s.teachers?.name} — {s.monthly_price} DA{already ? " (already enrolled)" : ""}
                </option>
              );
            })}
          </select>
          <input className={ui.input} type="number" placeholder="Monthly fee (DA)" value={fee} onChange={(e) => setFee(e.target.value)} />
          <button onClick={enroll} className={ui.btn}>Enroll</button>
          {msg && <p className="text-[13px] font-semibold text-emerald-700">{msg}</p>}
        </section>
      )}

      <input className={ui.input} placeholder="Search students" value={q} onChange={(e) => setQ(e.target.value)} />

      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-0.5">{filtered.length} students</p>

      <div className="bg-white rounded-2xl border border-slate-200/90 divide-y divide-slate-100 overflow-hidden">
        {filtered.map((s) => {
          const left = owed[s.id] ?? 0;
          const paid = left === 0;
          return (
            <Link key={s.id} href={`/students/${s.id}`}
              className="flex items-center justify-between gap-2.5 px-4 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-9 h-9 rounded-xl font-display font-bold text-[12px] flex items-center justify-center shrink-0 ${
                  paid ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                  {initials(s.name)}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-display font-bold text-slate-900">{s.name}</p>
                  {s.phone && <p className="text-[11px] text-slate-500 truncate">{s.phone}</p>}
                </div>
              </div>
              <span className={`shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full ${
                paid ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                {paid ? "Paid ✓" : `Owes ${money(left)}`}
              </span>
            </Link>
          );
        })}
      </div>
    </main>
  );
}