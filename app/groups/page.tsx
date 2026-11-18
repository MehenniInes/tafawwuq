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
  const [subTab, setSubTab] = useState<"groups" | "subjects" | "teachers">("groups");
  const [showAdd, setShowAdd] = useState(false);

  // Form states
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
  useEffect(() => { load(); }, []);

  function toggleDay(d: number) {
    setDays(days.includes(d) ? days.filter((x) => x !== d) : [...days, d]);
  }

  async function addGroup() {
    if (!teacherId || !name || !price) return alert("Choose a teacher, and fill the subject and price");
    if (start && end && end <= start) return alert("End time must be after start time");
    const { error } = await supabase.from("subjects").insert({
      teacher_id: teacherId, name, level: level || null,
      monthly_price: Number(price), teacher_share_percent: Number(share),
      days, start_time: start || null, end_time: end || null,
    });
    if (error) return alert(error.message);
    setName(""); setLevel(""); setPrice(""); setDays([]); setStart(""); setEnd("");
    setShowAdd(false); load();
  }

  const filtered = subjects.filter((s) =>
    `${s.name} ${s.level ?? ""} ${s.teachers?.name ?? ""}`.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <main className={ui.page}>
      <header className="pt-1 flex items-center justify-between mb-4">
        <div>
          <p className="text-[12px] font-medium text-slate-500">Academy Setup</p>
          <h1 className="font-display text-[24px] font-extrabold text-slate-900 tracking-tight">Classes & Staff</h1>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="h-11 px-4 rounded-full bg-indigo-600 text-white text-[13px] font-semibold inline-flex items-center gap-1.5 shadow-xs spring-press">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
          <span>New {subTab === "groups" ? "Group" : subTab === "subjects" ? "Subject" : "Teacher"}</span>
        </button>
      </header>

      {/* Material 3 Segmented Tabs */}
      <div className="grid grid-cols-3 bg-slate-200/80 p-1 rounded-2xl text-[13px] font-semibold mb-4">
        {(["groups", "subjects", "teachers"] as const).map((t) => (
          <button key={t} onClick={() => setSubTab(t)}
            className={`py-2 rounded-xl transition-all ${subTab === t ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600"}`}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        <input type="text" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search groups, levels, teachers..." className="w-full h-11 pl-10 pr-4 rounded-full bg-white border border-slate-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-600" />
      </div>

      {/* Add Form (Simple inline version) */}
      {showAdd && subTab === "groups" && (
        <section className={`${ui.card} space-y-3 mb-4`}>
          <select className={ui.input} value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
            <option value="">Choose teacher</option>
            {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <input className={ui.input} placeholder="Subject (e.g. Math)" value={name} onChange={(e) => setName(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <input className={ui.input} placeholder="Level (e.g. 3AM)" value={level} onChange={(e) => setLevel(e.target.value)} />
            <input className={ui.input} type="number" placeholder="Price (DA)" value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>
          <button onClick={addGroup} className={ui.btn}>Save group</button>
        </section>
      )}

      {/* GROUPS TAB (2x2 Square Grid) */}
      {subTab === "groups" && (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((s) => {
            const count = enrollments.filter((e) => e.subject_id === s.id).length;
            const a = s.start_time ? s.start_time.slice(0, 5) : "--:--";
            const day = s.days && s.days.length > 0 ? DAYS[s.days[0]] : "No Day";
            return (
              <Link key={s.id} href={`/groups/${s.id}`} className="aspect-square bg-white rounded-3xl border border-slate-200 p-3.5 flex flex-col justify-between shadow-2xs spring-press relative overflow-hidden">
                {/* Top Accent Bar */}
                <div className="absolute top-0 inset-x-0 h-1.5 bg-indigo-600"></div>
                <div className="flex items-center justify-between pt-1">
                  <span className="px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 text-[11px] font-extrabold">{day}</span>
                  <span className="text-[11px] font-semibold text-slate-400">{a}</span>
                </div>
                <div className="my-auto">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">{s.name}</span>
                  <h3 className="font-display text-[22px] font-extrabold text-slate-900 leading-tight mt-0.5">{s.level || "General"}</h3>
                  <p className="text-[11px] text-slate-500 truncate mt-1">{s.teachers?.name}</p>
                </div>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    {count}
                  </span>
                  <span className="text-[11px] font-extrabold text-slate-900">{Number(s.monthly_price).toLocaleString()} DA</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* SUBJECTS TAB (Curved Folder Tabs) */}
      {subTab === "subjects" && (
        <div className="space-y-3.5 pt-1">
          {filtered.map((s) => {
            const activeGroups = subjects.filter(g => g.name === s.name).length;
            return (
              <div key={s.id} className="pt-0.5">
                {/* Folder Ear */}
                <div className="flex items-end justify-between pr-2">
                  <div className="subject-folder-ear bg-white border-t border-l border-r border-indigo-200/80 px-3.5 py-1.5 inline-flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-700">
                      {activeGroups} Groups
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-slate-500 pb-1">Base: {Number(s.monthly_price).toLocaleString()} DA/mo</span>
                </div>
                {/* Folder Body */}
                <div className="subject-folder-tab bg-white rounded-2xl border border-indigo-200/80 p-4 shadow-2xs -mt-[1px]">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white font-display font-extrabold text-base flex items-center justify-center shadow-2xs shrink-0">
                      {s.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-display text-[17px] font-extrabold text-slate-900">{s.name}</h3>
                      <p className="text-[11px] text-slate-500">Syllabus & Active Levels</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-slate-100">
                    <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-800 text-[11px] font-bold">{s.level || "All Levels"}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TEACHERS TAB */}
      {subTab === "teachers" && (
        <div className="space-y-2.5">
          {teachers.map((t) => (
            <div key={t.id} className="bg-white rounded-2xl border border-slate-200/90 p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-800 font-display font-bold text-sm flex items-center justify-center shrink-0">
                  {t.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h3 className="font-display text-[15px] font-bold text-slate-900 truncate">{t.name}</h3>
                  <p className="text-[12px] text-slate-500 truncate">Teacher</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}