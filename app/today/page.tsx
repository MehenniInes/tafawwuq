"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { ui } from "@/components/ui";

const money = (n: number) => Number(n).toLocaleString() + " DA";
const localDate = (d = new Date()) =>
  new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

export default function Today() {
  const router = useRouter();
  const [groups, setGroups] = useState<any[]>([]);
  const [renewals, setRenewals] = useState<any[]>([]);
  const [ready, setReady] = useState(false);
  const [dateLabel, setDateLabel] = useState("");

  useEffect(() => {
    (async () => {
      setDateLabel(
        new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })
      );
      const { data } = await supabase.auth.getSession();
      if (!data.session) return router.push("/login");
      const dow = new Date().getDay();
      const [su, en, at, cy, st] = await Promise.all([
        supabase.from("subjects").select("*, teachers(name)").order("start_time"),
        supabase.from("enrollments").select("id, subject_id").eq("active", true),
        supabase.from("attendance").select("cycles(enrollment_id)").eq("date", localDate()),
        supabase.from("cycle_status")
          .select("id, enrollment_id, student_id, subject_id, month_finished, remaining, created_at")
          .order("created_at", { ascending: false }),
        supabase.from("students").select("id, name"),
      ]);
      const subs = su.data ?? [];
      const marked = new Set((at.data ?? []).map((a: any) => a.cycles?.enrollment_id));
      const list = subs
        .filter((s: any) => (s.days ?? []).includes(dow))
        .map((s: any) => {
          const ens = (en.data ?? []).filter((e: any) => e.subject_id === s.id);
          return { ...s, students: ens.length, done: ens.some((e: any) => marked.has(e.id)) };
        });
      setGroups(list);
      const latest = new Map<string, any>();
      (cy.data ?? []).forEach((c: any) => { if (!latest.has(c.enrollment_id)) latest.set(c.enrollment_id, c); });
      const ren = Array.from(latest.values())
        .filter((c: any) => c.month_finished)
        .map((c: any) => {
          const s = subs.find((x: any) => x.id === c.subject_id);
          return {
            ...c,
            student: (st.data ?? []).find((x: any) => x.id === c.student_id)?.name ?? "?",
            subject: s ? `${s.name}${s.level ? ` · ${s.level}` : ""}` : "",
          };
        });
      setRenewals(ren);
      setReady(true);
    })();
  }, [router]);

  const next = groups.find((g) => !g.done);
  const doneCount = groups.filter((g) => g.done).length;

  return (
    <main className={ui.page}>
      <div>
        <p className={ui.muted}>{dateLabel || "\u00A0"}</p>
        <h1 className={ui.title}>Teaching Today</h1>
      </div>

      {!ready && <p className={ui.muted}>Loading...</p>}

      {renewals.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1.5 px-0.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            Renewals Due ({renewals.length})
          </h2>
          {renewals.map((c) => (
            <Link key={c.id} href={`/students/${c.student_id}`}
              className="block rounded-2xl border border-amber-200 bg-amber-50 p-3.5 spring-press">
              <p className="font-display font-bold text-slate-900">{c.student}</p>
              <p className="text-[12px] text-amber-900 mt-0.5">
                {c.subject} · month finished
                {Number(c.remaining) > 0 ? ` · left ${money(c.remaining)}` : " · paid"}
              </p>
            </Link>
          ))}
        </section>
      )}

      {ready && groups.length === 0 && (
        <div className={`${ui.card} text-center`}>
          <p className="font-display font-bold text-slate-900">No groups scheduled today</p>
          <Link href="/groups" className={`${ui.link} mt-2 inline-block`}>Set group schedules</Link>
        </div>
      )}

      {groups.length > 0 && (
        <div className="flex items-center justify-between px-0.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">TODAY'S CLASSES</span>
          <span className="text-[11px] font-semibold text-indigo-600">{doneCount}/{groups.length} done</span>
        </div>
      )}

      <div className="space-y-3">
        {groups.map((g) => {
          const isNext = g.id === next?.id;
          const a = g.start_time ? g.start_time.slice(0, 5) : "--:--";
          const b = g.end_time ? g.end_time.slice(0, 5) : "";
          return (
            <Link key={g.id} href={`/groups/${g.id}`}
              className={`block rounded-2xl border bg-white p-4 border-l-4 spring-press ${
                isNext ? "border-slate-200 border-l-indigo-600 ring-1 ring-indigo-200" :
                g.done ? "border-slate-200 border-l-slate-300 opacity-60" :
                "border-slate-200 border-l-emerald-500"}`}>
              <div className="flex items-center justify-between text-[12px] mb-1.5">
                <span className="font-bold text-indigo-600 tabular-nums">
                  {a}{b ? ` – ${b}` : ""}
                </span>
                <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                  g.done ? "bg-slate-100 text-slate-500" :
                  isNext ? "bg-indigo-600 text-white" : "bg-emerald-50 text-emerald-700"}`}>
                  {g.done ? "Done" : isNext ? "Next up" : "Open"}
                </span>
              </div>
              <h3 className="font-display text-[17px] font-extrabold text-slate-900">
                {g.name}{g.level ? ` · ${g.level}` : ""}
              </h3>
              <p className="text-[12px] text-slate-500 mt-0.5">
                {g.teachers?.name} · {g.students} students
              </p>
            </Link>
          );
        })}
      </div>

      <Link href="/groups" className={`${ui.link} block text-center`}>All groups</Link>
    </main>
  );
}