"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ui } from "@/components/ui";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function GroupsContent() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as "groups" | "subjects" | "teachers") || "groups";
  
  const [subjects, setSubjects] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [subTab, setSubTab] = useState<"groups" | "subjects" | "teachers">(initialTab);
  const [q, setQ] = useState("");
  const [showAddGroup, setShowAddGroup] = useState(false);

  // Form State for New Group
  const [formTeacher, setFormTeacher] = useState("");
  const [formSubject, setFormSubject] = useState("");
  const [formLevel, setFormLevel] = useState("");
  const [formDay, setFormDay] = useState(3); // Wed default
  const [formStart, setFormStart] = useState("14:00");
  const [formEnd, setFormEnd] = useState("15:30");
  const [formFee, setFormFee] = useState("1200");

  async function load() {
    const [su, en, te] = await Promise.all([
      supabase.from("subjects").select("*, teachers(name)").order("name"),
      supabase.from("enrollments").select("id, subject_id").eq("active", true),
      supabase.from("teachers").select("id, name").order("name"),
    ]);
    setSubjects(su.data ?? []); setEnrollments(en.data ?? []); setTeachers(te.data ?? []);
  }
  useEffect(() => { load(); }, []);
  useEffect(() => { if (initialTab) setSubTab(initialTab); }, [initialTab]);

  async function createGroup() {
    if (!formTeacher || !formSubject || !formFee) return alert("Please fill all fields");
    const { error } = await supabase.from("subjects").insert({
      teacher_id: formTeacher,
      name: formSubject,
      level: formLevel || null,
      monthly_price: Number(formFee),
      teacher_share_percent: 50,
      days: [formDay],
      start_time: formStart,
      end_time: formEnd,
    });
    if (error) return alert(error.message);
    setShowAddGroup(false);
    load();
  }

  const filtered = subjects.filter((s) => `${s.name} ${s.level ?? ""}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <main className={ui.page}>
      <header className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[12px] font-medium text-slate-500">Academy Setup</p>
          <h1 className="font-display text-[24px] font-extrabold text-slate-900">Classes & Staff</h1>
        </div>
        {/* Dynamic Button */}
        <button onClick={() => setShowAddGroup(true)} className="h-11 px-4 rounded-full bg-indigo-600 text-white text-[13px] font-semibold shadow-xs spring-press">
          + New {subTab === "groups" ? "Group" : subTab === "subjects" ? "Subject" : "Teacher"}
        </button>
      </header>

      <div className="grid grid-cols-3 bg-slate-200/80 p-1 rounded-2xl text-[13px] font-semibold mb-4">
        {(["groups", "subjects", "teachers"] as const).map((t) => (
          <button key={t} onClick={() => setSubTab(t)} className={`py-2 rounded-xl transition-all ${subTab === t ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600"}`}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div className="relative mb-4">
        <input type="text" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search..." className="w-full h-11 px-4 rounded-full bg-white border border-slate-200 text-[13px]" />
      </div>

      {subTab === "groups" && (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((s) => {
            const count = enrollments.filter((e) => e.subject_id === s.id).length;
            const day = s.days && s.days.length > 0 ? DAYS[s.days[0]] : "No Day";
            return (
              <Link key={s.id} href={`/groups/${s.id}`} className="aspect-square bg-white rounded-3xl border border-slate-200 p-3.5 flex flex-col justify-between shadow-2xs relative overflow-hidden spring-press">
                <div className="absolute top-0 inset-x-0 h-1.5 bg-indigo-600"></div>
                <div className="flex justify-between pt-1"><span className="px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 text-[11px] font-extrabold">{day}</span><span className="text-[11px] font-semibold text-slate-400">{s.start_time?.slice(0,5)}</span></div>
                <div className="my-auto"><span className="text-[11px] font-semibold text-slate-400 uppercase block">{s.name}</span><h3 className="font-display text-[22px] font-extrabold text-slate-900 leading-tight mt-0.5">{s.level || "General"}</h3><p className="text-[11px] text-slate-500 truncate mt-1">{s.teachers?.name}</p></div>
                <div className="pt-2 border-t border-slate-100 flex justify-between"><span className="text-[11px] font-bold text-slate-700">👤 {count}</span><span className="text-[11px] font-extrabold text-slate-900">{Number(s.monthly_price).toLocaleString()} DA</span></div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Subjects & Teachers tabs (Keep your existing UI here) */}

      {/* EXACT New Group Sheet from Screenshot 1 */}
      {showAddGroup && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div onClick={() => setShowAddGroup(false)} className="absolute inset-0 bg-slate-900/45 backdrop-blur-[1px] backdrop-fade" />
          <div className="relative bg-white rounded-t-[28px] p-5 shadow-2xl sheet-up w-full max-w-md mx-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-display font-extrabold text-[19px]">New Group & Schedule</h3>
              <button onClick={() => setShowAddGroup(false)} className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">✕</button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase text-slate-500 block mb-1">Subject</label>
                  <select value={formSubject} onChange={(e) => setFormSubject(e.target.value)} className="w-full h-12 px-3 rounded-xl border border-slate-300 bg-white">
                    <option value="">Select...</option>
                    <option value="English">English</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="French">French</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase text-slate-500 block mb-1">Level</label>
                  <input type="text" value={formLevel} onChange={(e) => setFormLevel(e.target.value)} placeholder="e.g. 3AM" className="w-full h-12 px-3 rounded-xl border border-slate-300" />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-slate-500 block mb-1">Assign Teacher</label>
                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                  {teachers.map(t => (
                    <button key={t.id} onClick={() => setFormTeacher(t.id)} className={`px-3 py-2 rounded-full text-[12px] font-bold whitespace-nowrap border ${formTeacher === t.id ? "bg-emerald-600 text-white border-emerald-600" : "bg-white border-slate-200 text-slate-700"}`}>
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-slate-500 block mb-1">Class Day</label>
                <div className="grid grid-cols-7 gap-1">
                  {DAYS.map((d, i) => (
                    <button key={d} onClick={() => setFormDay(i)} className={`py-2 rounded-xl text-[11px] font-bold ${formDay === i ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"}`}>{d}</button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div><label className="text-[10px] font-bold text-slate-500 block mb-1">Start</label><input type="time" value={formStart} onChange={(e) => setFormStart(e.target.value)} className="w-full h-11 px-2 rounded-xl border border-slate-300" /></div>
                <div><label className="text-[10px] font-bold text-slate-500 block mb-1">End</label><input type="time" value={formEnd} onChange={(e) => setFormEnd(e.target.value)} className="w-full h-11 px-2 rounded-xl border border-slate-300" /></div>
                <div><label className="text-[10px] font-bold text-slate-500 block mb-1">Fee (DA)</label><input type="number" value={formFee} onChange={(e) => setFormFee(e.target.value)} className="w-full h-11 px-2 rounded-xl border border-slate-300 font-bold" /></div>
              </div>

              <button onClick={createGroup} className="w-full h-12 rounded-full bg-emerald-600 text-white font-semibold shadow-sm spring-press">Create Group</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function Groups() {
  return <Suspense fallback={<div>Loading...</div>}><GroupsContent /></Suspense>;
}