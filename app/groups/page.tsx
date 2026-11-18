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

  // If the URL changes (like clicking New Group from the FAB), update the tab
  useEffect(() => {
    if (initialTab) setSubTab(initialTab);
  }, [initialTab]);

  const filtered = subjects.filter((s) => `${s.name} ${s.level ?? ""}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <main className={ui.page}>
      <header className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[12px] font-medium text-slate-500">Academy Setup</p>
          <h1 className="font-display text-[24px] font-extrabold text-slate-900">Classes & Staff</h1>
        </div>
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
                <div className="flex justify-between pt-1">
                  <span className="px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 text-[11px] font-extrabold">{day}</span>
                  <span className="text-[11px] font-semibold text-slate-400">{s.start_time?.slice(0,5)}</span>
                </div>
                <div className="my-auto">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase block">{s.name}</span>
                  <h3 className="font-display text-[22px] font-extrabold text-slate-900 leading-tight mt-0.5">{s.level || "General"}</h3>
                  <p className="text-[11px] text-slate-500 truncate mt-1">{s.teachers?.name}</p>
                </div>
                <div className="pt-2 border-t border-slate-100 flex justify-between">
                  <span className="text-[11px] font-bold text-slate-700">👤 {count}</span>
                  <span className="text-[11px] font-extrabold text-slate-900">{Number(s.monthly_price).toLocaleString()} DA</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {subTab === "subjects" && (
        <div className="space-y-3.5 pt-1">
          {filtered.map((s) => (
            <div key={s.id} className="pt-0.5">
              <div className="flex items-end justify-between pr-2">
                <div className="subject-folder-ear bg-white border-t border-l border-r border-indigo-200 px-3.5 py-1.5 inline-flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                  <span className="text-[11px] font-extrabold uppercase text-indigo-700">Groups</span>
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

      {subTab === "teachers" && (
        <div className="space-y-2.5">
          {teachers.map((t) => (
            <div key={t.id} className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-800 font-bold flex items-center justify-center">{t.name.substring(0, 2).toUpperCase()}</div>
                <div>
                  <h3 className="font-bold text-slate-900">{t.name}</h3>
                  <p className="text-[12px] text-slate-500">Teacher</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

export default function Groups() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-sm text-slate-500">Loading groups...</div>}>
      <GroupsContent />
    </Suspense>
  );
}