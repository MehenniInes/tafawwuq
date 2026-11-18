"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { ui } from "@/components/ui";

const LEVELS = ["Primary", "1AM", "2AM", "3AM", "4AM", "1AS", "2AS", "3AS"];

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

function SubjectRow({ s, onChanged }: { s: any; onChanged: () => void }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(s.name);
  const [level, setLevel] = useState(s.level ?? "");
  const [price, setPrice] = useState(String(s.monthly_price));
  const [share, setShare] = useState(String(s.teacher_share_percent));
  const [applyPrice, setApplyPrice] = useState(false);

  async function save() {
    const p = Number(price);
    const sh = Number(share);
    if (!name.trim()) return alert("Enter the subject name");
    if (!(p > 0)) return alert("Enter a valid price");
    if (sh < 0 || sh > 100) return alert("Teacher % must be between 0 and 100");
    const { error } = await supabase
      .from("subjects")
      .update({ name: name.trim(), level: level || null, monthly_price: p, teacher_share_percent: sh })
      .eq("id", s.id);
    if (error) return alert(error.message);
    if (applyPrice) {
      const r = await supabase.from("enrollments").update({ monthly_fee: p }).eq("subject_id", s.id);
      if (r.error) return alert(r.error.message);
    }
    setEditing(false);
    setApplyPrice(false);
    onChanged();
  }

  async function remove() {
    if (!confirm("Delete this subject?")) return;
    const { error } = await supabase.from("subjects").delete().eq("id", s.id);
    if (error) return alert("Can't delete: students are enrolled in it.");
    onChanged();
  }

  if (!editing) {
    return (
      <li className="flex items-center justify-between gap-2 py-2">
        <div className="min-w-0">
          <p className="truncate font-medium">
            {s.name}
            {s.level ? ` · ${s.level}` : ""}
          </p>
          <p className={ui.muted}>
            {Number(s.monthly_price).toLocaleString()} DA · teacher gets {s.teacher_share_percent}%
          </p>
        </div>
        <div className="flex shrink-0 gap-3">
          <button onClick={() => setEditing(true)} className={ui.link}>
            Edit
          </button>
          <button onClick={remove} className="text-sm font-medium text-red-600">
            Delete
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className="space-y-2 py-3">
      <input className={ui.input} placeholder="Subject" value={name} onChange={(e) => setName(e.target.value)} />
      <input className={ui.input} list="levels" placeholder="Level" value={level} onChange={(e) => setLevel(e.target.value)} />
      <div className="grid grid-cols-2 gap-2">
        <div>
          <p className={ui.label}>Price (DA)</p>
          <input className={`${ui.input} mt-1`} type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>
        <div>
          <p className={ui.label}>Teacher %</p>
          <input className={`${ui.input} mt-1`} type="number" value={share} onChange={(e) => setShare(e.target.value)} />
        </div>
      </div>
      <label className="flex items-start gap-2 text-sm text-gray-600">
        <input type="checkbox" className="mt-1 h-4 w-4" checked={applyPrice} onChange={(e) => setApplyPrice(e.target.checked)} />
        Also use this price for students already in this group (from their next month)
      </label>
      <p className="text-xs text-gray-500">The teacher % applies to new months only. Months already started keep their share.</p>
      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => setEditing(false)} className={ui.btn2}>
          Cancel
        </button>
        <button onClick={save} className={ui.btn}>
          Save
        </button>
      </div>
    </li>
  );
}

function TeacherCard({
  t,
  subjects,
  onChanged,
}: {
  t: any;
  subjects: any[];
  onChanged: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(t.name);
  const [phone, setPhone] = useState(t.phone ?? "");

  async function save() {
    if (!name.trim()) return alert("Enter the teacher's name");
    const { error } = await supabase
      .from("teachers")
      .update({ name: name.trim(), phone: phone || null })
      .eq("id", t.id);
    if (error) return alert(error.message);
    setEditing(false);
    onChanged();
  }

  async function remove() {
    if (subjects.length > 0) return alert("Delete this teacher's subjects first.");
    if (!confirm("Delete this teacher?")) return;
    const { error } = await supabase.from("teachers").delete().eq("id", t.id);
    if (error) return alert("Can't delete: this teacher has payout records.");
    onChanged();
  }

  return (
    <section className={ui.card}>
      {editing ? (
        <div className="space-y-2">
          <input className={ui.input} value={name} onChange={(e) => setName(e.target.value)} />
          <input className={ui.input} placeholder="Phone (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setEditing(false)} className={ui.btn2}>
              Cancel
            </button>
            <button onClick={save} className={ui.btn}>
              Save
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold">{t.name}</h2>
            {t.phone && <p className={ui.muted}>{t.phone}</p>}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setEditing(true)} className={ui.link}>
              Edit
            </button>
            <button onClick={remove} className="text-sm font-medium text-red-600">
              Delete
            </button>
          </div>
        </div>
      )}

      <ul className="mt-2 divide-y divide-gray-100">
        {subjects.map((s) => (
          <SubjectRow key={s.id} s={s} onChanged={onChanged} />
        ))}
      </ul>
      <SubjectForm teacherId={t.id} onAdded={onChanged} />
    </section>
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
    if (!tName.trim()) return;
    const { error } = await supabase.from("teachers").insert({ name: tName.trim(), phone: tPhone || null });
    if (error) return alert(error.message);
    setTName("");
    setTPhone("");
    setShowAdd(false);
    load();
  }

  return (
    <main className={ui.page}>
      <datalist id="levels">
        {LEVELS.map((l) => (
          <option key={l} value={l} />
        ))}
      </datalist>

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
        <TeacherCard
          key={t.id}
          t={t}
          subjects={subjects.filter((s) => s.teacher_id === t.id)}
          onChanged={load}
        />
      ))}
    </main>
  );
}