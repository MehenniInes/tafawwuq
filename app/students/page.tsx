"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { ui } from "@/components/ui";

const money = (n: number) => Number(n).toLocaleString() + " DA";
const initials = (n: string) => n.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");

export default function Students() {
  const [students, setStudents] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [joined, setJoined] = useState<Set<string>>(new Set());
  const [owed, setOwed] = useState<Record<string, number>>({});
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");

  // Add/Enroll state
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [studentId, setStudentId] = useState("");
  const [subjectId, setSubjectId] = useState("");

  async function load() {
    const [st, su, cy, en] = await Promise.all([
      supabase.from("students").select("*").order("name"),
      supabase.from("subjects").select("*, teachers(name)").order("name"),
      supabase.from("cycle_status").select("student_id, remaining"),
      supabase.from("enrollments").select("student_id, subject_id"),
    ]);
    setStudents(st.data ?? []);
    setSubjects(su.data ?? []);
    setJoined(new Set((en.data ?? []).map((e: any) => `${e.student_id}|${e.subject_id}`)));
    const map: Record<string, number> = {};
    (cy.data ?? []).forEach((c: any) => { map[c.student_id] = (map[c.student_id] ?? 0) + Number(c.remaining); });
    setOwed(map);
  }
  useEffect(() => { load(); }, []);

  async function addStudent() {
    if (!name) return;
    const { error } = await supabase.from("students").insert({ name, phone });
    if (error) return alert(error.message);
    setName(""); setPhone(""); setShowAdd(false); load();
  }

  async function enroll() {
    if (!studentId || !subjectId) return alert("Select both");
    
    // Rule 3: Duplicate Enrollment
    if (joined.has(`${studentId}|${subjectId}`)) return alert("This student is already enrolled in this group.");
    
    const s = subjects.find(x => x.id === subjectId);
    const fee = Number(s.monthly_price);
    const { data, error } = await supabase.from("enrollments").insert({ student_id: studentId, subject_id: subjectId, monthly_fee: fee }).select().single();
    if (error) return alert(error.message);
    await supabase.from("cycles").insert({ enrollment_id: data.id, fee, teacher_share: fee * (s.teacher_share_percent / 100) });
    setShowAdd(false); load();
  }

  // Filter & Group
  const filtered = students.filter(s => {
    if (!s.name.toLowerCase().includes(q.toLowerCase())) return false;
    if (filter === "owes" && (owed[s.id] ?? 0) === 0) return false;
    if (filter === "paid" && (owed[s.id] ?? 0) > 0) return false;
    return true;
  });

  const sections: Record<string, any[]> = {};
  filtered.forEach(s => {
    const l = s.name[0].toUpperCase();
    if (!sections[l]) sections[l] = [];
    sections[l].push(s);
  });
  const letters = Object.keys(sections).sort();

  return (
    <main className={ui.page + " relative"}>
      <header className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[12px] font-medium text-slate-500"><span className="text-indigo-600 font-bold">{students.length}</span> Enrolled Students</p>
          <h1 className="font-display text-[24px] font-extrabold text-slate-900">Directory</h1>
        </div>
        <button onClick={() => setShowAdd(true)} className="h-11 px-4 rounded-full bg-indigo-600 text-white text-[13px] font-semibold shadow-xs spring-press">+ Add Student</button>
      </header>

      <div className="flex gap-2 mb-4">
        <input type="text" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name..." className="flex-1 h-10 px-4 rounded-full border border-slate-200 text-[13px] outline-none focus:ring-2 focus:ring-indigo-600" />
        <button className="h-10 px-3 rounded-full border border-slate-200 bg-white text-[11px] font-bold">A–Z</button>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4">
        {["all", "owes", "paid"].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-1.5 rounded-full text-[12px] font-semibold ${filter === f ? "bg-indigo-600 text-white" : "bg-white border border-slate-200"}`}>
            {f === "all" ? `All (${students.length})` : f === "owes" ? "Owes" : "Paid Up"}
          </button>
        ))}
      </div>

      <div className="relative flex">
        <div className="flex-1 pr-6 space-y-4">
          {letters.map(l => (
            <div key={l} id={`sec-${l}`} className="scroll-mt-4">
              <p className="text-[12px] font-extrabold text-indigo-600 mb-1">{l}</p>
              <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
                {sections[l].map(s => {
                  const isPaid = (owed[s.id] ?? 0) === 0;
                  return (
                    <Link key={s.id} href={`/students/${s.id}`} className="flex justify-between items-center px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl font-bold text-[12px] flex items-center justify-center ${isPaid ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>{initials(s.name)}</div>
                        <div><p className="font-bold text-[14px] text-slate-900">{s.name}</p><p className="text-[11px] text-slate-500">{s.phone || "No phone"}</p></div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${isPaid ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                        {isPaid ? "Paid ✓" : `Owes ${money(owed[s.id])}`}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        {/* Sticky A-Z Rail */}
        <div className="sticky top-4 w-5 bg-white/90 rounded-full py-1.5 flex flex-col items-center gap-0.5 border border-slate-200">
          {letters.map(l => (
            <a key={l} href={`#sec-${l}`} className="text-[9px] font-extrabold text-slate-500 hover:text-indigo-600">{l}</a>
          ))}
        </div>
      </div>

      {/* Add Student Sheet */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div onClick={() => setShowAdd(false)} className="absolute inset-0 bg-slate-900/45 backdrop-blur-[1px] backdrop-fade" />
          <div className="relative bg-white rounded-t-[28px] p-5 shadow-2xl sheet-up w-full max-w-md mx-auto">
             <h3 className="font-display font-extrabold text-lg mb-4">New Student / Enroll</h3>
             <div className="space-y-3">
               <input type="text" placeholder="Full Name" value={name} onChange={(e)=>setName(e.target.value)} className="w-full h-12 px-4 rounded-xl border border-slate-300" />
               <input type="tel" placeholder="Phone (optional)" value={phone} onChange={(e)=>setPhone(e.target.value)} className="w-full h-12 px-4 rounded-xl border border-slate-300" />
               <button onClick={addStudent} className="w-full h-12 rounded-full bg-indigo-600 text-white font-semibold">Save Student</button>
               <div className="border-t border-slate-200 my-2" />
               <select onChange={(e)=>setStudentId(e.target.value)} className="w-full h-12 px-4 rounded-xl border border-slate-300"><option value="">Choose Student to Enroll</option>{students.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select>
               <select onChange={(e)=>setSubjectId(e.target.value)} className="w-full h-12 px-4 rounded-xl border border-slate-300"><option value="">Choose Group</option>{subjects.map(s=><option key={s.id} value={s.id}>{s.name} · {s.level}</option>)}</select>
               <button onClick={enroll} className="w-full h-12 rounded-full bg-emerald-600 text-white font-semibold">Enroll Student</button>
             </div>
          </div>
        </div>
      )}
    </main>
  );
}