"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function Students() {
  const [students, setStudents] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [studentId, setStudentId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [fee, setFee] = useState("");

  async function load() {
    const st = await supabase.from("students").select("*").order("name");
    const su = await supabase
      .from("subjects")
      .select("*, teachers(name)")
      .order("name");
    setStudents(st.data ?? []);
    setSubjects(su.data ?? []);
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
    alert("Enrolled ✔");
    setSubjectId("");
    setFee("");
  }

  const input = "w-full border rounded p-3";
  return (
    <main className="p-4 max-w-lg mx-auto space-y-6">
      <Link href="/" className="underline">
        ← Home
      </Link>

      <section className="space-y-2">
        <h2 className="text-lg font-bold">Add student</h2>
        <input
          className={input}
          placeholder="Student name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className={input}
          placeholder="Phone (optional)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <textarea
          className={input}
          placeholder="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <button onClick={addStudent} className="w-full bg-black text-white rounded p-3">
          Add student
        </button>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-bold">Enroll in a subject</h2>
        <select
          className={input}
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
        >
          <option value="">Choose student</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select
          className={input}
          value={subjectId}
          onChange={(e) => pickSubject(e.target.value)}
        >
          <option value="">Choose subject</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
              {s.level ? ` · ${s.level}` : ""} — {s.teachers?.name} — {s.monthly_price} DA
            </option>
          ))}
        </select>
        <input
          className={input}
          type="number"
          placeholder="Monthly fee (DA)"
          value={fee}
          onChange={(e) => setFee(e.target.value)}
        />
        <button onClick={enroll} className="w-full bg-black text-white rounded p-3">
          Enroll
        </button>
      </section>

      <section>
        <h2 className="text-lg font-bold">Students ({students.length})</h2>
        <ul className="list-disc ml-5">
          {students.map((s) => (
            <li key={s.id}>
  <Link href={`/students/${s.id}`} className="underline">{s.name}</Link>
</li>
          ))}
        </ul>
      </section>
    </main>
  );
}