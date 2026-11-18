"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function FloatingActionButton() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  function go(path: string) {
    setOpen(false);
    router.push(path);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-[90px] right-4 z-40 w-14 h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-900/30 flex items-center justify-center spring-press"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div onClick={() => setOpen(false)} className="absolute inset-0 bg-slate-900/45 backdrop-blur-[1px] backdrop-fade" />
          <div className="relative bg-white rounded-t-[28px] px-5 pt-3 pb-7 shadow-2xl sheet-up w-full max-w-md mx-auto">
            <div className="w-9 h-1 rounded-full bg-slate-300 mx-auto mb-4" />
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display text-[19px] font-extrabold text-slate-900">Quick Create</h3>
                <p className="text-[12px] text-slate-500">Add anything to your center in seconds</p>
              </div>
              <button onClick={() => setOpen(false)} className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => go("/groups?tab=subjects&add=true")} className="p-4 rounded-2xl bg-violet-50 border border-violet-200 text-left spring-press">
                <div className="w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center mb-3">📁</div>
                <p className="font-bold text-slate-900 text-[14px]">New Subject</p>
              </button>
              <button onClick={() => go("/groups?tab=teachers&add=true")} className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-left spring-press">
                <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center mb-3">🎓</div>
                <p className="font-bold text-slate-900 text-[14px]">New Teacher</p>
              </button>
              <button onClick={() => go("/students?add=true")} className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-left spring-press">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center mb-3">👤</div>
                <p className="font-bold text-slate-900 text-[14px]">New Student</p>
              </button>
              <button onClick={() => go("/groups?add=true")} className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-left spring-press">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center mb-3">⊞</div>
                <p className="font-bold text-slate-900 text-[14px]">New Group</p>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}