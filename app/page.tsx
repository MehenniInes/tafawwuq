"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ui } from "@/components/ui";

const money = (n: number) => Number(n).toLocaleString() + " DA";

export default function Home() {
  const router = useRouter();
  const [tab, setTab] = useState<"students" | "teachers">("students");
  const [cycles, setCycles] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [ready, setReady] = useState(false);

  // Modals
  const [payStudent, setPayStudent] = useState<any>(null);
  const [payTeacher, setPayTeacher] = useState<any>(null);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("Cash (Espèces)");
  const [note, setNote] = useState("");

  async function load() {
    const { data } = await supabase.auth.getSession();
    if (!data.session) return router.push("/login");
    const [c, t, st, su] = await Promise.all([
      supabase.from("cycle_status").select("*"),
      supabase.from("teacher_balance").select("*"),
      supabase.from("students").select("id, name"),
      supabase.from("subjects").select("id, name, level"),
    ]);
    setCycles(c.data ?? []); setTeachers(t.data ?? []); setStudents(st.data ?? []); setSubjects(su.data ?? []);
    setReady(true);
  }
  useEffect(() => { load(); }, []);

  const sum = (arr: any[], k: string) => arr.reduce((s, x) => s + Number(x[k]), 0);
  const collected = sum(cycles, "paid");
  const stillOwed = sum(cycles, "remaining");
  const teacherPaid = sum(teachers, "paid_out");
  const net = collected - teacherPaid;
  const unpaidStudents = cycles.filter(c => Number(c.remaining) > 0);

  const nameOf = (id: string) => students.find((s) => s.id === id)?.name ?? "?";
  const subjOf = (id: string) => {
    const s = subjects.find((x) => x.id === id);
    return s ? `${s.name}${s.level ? ` · ${s.level}` : ""}` : "";
  };

  async function handleStudentPay(e: any) {
    e.preventDefault();
    const amt = Number(amount);
    if (amt <= 0 || amt > payStudent.remaining) return alert("Invalid amount");
    const { error } = await supabase.from("payments").insert({ cycle_id: payStudent.id, amount: amt, note });
    if (error) return alert(error.message);
    setPayStudent(null); load();
  }

  async function handleTeacherPay(e: any) {
    e.preventDefault();
    const { error } = await supabase.from("teacher_payouts").insert({ teacher_id: payTeacher.teacher_id, amount: Number(amount), note });
    if (error) return alert(error.message);
    setPayTeacher(null); load();
  }

  if (!ready) return <main className={ui.page}>Loading...</main>;

  return (
    <main className={ui.page}>
      <header className="flex items-center justify-between mb-4">
        <div><p className="text-[12px] font-medium text-slate-500">Cashflow & Payroll</p><h1 className="font-display text-[24px] font-extrabold text-slate-900">Money</h1></div>
        
        {/* Dynamic Top Button */}
        <button 
          onClick={() => {
            if (tab === "students") {
              // If students tab, open the first unpaid student, or alert if none
              const next = unpaidStudents[0];
              if (next) { setPayStudent(next); setAmount(next.remaining.toString()); }
              else alert("No unpaid students right now!");
            } else {
              // If teachers tab, open the first unpaid teacher
              const next = teachers.find(t => Number(t.owed) > Number(t.paid_out));
              if (next) { setPayTeacher(next); setAmount((Number(next.owed) - Number(next.paid_out)).toString()); }
              else alert("All teachers are paid up!");
            }
          }} 
          className="h-10 px-4 rounded-full bg-emerald-600 text-white text-[12px] font-semibold shadow-2xs spring-press"
        >
          + {tab === "students" ? "Collect Fee" : "Pay Teacher"}
        </button>
      </header>

      <div className="grid grid-cols-2 bg-slate-200/80 p-1 rounded-2xl text-[13px] font-semibold mb-4">
        <button onClick={() => setTab("students")} className={`py-2 rounded-xl transition-all ${tab === "students" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600"}`}>Student Fees</button>
        <button onClick={() => setTab("teachers")} className={`py-2 rounded-xl transition-all ${tab === "teachers" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600"}`}>Teacher Payouts</button>
      </div>

      {tab === "students" && (
        <div className="space-y-4">
          <div className="rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-900 p-5 text-white shadow-md">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-100">NET BALANCE NOW</span>
            <p className="font-display text-[32px] font-extrabold mt-1">{money(net)}</p>
            <div className="grid grid-cols-3 gap-2 mt-4 pt-3.5 border-t border-white/15">
              <div><span className="text-[10px] text-emerald-200 block uppercase">Collected</span><span className="font-bold">{money(collected)}</span></div>
              <div><span className="text-[10px] text-emerald-200 block uppercase">Still Owed</span><span className="font-bold text-amber-200">{money(stillOwed)}</span></div>
              <div><span className="text-[10px] text-emerald-200 block uppercase">Teachers Paid</span><span className="font-bold">{money(teacherPaid)}</span></div>
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Pending Payments ({unpaidStudents.length})</h2>
            <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
              {unpaidStudents.map((c) => (
                <div key={c.id} className="px-4 py-3 flex items-center justify-between">
                  <div><p className="font-bold text-[14px] text-slate-900">{nameOf(c.student_id)}</p><p className="text-[11px] text-slate-500">{subjOf(c.subject_id)}</p></div>
                  <button onClick={() => { setPayStudent(c); setAmount(c.remaining.toString()); }} className="h-8 px-3 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">Collect</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "teachers" && (
        <div className="space-y-4">
          <div className="rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-slate-900 p-5 text-white shadow-md">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-200">PAYROLL SUMMARY</span>
            <p className="font-display text-[30px] font-extrabold mt-1">{money(sum(teachers, "owed") - teacherPaid)}</p>
          </div>
          <div className="space-y-2.5">
            {teachers.map((t) => {
              const bal = Number(t.owed) - Number(t.paid_out);
              return (
                <div key={t.teacher_id} className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between">
                  <div><h3 className="font-bold text-slate-900">{t.name}</h3><p className="text-[11px] text-slate-500">Earned {money(t.owed)}</p></div>
                  {bal > 0 ? <button onClick={() => { setPayTeacher(t); setAmount(bal.toString()); }} className="h-8 px-3 rounded-full bg-indigo-600 text-white text-[11px] font-bold">Pay</button> : <span className="text-[11px] font-bold text-emerald-600">Paid ✓</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Collect Fee Sheet */}
      {payStudent && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div onClick={() => setPayStudent(null)} className="absolute inset-0 bg-slate-900/45 backdrop-blur-[1px] backdrop-fade" />
          <div className="relative bg-white rounded-t-[28px] p-5 shadow-2xl sheet-up w-full max-w-md mx-auto">
            <h3 className="font-display font-extrabold text-lg mb-4">Collect Student Fee</h3>
            <form onSubmit={handleStudentPay} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold uppercase text-slate-500 block mb-1">Select Student</label>
                <div className="h-12 px-4 rounded-xl border border-slate-300 flex items-center font-bold">{nameOf(payStudent.student_id)} (Owes {money(payStudent.remaining)})</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[11px] font-bold uppercase text-slate-500 block mb-1">Amount (DA)</label><input type="number" value={amount} onChange={(e)=>setAmount(e.target.value)} className="w-full h-12 px-4 rounded-xl border border-slate-300 text-[15px] font-extrabold text-emerald-700" /></div>
                <div><label className="text-[11px] font-bold uppercase text-slate-500 block mb-1">Method</label><select value={method} onChange={(e)=>setMethod(e.target.value)} className="w-full h-12 px-3 rounded-xl border border-slate-300 bg-white"><option>Cash (Espèces)</option><option>BaridiMob</option></select></div>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex justify-between items-center">
                <div><span className="text-[11px] font-bold uppercase text-emerald-800 block">Remaining Balance</span><span className="text-[12px] text-emerald-700">Full settlement · Receipt saved</span></div>
                <span className="font-display text-[20px] font-extrabold text-emerald-700">{money(payStudent.remaining - Number(amount || 0))}</span>
              </div>
              <button type="submit" className="w-full h-12 rounded-full bg-emerald-600 text-white font-semibold shadow-sm spring-press">Confirm & Issue Receipt</button>
            </form>
          </div>
        </div>
      )}

      {/* Teacher Payroll Sheet */}
      {payTeacher && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div onClick={() => setPayTeacher(null)} className="absolute inset-0 bg-slate-900/45 backdrop-blur-[1px] backdrop-fade" />
          <div className="relative bg-white rounded-t-[28px] p-5 shadow-2xl sheet-up w-full max-w-md mx-auto">
            <div className="mb-4"><span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold">TEACHER PAYROLL</span><h3 className="font-display text-lg font-extrabold mt-1">{payTeacher.name}</h3></div>
            <form onSubmit={handleTeacherPay} className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2">
                <div className="flex justify-between text-[12px]"><span className="text-slate-500">Total Tuition</span><span className="font-bold">{money(payTeacher.owed)}</span></div>
                <div className="flex justify-between text-[12px]"><span className="text-slate-500">Teacher Share</span><span className="font-extrabold text-indigo-700">{money(payTeacher.owed - payTeacher.paid_out)}</span></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[11px] font-bold uppercase text-slate-500 block mb-1">Amount (DA)</label><input type="number" value={amount} onChange={(e)=>setAmount(e.target.value)} className="w-full h-12 px-4 rounded-xl border border-slate-300 text-[15px] font-extrabold" /></div>
                <div><label className="text-[11px] font-bold uppercase text-slate-500 block mb-1">Method</label><select value={method} onChange={(e)=>setMethod(e.target.value)} className="w-full h-12 px-3 rounded-xl border border-slate-300 bg-white"><option>Cash (Espèces)</option><option>BaridiMob</option></select></div>
              </div>
              <input type="text" placeholder="Note (e.g. November 2026)" value={note} onChange={(e)=>setNote(e.target.value)} className="w-full h-12 px-4 rounded-xl border border-slate-300" />
              <button type="submit" className="w-full h-12 rounded-full bg-indigo-600 text-white font-semibold shadow-sm spring-press">Confirm Teacher Payment</button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}