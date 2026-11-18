"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ui } from "@/components/ui";

const money = (n: number) => Number(n).toLocaleString() + " DA";
const initials = (n: string) => n.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
const localDate = () => new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);

export default function Home() {
  const router = useRouter();
  const [tab, setTab] = useState<"students" | "teachers">("students");
  const [cycles, setCycles] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [ready, setReady] = useState(false);

  // Payment Modal State
  const [showPay, setShowPay] = useState(false);
  const [payAmt, setPayAmt] = useState("");
  const [payTarget, setPayTarget] = useState<any>(null);

  async function load() {
    const { data } = await supabase.auth.getSession();
    if (!data.session) return router.push("/login");
    const [c, t, po, st, su] = await Promise.all([
      supabase.from("cycle_status").select("*").order("created_at", { ascending: false }),
      supabase.from("teacher_balance").select("*").order("name"),
      supabase.from("teacher_payouts").select("*").order("paid_on", { ascending: false }),
      supabase.from("students").select("id, name"),
      supabase.from("subjects").select("id, name, level"),
    ]);
    setCycles(c.data ?? []); setTeachers(t.data ?? []); setPayouts(po.data ?? []);
    setStudents(st.data ?? []); setSubjects(su.data ?? []); setReady(true);
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
    const amount = Number(payAmt);
    if (!amount || amount <= 0) return alert("Enter amount");
    
    // Rule 2: Double payment guard
    if (Number(payTarget.remaining) <= 0) return alert("You already marked payment for this month.");

    const { error } = await supabase.from("payments").insert({
      cycle_id: payTarget.id, amount, paid_on: localDate(),
    });
    if (error) return alert(error.message);
    setShowPay(false); setPayAmt(""); load();
  }

  async function handleTeacherPay(teacherId: string) {
    const amt = prompt("Enter amount to pay teacher:");
    if (!amt || Number(amt) <= 0) return;
    const { error } = await supabase.from("teacher_payouts").insert({
      teacher_id: teacherId, amount: Number(amt), paid_on: localDate(), note: "Monthly payout"
    });
    if (error) return alert(error.message);
    load();
  }

  if (!ready) return <main className={ui.page}>Loading...</main>;

  return (
    <main className={ui.page}>
      <header className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[12px] font-medium text-slate-500">Cashflow & Payroll</p>
          <h1 className="font-display text-[24px] font-extrabold text-slate-900">Money</h1>
        </div>
        <button onClick={() => setTab(tab === "students" ? "teachers" : "students")} className="h-10 px-3.5 rounded-full bg-emerald-600 text-white text-[12px] font-semibold shadow-2xs spring-press">
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
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Pending Student Payments ({unpaidStudents.length})</h2>
            <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
              {unpaidStudents.map((c) => (
                <div key={c.id} className="px-4 py-3 flex items-center justify-between gap-3">
                  <div><p className="font-bold text-[14px] text-slate-900">{nameOf(c.student_id)}</p><p className="text-[11px] text-slate-500">{subjOf(c.subject_id)}</p></div>
                  <button onClick={() => { setPayTarget(c); setPayAmt(c.remaining.toString()); setShowPay(true); }} className="h-8 px-3 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold spring-press">
                    Collect {money(c.remaining)}
                  </button>
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
            <p className="text-[12px] text-indigo-200 mt-0.5">Calculated from active group enrollments</p>
          </div>
          <div className="space-y-2.5">
            {teachers.map((t) => {
              const bal = Number(t.owed) - Number(t.paid_out);
              return (
                <div key={t.teacher_id} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center">{initials(t.name)}</div>
                      <div><h3 className="font-bold text-slate-900">{t.name}</h3><p className="text-[11px] text-slate-500">Earned {money(t.owed)}</p></div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[11px] font-bold ${bal > 0 ? "bg-amber-100 text-amber-800" : "bg-emerald-50 text-emerald-700"}`}>{bal > 0 ? `${money(bal)} Due` : "Paid"}</span>
                  </div>
                  {bal > 0 && (
                    <button onClick={() => handleTeacherPay(t.teacher_id)} className="w-full h-10 rounded-xl bg-indigo-600 text-white font-semibold text-[13px] spring-press">Confirm Payout</button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Payment Bottom Sheet */}
      {showPay && payTarget && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div onClick={() => setShowPay(false)} className="absolute inset-0 bg-slate-900/45 backdrop-blur-[1px] backdrop-fade" />
          <div className="relative bg-white rounded-t-[28px] p-5 shadow-2xl sheet-up w-full max-w-md mx-auto">
             <h3 className="font-display font-extrabold text-lg mb-4">Collect Student Fee</h3>
             <form onSubmit={handleStudentPay} className="space-y-4">
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex justify-between items-center">
                  <div><span className="text-[10px] font-bold uppercase text-emerald-800 block">Remaining Balance</span><span className="text-[12px] text-emerald-700">{nameOf(payTarget.student_id)}</span></div>
                  <span className="font-display text-[20px] font-extrabold text-emerald-700">{money(payTarget.remaining)}</span>
                </div>
                <input type="number" required value={payAmt} onChange={(e)=>setPayAmt(e.target.value)} className="w-full h-12 px-4 rounded-xl border border-slate-300 text-[15px] font-extrabold text-emerald-700 focus:ring-2 focus:ring-emerald-600 outline-none" placeholder="Amount paying..." />
                <button type="submit" className="w-full h-12 rounded-full bg-emerald-600 text-white font-semibold spring-press">Confirm & Issue Receipt</button>
             </form>
          </div>
        </div>
      )}
    </main>
  );
}