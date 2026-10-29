"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { ui } from "@/components/ui";

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
    setName("");
    setLevel("");
    setPrice("");
    onAdded();
  }

  return (
    <div className="mt-3 space-y-2 border-t border-gray-100 pt-3">
      <p className={ui.label}>New subject</p>
      <input className={ui.input} placeholder="Subject (e.g. Math)" value={name} onChange={(e) => setName(e.target.value)} />
      <input className={ui.input} list="levels" placeholder="Level (e.g. 3AS)" value={level} onChange={(e) => setLevel(e.target.value)} />
      <datalist id="levels">
        {["Primary", "1AM", "2AM", "3AM", "4AM", "1AS", "2AS", "3AS"].map((l) => (
          <option key={l} value={l} />
        ))}
      </datalist>
      <div className="grid grid-cols-2 gap-2">
        <input className={ui.input} type="number" placeholder="Price (DA)" value={price} onChange={(e) => setPrice(e.target.value)} />
        <input className={ui.input} type="number" placeholder="Teacher %" value={share} onChange={(e) => setShare(e.target.value)} />
      </div>
      <button onClick={add} className={ui.btn}>
        Add subject
      </button>
    </div>
  );
}

export default function Setup() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [tName, setTName] = useState("");
  const [tPhone, setTPhone] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  async function load() {
    const t = await supabase.from("teachers").select("*").order("name");
    const s = await supabase.from("subjects").select("*").order("name");
    setTeachers(t.data ?? []);
    setSubjects(s.data ?? []);
  }
  useEffect(() => {
    load();
  }, []);

  async function addTeacher() {
    if (!tName) return;
    const { error } = await supabase.from("teachers").insert({ name: tName, phone: tPhone || null });
    if (error) return alert(error.message);
    setTName("");
    setTPhone("");
    setShowAdd(false);
    load();
  }

  async function removeSubject(id: string) {
    if (!confirm("Delete this subject?")) return;
    const { error } = await supabase.from("subjects").delete().eq("id", id);
    if (error) return alert("Can't delete: students are enrolled in it.");
    load();
  }

  return (
    <main className={ui.page}>
      <Link href="/groups" className={ui.link}>
        Back to groups
      </Link>
      <h1 className={ui.title}>Teachers and subjects</h1>

      <button onClick={() => setShowAdd(!showAdd)} className={showAdd ? ui.btn : ui.btn2 + " w-full"}>
        Add teacher
      </button>

      {showAdd && (
        <section className={`${ui.card} space-y-3`}>
          <input className={ui.input} placeholder="Teacher name" value={tName} onChange={(e) => setTName(e.target.value)} />
          <input className={ui.input} placeholder="Phone (optional)" value={tPhone} onChange={(e) => setTPhone(e.target.value)} />
          <button onClick={addTeacher} className={ui.btn}>
            Save teacher
          </button>
        </section>
      )}

      {teachers.map((t) => (
        <section key={t.id} className={ui.card}>
          <h2 className="text-lg font-semibold">{t.name}</h2>
          <ul className="mt-2 divide-y divide-gray-100">
            {subjects
              .filter((s) => s.teacher_id === t.id)
              .map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-2 py-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {s.name}
                      {s.level ? ` · ${s.level}` : ""}
                    </p>
                    <p className={ui.muted}>
                      {Number(s.monthly_price).toLocaleString()} DA · teacher gets {s.teacher_share_percent}%
                    </p>
                  </div>
                  <button onClick={() => removeSubject(s.id)} className="text-sm font-medium text-red-600">
                    Delete
                  </button>
                </li>
              ))}
          </ul>
          <SubjectForm teacherId={t.id} onAdded={load} />
        </section>
      ))}
    </main>
  );
}