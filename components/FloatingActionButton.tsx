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
      {/* FAB Button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-[90px] right-4 z-40 w-14 h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-900/30 flex items-center justify-center spring-press"
        aria-label="Quick Create"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>

      {/* Quick Create Sheet */}
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
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => go("/groups?tab=subjects&add=true")} className="p-4 rounded-2xl bg-violet-50/90 border border-violet-200/70 text-left spring-press">
                <div className="w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center mb-3 shadow-2xs">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/><path d="M12 10v6M9 13h6"/></svg>
                </div>
                <p className="font-display text-[14px] font-bold text-slate-900">New Subject</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Syllabus folder & base fee</p>
              </button>

              <button onClick={() => go("/setup?add=true")} className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200/70 text-left spring-press">
                <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center mb-3 shadow-2xs">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
                </div>
                <p className="font-display text-[14px] font-bold text-slate-900">New Teacher</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Profile & revenue split %</p>
              </button>

              <button onClick={() => go("/students?add=true")} className="p-4 rounded-2xl bg-indigo-50/90 border border-indigo-200/70 text-left spring-press">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center mb-3 shadow-2xs">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/></svg>
                </div>
                <p className="font-display text-[14px] font-bold text-slate-900">New Student</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Enroll & pick group chips</p>
              </button>

              <button onClick={() => go("/groups?add=true")} className="p-4 rounded-2xl bg-emerald-50/90 border border-emerald-200/70 text-left spring-press">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center mb-3 shadow-2xs">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>
                </div>
                <p className="font-display text-[14px] font-bold text-slate-900">New Group</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Square group tile & time</p>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}