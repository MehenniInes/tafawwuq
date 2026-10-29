"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { ui } from "@/components/ui";

const money = (n: number) => Number(n).toLocaleString() + " DA";

export default function Students() {
  const [students, setStudents] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
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
    const [st, su, cy] = await Promise.all([
      supabase.from("students").select("*").order("name"),
      supabase.from("subjects").select("*, teachers(name)").order("name"),
      supabase.from("cycle_status").select("student_id, remaining"),
    ]);
    setStudents(st.data ?? []);
    setSubjects(su.data ?? []);
    const map: Record<string, number> = {};
    (cy.data ?? []).forEach((c: any) => {
      map[c.student_id] = (map[c.student_id] ?? 0) + Number(c.remaining);
    });
    setOwed(map);
  }
  useEffect(() => {
    load();
  }, []);

  async function addStudent() {
    if (!name) return;
    const { error } = await supabase
      .from("students")
      .insert({ name, phone: phone || null, notes: notes || null });
    if (error) return alert(error.message);
    setName("");
    setPhone("");
    setNotes("");
    setPanel("");
    load();
  }

  function pickSubject(id: string) {
    setSubjectId(id);
    const s = subjects.find((x) => x.id === id);
    if (s) setFee(String(s.monthly_price));
  }

  async function enroll() {
    const s = subjects.find((x) => x.id === subjectId);
    if (!studentId || !s || !fee) return alert("Choose student, subject and fee");
    const monthlyFee = Number(fee);
    const { data, error } = await supabase
      .from("enrollments")
      .insert({ student_id: studentId, subject_id: s.id, monthly_fee: monthlyFee })
      .select()
      .single();
    if (error) return alert(error.message);
    const share = (monthlyFee * Number(s.teacher_share_percent)) / 100;
    const c = await supabase.from("cycles").insert({
      enrollment_id: data.id,
      fee: monthlyFee,
      teacher_share: share,
    });
    if (c.error) return alert(c.error.message);
    setMsg("Student enrolled");
    setSubjectId("");
    setFee("");
    load();
  }

  const filtered = students.filter((s) => s.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <main className={ui.page}>
      <h1 className={ui.title}>Students</h1>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setPanel(panel === "student" ? "" : "student")}
          className={panel === "student" ? ui.btn : ui.btn2}
        >
          Add student
        </button>
        <button
          onClick={() => {
            setMsg("");
            setPanel(panel === "enroll" ? "" : "enroll");
          }}
          className={panel === "enroll" ? ui.btn : ui.btn2}
        >
          Enroll in group
        </button>
      </div>

      {panel === "student" && (
        <section className={`${ui.card} space-y-3`}>
          <input className={ui.input} placeholder="Student name" value={name} onChange={(e) => setName(e.target.value)} />
          <input className={ui.input} placeholder="Phone (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <textarea className={ui.input} rows={2} placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
          <button onClick={addStudent} className={ui.btn}>
            Save student
          </button>
        </section>
      )}

      {panel === "enroll" && (
        <section className={`${ui.card} space-y-3`}>
          <select className={ui.input} value={studentId} onChange={(e) => setStudentId(e.target.value)}>
            <option value="">Choose student</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <select className={ui.input} value={subjectId} onChange={(e) => pickSubject(e.target.value)}>
            <option value="">Choose group</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
                {s.level ? ` · ${s.level}` : ""} — {s.teachers?.name} — {s.monthly_price} DA
              </option>
            ))}
          </select>
          <input className={ui.input} type="number" placeholder="Monthly fee (DA)" value={fee} onChange={(e) => setFee(e.target.value)} />
          <button onClick={enroll} className={ui.btn}>
            Enroll
          </button>
          {msg && <p className="text-sm font-medium text-teal-700">{msg}</p>}
        </section>
      )}

      <input className={ui.input} placeholder="Search students" value={q} onChange={(e) => setQ(e.target.value)} />

      <p className={ui.label}>{filtered.length} students</p>

      {filtered.map((s) => {
        const left = owed[s.id] ?? 0;
        return (
          <Link key={s.id} href={`/students/${s.id}`} className={`${ui.card} flex items-center justify-between`}>
            <div className="min-w-0">
              <p className="truncate font-semibold">{s.name}</p>
              {s.phone && <p className={ui.muted}>{s.phone}</p>}
            </div>
            <span className={`shrink-0 text-sm font-medium ${left > 0 ? "text-red-600" : "text-teal-700"}`}>
              {left > 0 ? `Owes ${money(left)}` : "Paid up"}
            </span>
          </Link>
        );
      })}
    </main>
  );
}