"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { ui } from "@/components/ui";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_ORDER = [6, 0, 1, 2, 3, 4, 5];

export default function Groups() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const [teacherId, setTeacherId] = useState("");
  const [name, setName] = useState("");
  const [level, setLevel] = useState("");
  const [price, setPrice] = useState("");
  const [share, setShare] = useState("50");
  const [days, setDays] = useState<number[]>([]);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  async function load() {
    const [su, en, te] = await Promise.all([
      supabase.from("subjects").select("*, teachers(name)").order("name"),
      supabase.from("enrollments").select("id, subject_id").eq("active", true),
      supabase.from("teachers").select("id, name").order("name"),
    ]);
    setSubjects(su.data ?? []);
    setEnrollments(en.data ?? []);
    setTeachers(te.data ?? []);
  }
  useEffect(() => {
    load();
  }, []);

  function toggleDay(d: number) {
    setDays(days.includes(d) ? days.filter((x) => x !== d) : [...days, d]);
  }

  async function addGroup() {
    if (!teacherId || !name || !price) return alert("Choose a teacher, and fill the subject and price");
    if (start && end && end <= start) return alert("End time must be after start time");
    const { error } = await supabase.from("subjects").insert({
      teacher_id: teacherId,
      name,
      level: level || null,
      monthly_price: Number(price),
      teacher_share_percent: Number(share),
      days,
      start_time: start || null,
      end_time: end || null,
    });
    if (error) return alert(error.message);
    setName("");
    setLevel("");
    setPrice("");
    setDays([]);
    setStart("");
    setEnd("");
    setShowAdd(false);
    load();
  }

  const filtered = subjects.filter((s) =>
    `${s.name} ${s.level ?? ""} ${s.teachers?.name ?? ""}`.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <main className={ui.page}>
      <h1 className={ui.title}>Groups</h1>

      <button onClick={() => setShowAdd(!showAdd)} className={showAdd ? ui.btn : ui.btn2 + " w-full"}>
        Add group
      </button>

      {showAdd && (
        <section className={`${ui.card} space-y-3`}>
          {teachers.length === 0 ? (
            <p className={ui.muted}>
              You need a teacher first.{" "}
              <Link href="/setup" className={ui.link}>
                Add a teacher
              </Link>
            </p>
          ) : (
            <>
              <select className={ui.input} value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
                <option value="">Choose teacher</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <input className={ui.input} placeholder="Subject (e.g. Math)" value={name} onChange={(e) => setName(e.target.value)} />
              <input className={ui.input} list="levels" placeholder="Level (e.g. 3AS)" value={level} onChange={(e) => setLevel(e.target.value)} />
              <datalist id="levels">
                {["Primary", "1AM", "2AM", "3AM", "4AM", "1AS", "2AS", "3AS"].map((l) => (
                  <option key={l} value={l} />
                ))}
              </datalist>
              <div className="grid grid-cols-2 gap-3">
                <input className={ui.input} type="number" placeholder="Price (DA)" value={price} onChange={(e) => setPrice(e.target.value)} />
                <input className={ui.input} type="number" placeholder="Teacher %" value={share} onChange={(e) => setShare(e.target.value)} />
              </div>
              <p className={ui.label}>Days</p>
              <div className="flex flex-wrap gap-2">
                {DAY_ORDER.map((d) => (
                  <button
                    key={d}
                    onClick={() => toggleDay(d)}
                    className={`rounded-xl border px-3 py-2 text-sm font-medium ${
                      days.includes(d)
                        ? "border-teal-700 bg-teal-700 text-white"
                        : "border-gray-300 bg-white text-gray-700"
                    }`}
                  >
                    {DAYS[d]}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className={ui.label}>Starts</p>
                  <input type="time" className={ui.input} value={start} onChange={(e) => setStart(e.target.value)} />
                </div>
                <div>
                  <p className={ui.label}>Ends</p>
                  <input type="time" className={ui.input} value={end} onChange={(e) => setEnd(e.target.value)} />
                </div>
              </div>
              <button onClick={addGroup} className={ui.btn}>
                Save group
              </button>
            </>
          )}
        </section>
      )}

      <input
        className={ui.input}
        placeholder="Search subject, level or teacher"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      {filtered.map((s) => {
        const count = enrollments.filter((e) => e.subject_id === s.id).length;
        const dayText = DAY_ORDER.filter((d) => (s.days ?? []).includes(d)).map((d) => DAYS[d]).join(", ");
        const a = s.start_time ? s.start_time.slice(0, 5) : "";
        const b = s.end_time ? s.end_time.slice(0, 5) : "";
        return (
          <Link key={s.id} href={`/groups/${s.id}`} className={`${ui.card} block`}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-semibold">
                  {s.name}
                  {s.level ? ` · ${s.level}` : ""}
                </p>
                <p className={ui.muted}>
                  {s.teachers?.name} · {count} students
                </p>
              </div>
              {dayText ? (
                <p className="shrink-0 text-right text-sm font-medium">
                  {a ? (b ? `${a} - ${b}` : a) : ""}
                  <span className="block text-xs font-normal text-gray-500">{dayText}</span>
                </p>
              ) : (
                <span className="shrink-0 rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">
                  No schedule
                </span>
              )}
            </div>
          </Link>
        );
      })}

      <Link href="/setup" className={`${ui.link} block text-center`}>
        Teachers and subjects
      </Link>
    </main>
  );
}