"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

function SubjectForm({ teacherId, onAdded }: { teacherId: string; onAdded: () => void }) {
  const [name, setName] = useState("");
  const [level, setLevel] = useState("");
  const [price, setPrice] = useState("");
  const [share, setShare] = useState("50");

  async function add() {
    if (!name || !price) return alert("Fill subject and price");
    const { error } = await supabase.from("subjects").insert({
      teacher_id: teacherId,
      name,
      level: level || null,
      monthly_price: Number(price),
      teacher_share_percent: Number(share),
    });
    if (error) return alert(error.message);
    setName(""); setLevel(""); setPrice(""); onAdded();
  }

  const input = "w-full border rounded p-2";
  return (
    <div className="space-y-2 mt-3">
      <input className={input} placeholder="Subject (e.g. Math)" value={name} onChange={(e) => setName(e.target.value)} />
      <input className={input} list="levels" placeholder="Level (e.g. 3AS)" value={level} onChange={(e) => setLevel(e.target.value)} />
      <datalist id="levels">
        {["Primary","1AM","2AM","3AM","4AM","1AS","2AS","3AS"].map((l) => <option key={l} value={l} />)}
      </datalist>
      <input className={input} type="number" placeholder="Monthly price (DA)" value={price} onChange={(e) => setPrice(e.target.value)} />
      <input className={input} type="number" placeholder="Teacher share %" value={share} onChange={(e) => setShare(e.target.value)} />
      <button onClick={add} className="w-full bg-black text-white rounded p-2">Add subject</button>
    </div>
  );
}

export default function Setup() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [tName, setTName] = useState("");
  const [tPhone, setTPhone] = useState("");

  async function load() {
    const t = await supabase.from("teachers").select("*").order("name");
    const s = await supabase.from("subjects").select("*").order("name");
    setTeachers(t.data ?? []);
    setSubjects(s.data ?? []);
  }
  useEffect(() => { load(); }, []);

  async function addTeacher() {
    if (!tName) return;
    const { error } = await supabase.from("teachers").insert({ name: tName, phone: tPhone || null });
    if (error) return alert(error.message);
    setTName(""); setTPhone(""); load();
  }

  async function removeSubject(id: string) {
    if (!confirm("Delete this subject?")) return;
    const { error } = await supabase.from("subjects").delete().eq("id", id);
    if (error) return alert("Can't delete: students are enrolled in it.");
    load();
  }

  const input = "w-full border rounded p-3";
  return (
    <main className="p-4 max-w-lg mx-auto space-y-6">
      <Link href="/" className="underline">← Home</Link>

      <section className="space-y-2">
        <h2 className="text-lg font-bold">Add teacher</h2>
        <input className={input} placeholder="Teacher name" value={tName} onChange={(e) => setTName(e.target.value)} />
        <input className={input} placeholder="Phone (optional)" value={tPhone} onChange={(e) => setTPhone(e.target.value)} />
        <button onClick={addTeacher} className="w-full bg-black text-white rounded p-3">Add teacher</button>
      </section>

      {teachers.map((t) => (
        <section key={t.id} className="border rounded p-3">
          <h2 className="text-lg font-bold">{t.name}</h2>
          <ul className="mt-2 space-y-1">
            {subjects.filter((s) => s.teacher_id === t.id).map((s) => (
              <li key={s.id} className="flex justify-between gap-2">
                <span>{s.name}{s.level ? ` · ${s.level}` : ""} — {s.monthly_price} DA ({s.teacher_share_percent}%)</span>
                <button onClick={() => removeSubject(s.id)} className="text-red-600">✕</button>
              </li>
            ))}
          </ul>
          <SubjectForm teacherId={t.id} onAdded={load} />
        </section>
      ))}
    </main>
  );
}