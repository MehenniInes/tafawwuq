"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ui } from "@/components/ui";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const money = (n: number) => Number(n).toLocaleString() + " DA";

export default function Today() {
  const router = useRouter();
  const [groups, setGroups] = useState<any[]>([]);
  const [renewals, setRenewals] = useState<any[]>([]);
  const [ready, setReady] = useState(false);
  
  const [scope, setScope] = useState<"mine" | "all">("mine");
  const [selectedDay, setSelectedDay] = useState(new Date().getDay());
  
  // Attendance Sheet State
  const [activeGroup, setActiveGroup] = useState<any>(null);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split("T")[0]);
  const [studentsList, setStudentsList] = useState<any[]>([]);
  const [marked, setMarked] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) return router.push("/login");
      
      const [su, en, cy, st] = await Promise.all([
        supabase.from("subjects").select("*, teachers(name)").order("start_time"),
        supabase.from("enrollments").select("id, subject_id, student_id, students(name)").eq("active", true),
        supabase.from("cycle_status").select("*").eq("month_finished", true).gt("remaining", 0),
        supabase.from("students").select("id, name"),
      ]);

      const list = (su.data ?? []).map((s: any) => ({
        ...s,
        enrolled: (en.data ?? []).filter((e: any) => e.subject_id === s.id)
      }));
      setGroups(list);
      
      const ren = (cy.data ?? []).map((c: any) => ({
        ...c,
        student: (st.data ?? []).find((x:any) => x.id === c.student_id)?.name ?? "?",
        subject: list.find((x:any) => x.id === c.subject_id)?.name ?? "?"
      }));
      setRenewals(ren);
      setReady(true);
    })();
  }, [router]);

  function openAttendance(g: any) {
    setActiveGroup(g);
    setStudentsList(g.enrolled);
    setMarked(new Set(g.enrolled.map((e: any) => e.student_id)));
  }

  async function saveAttendance() {
    const { data: existing } = await supabase.from("attendance").select("id").eq("subject_id", activeGroup.id).eq("date", attendanceDate);
    if (existing && existing.length > 0) {
      return alert("You already marked attendance for this date.");
    }
    alert("Attendance saved successfully!");
    setActiveGroup(null);
  }

  // Filter groups based on day and scope
  const dayGroups = groups.filter(g => {
    if (!(g.days ?? []).includes(selectedDay)) return false;
    if (scope === "mine") return g.teachers?.name === "Mehenni Ines"; // Replace with actual current user logic if needed
    return true;
  });

  if (!ready) return <main className={ui.page}>Loading...</main>;

  return (
    <main className={ui.page}>
      <header className="flex justify-between items-center mb-4">
        <div>
          <p className="text-[12px] font-medium text-slate-500">{new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" })}</p>
          <h1 className="font-display text-[24px] font-extrabold text-slate-900">Teaching Today</h1>
        </div>
        
        {/* My / All Toggle */}
        <div className="bg-slate-200/80 p-1 rounded-full flex items-center text-[11px] font-semibold">
          <button onClick={() => setScope("mine")} className={`px-3 py-1.5 rounded-full transition-all ${scope === "mine" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600"}`}>My Classes</button>
          <button onClick={() => setScope("all")} className={`px-3 py-1.5 rounded-full transition-all ${scope === "all" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600"}`}>All Center</button>
        </div>
      </header>

      {/* Renewal Notification Pill */}
      {renewals.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
             <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
             <span className="text-[12px] font-bold text-amber-950">{renewals.length} Renewal due · {renewals[0].student}</span>
          </div>
          <span className="text-[11px] font-bold text-amber-700 cursor-pointer">Tap to view</span>
        </div>
      )}

      {/* Day Strip with Dots */}
      <div className="grid grid-cols-7 gap-1 bg-white p-1.5 rounded-2xl border border-slate-200 mb-6 shadow-2xs">
        {DAYS.map((d, i) => {
          const hasClass = groups.some(g => (g.days ?? []).includes(i) && (scope === "all" || g.teachers?.name === "Mehenni Ines"));
          return (
            <button key={d} onClick={() => setSelectedDay(i)} className={`py-2 rounded-xl flex flex-col items-center gap-1 ${selectedDay === i ? "bg-indigo-600 text-white" : "text-slate-600"}`}>
              <span className={`text-[10px] font-semibold ${selectedDay === i ? "text-indigo-200" : "text-slate-400"}`}>{d[0]}</span>
              <span className="font-display text-[13px] font-bold">{i + 16}</span>
              <span className={`w-1 h-1 rounded-full ${hasClass ? (selectedDay === i ? "bg-white" : "bg-indigo-500") : "bg-transparent"}`}></span>
            </button>
          );
        })}
      </div>

      <div className="space-y-3">
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{DAYS[selectedDay]} Schedule</h2>
        {dayGroups.length === 0 && <p className={ui.muted}>No classes scheduled today.</p>}
        
        {dayGroups.map((g) => (
          <div key={g.id} onClick={() => openAttendance(g)} className="bg-white rounded-2xl border border-slate-200 border-l-4 border-l-indigo-600 p-4 shadow-2xs spring-press cursor-pointer">
            <div className="flex justify-between text-[12px] mb-1.5">
              <span className="font-bold text-indigo-600">⏱ {g.start_time?.slice(0,5)} - {g.end_time?.slice(0,5)}</span>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold">{g.level || "General"}</span>
            </div>
            <h3 className="font-display text-[17px] font-extrabold text-slate-900">{g.name}</h3>
            <p className="text-[12px] text-slate-500 mt-0.5">{g.teachers?.name} · {g.enrolled.length} students</p>
          </div>
        ))}
      </div>

      {/* Attendance Sheet */}
      {activeGroup && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div onClick={() => setActiveGroup(null)} className="absolute inset-0 bg-slate-900/45 backdrop-blur-[1px] backdrop-fade" />
          <div className="relative bg-white rounded-t-[28px] p-5 shadow-2xl sheet-up w-full max-w-md mx-auto max-h-[85%] flex flex-col">
             <div className="flex justify-between items-center mb-3">
                <h3 className="font-display text-lg font-extrabold">{activeGroup.name} · {activeGroup.level}</h3>
                <button onClick={() => setActiveGroup(null)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">✕</button>
             </div>
             
             <div className="mb-4">
               <label className="text-[11px] font-bold uppercase text-slate-500 block mb-1">Date</label>
               <input type="date" value={attendanceDate} onChange={(e) => setAttendanceDate(e.target.value)} className="w-full h-11 px-3 rounded-xl border border-slate-300" />
             </div>

             <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
               {studentsList.map((s) => (
                 <div key={s.student_id} onClick={() => {
                   const newSet = new Set(marked);
                   newSet.has(s.student_id) ? newSet.delete(s.student_id) : newSet.add(s.student_id);
                   setMarked(newSet);
                 }} className="py-3 flex justify-between items-center cursor-pointer">
                   <p className="font-bold text-[14px]">{s.students?.name}</p>
                   <span className={`px-3 py-1 rounded-full text-[11px] font-bold ${marked.has(s.student_id) ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"}`}>
                     {marked.has(s.student_id) ? "Present ✓" : "Absent"}
                   </span>
                 </div>
               ))}
             </div>

             <button onClick={saveAttendance} className="w-full h-12 rounded-full bg-indigo-600 text-white font-semibold mt-4 spring-press">Done</button>
          </div>
        </div>
      )}
    </main>
  );
}