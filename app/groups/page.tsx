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
  const [showAdd, setShowAdd] = useState(false);

  // --- FORM STATES ---
  // 1. Group Form
  const [formTeacher, setFormTeacher] = useState("");
  const [formSubject, setFormSubject] = useState("");
  const [formLevel, setFormLevel] = useState("");
  const [formDay, setFormDay] = useState(3);
  const [formStart, setFormStart] = useState("14:00");
  const [formEnd, setFormEnd] = useState("15:30");
  const [formFee, setFormFee] = useState("1200");
  
  // 2. Subject Form
  const [subName, setSubName] = useState("");
  const [subFee, setSubFee] = useState("1200");

  // 3. Teacher Form
  const [tchName, setTchName] = useState("");
  const [tchPhone, setTchPhone] = useState("");

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

  // --- CREATE HANDLERS ---
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
    setShowAdd(false);
    load();
  }

  async function createSubject() {
    if (!subName || !subFee) return alert("Please fill all fields");
    // Note: If your 'subjects' table requires a teacher, we might need to add that.
    // Assuming it can be null for a base subject folder.
    const { error } = await supabase.from("subjects").insert({
      name: subName,
      monthly_price: Number(subFee),
      teacher_share_percent: 50,
    });
    if (error) return alert(error.message);
    setShowAdd(false);
    load();
  }

  async function createTeacher() {
    if (!tchName) return alert("Please enter a name");
    const { error } = await supabase.from("teachers").insert({
      name: tchName,
      phone: tchPhone || null,
    });
    if (error) return alert(error.message);
    setShowAdd(false);
    load();
  }

  const filteredGroups = subjects.filter((s) => `${s.name} ${s.level ?? ""}`.toLowerCase().includes(q.toLowerCase()));
  const filteredSubjects = subjects.filter((s) => `${s.name}`.toLowerCase().includes(q.toLowerCase()));
  const filteredTeachers = teachers.filter((t) => `${t.name}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <main className={ui.page}>
      <header className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[12px] font-medium text-slate-500">Academy Setup</p>
          <h1 className="font-display text-[24px] font-extrabold text-slate-900">Classes & Staff</h1>
        </div>
        {/* Dynamic Button */}
        <button onClick={() => setShowAdd(true)} className="h-11 px-4 rounded-full bg-indigo-600 text-white text-[13px] font-semibold shadow-xs spring-press">
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

      {/* GROUPS TAB */}
      {subTab === "groups" && (
        <div className="grid grid-cols-2 gap-3">
          {filteredGroups.map((s) => {
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

      {/* SUBJECTS TAB */}
      {subTab === "subjects" && (
        <div className="space-y-3.5 pt-1">
          {filteredSubjects.map((s) => (
            <div key={s.id} className="pt-0.5">
              <div className="flex items-end justify-between pr-2">
                <div className="subject-folder-ear bg-white border-t border-l border-r border-indigo-200 px-3.5 py-1.5 inline-flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                  <span className="text-[11px] font-extrabold uppercase text-indigo-700">{subjects.filter(x => x.name === s.name).length} Groups</span>
                </div>
                <span className="text-[11px] font-bold text-slate-500 pb-1">Base: {Number(s.monthly_price).toLocaleString()} DA</span>
              </div>
              <div className="subject-folder-tab bg-white rounded-2xl border border-indigo-200 p-4 shadow-2xs -mt-[1px]">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0">{s.name.slice(0, 2).toUpperCase()}</div>
                  <div>
                    <h3 className="font-display text-[17px] font-extrabold text-slate-900">{s.name}</h3>
                    <p className="text-[11px] text-slate-500">Syllabus & Active Levels</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TEACHERS TAB */}
      {subTab === "teachers" && (
        <div className="space-y-2.5">
          {filteredTeachers.map((t) => (
            <div key={t.id} className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-800 font-bold flex items-center justify-center">{t.name.substring(0, 2).toUpperCase()}</div>
                <div>
                  <h3 className="font-bold text-slate-900">{t.name}</h3>
                  <p className="text-[12px] text-slate-500">{t.phone || "No phone"}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- CORRECT FORM MODALS --- */}
      
      {/* 1. New Group Sheet */}
      {showAdd && subTab === "groups" && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div onClick={() => setShowAdd(false)} className="absolute inset-0 bg-slate-900/45 backdrop-blur-[1px] backdrop-fade" />
          <div className="relative bg-white rounded-t-[28px] p-5 shadow-2xl sheet-up w-full max-w-md mx-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-display font-extrabold text-[19px]">New Group & Schedule</h3>
              <button onClick={() => setShowAdd(false)} className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">✕</button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[11px] font-bold uppercase text-slate-500 block mb-1">Subject</label><input type="text" value={formSubject} onChange={(e) => setFormSubject(e.target.value)} placeholder="English" className="w-full h-12 px-3 rounded-xl border border-slate-300" /></div>
                <div><label className="text-[11px] font-bold uppercase text-slate-500 block mb-1">Level</label><input type="text" value={formLevel} onChange={(e) => setFormLevel(e.target.value)} placeholder="e.g. 3AM" className="w-full h-12 px-3 rounded-xl border border-slate-300" /></div>
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase text-slate-500 block mb-1">Assign Teacher</label>
                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                  {teachers.map(t => (
                    <button key={t.id} onClick={() => setFormTeacher(t.id)} className={`px-3 py-2 rounded-full text-[12px] font-bold whitespace-nowrap border ${formTeacher === t.id ? "bg-emerald-600 text-white border-emerald-600" : "bg-white border-slate-200 text-slate-700"}`}>{t.name}</button>
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

      {/* 2. New Subject Sheet */}
      {showAdd && subTab === "subjects" && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div onClick={() => setShowAdd(false)} className="absolute inset-0 bg-slate-900/45 backdrop-blur-[1px] backdrop-fade" />
          <div className="relative bg-white rounded-t-[28px] p-5 shadow-2xl sheet-up w-full max-w-md mx-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-display font-extrabold text-[19px]">New Subject Folder</h3>
              <button onClick={() => setShowAdd(false)} className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-bold uppercase text-slate-500 block mb-1">Subject Name</label>
                <input type="text" value={subName} onChange={(e) => setSubName(e.target.value)} placeholder="e.g. Physics, French, Mathematics" className="w-full h-12 px-4 rounded-xl border border-slate-300 text-[14px]" />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase text-slate-500 block mb-1">Default Fee (DA)</label>
                <input type="number" value={subFee} onChange={(e) => setSubFee(e.target.value)} className="w-full h-12 px-4 rounded-xl border border-slate-300 text-[14px] font-semibold" />
              </div>
              <button onClick={createSubject} className="w-full h-12 rounded-full bg-violet-600 text-white font-semibold shadow-sm spring-press">Save Subject</button>
            </div>
          </div>
        </div>
      )}

      {/* 3. New Teacher Sheet */}
      {showAdd && subTab === "teachers" && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div onClick={() => setShowAdd(false)} className="absolute inset-0 bg-slate-900/45 backdrop-blur-[1px] backdrop-fade" />
          <div className="relative bg-white rounded-t-[28px] p-5 shadow-2xl sheet-up w-full max-w-md mx-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-display font-extrabold text-[19px]">New Teacher</h3>
              <button onClick={() => setShowAdd(false)} className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-bold uppercase text-slate-500 block mb-1">Teacher Full Name</label>
                <input type="text" value={tchName} onChange={(e) => setTchName(e.target.value)} placeholder="e.g. Benali Karim" className="w-full h-12 px-4 rounded-xl border border-slate-300 text-[14px]" />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase text-slate-500 block mb-1">Phone Number</label>
                <input type="tel" value={tchPhone} onChange={(e) => setTchPhone(e.target.value)} placeholder="0550 12 34 56" className="w-full h-12 px-4 rounded-xl border border-slate-300 text-[14px]" />
              </div>
              <button onClick={createTeacher} className="w-full h-12 rounded-full bg-amber-600 text-white font-semibold shadow-sm spring-press">Add Teacher</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function Groups() {
  return <Suspense fallback={<div className="p-6 text-center text-sm">Loading...</div>}><GroupsContent /></Suspense>;
}