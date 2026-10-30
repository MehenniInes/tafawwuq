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
        supabase
          .from("cycle_status")
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
      (cy.data ?? []).forEach((c: any) => {
        if (!latest.has(c.enrollment_id)) latest.set(c.enrollment_id, c);
      });
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

  return (
    <main className={ui.page}>
      <div>
        <p className={ui.muted}>{dateLabel || "\u00A0"}</p>
        <h1 className={ui.title}>Today</h1>
      </div>

      {!ready && <p className={ui.muted}>Loading...</p>}

      {renewals.length > 0 && (
        <section className="space-y-2">
          <p className={ui.label}>Renewals due ({renewals.length})</p>
          {renewals.map((c) => (
            <Link
              key={c.id}
              href={`/students/${c.student_id}`}
              className="block rounded-2xl border border-amber-300 bg-amber-50 p-3"
            >
              <p className="font-semibold">{c.student}</p>
              <p className="text-sm text-gray-600">
                {c.subject} · month finished
                {Number(c.remaining) > 0 ? ` · left ${money(c.remaining)}` : " · paid"}
              </p>
            </Link>
          ))}
        </section>
      )}

      {ready && groups.length === 0 && (
        <div className={`${ui.card} text-center`}>
          <p className="font-medium">No groups scheduled today</p>
          <Link href="/groups" className={`${ui.link} mt-2 inline-block`}>
            Set group schedules
          </Link>
        </div>
      )}

      {groups.map((g) => {
        const isNext = g.id === next?.id;
        const a = g.start_time ? g.start_time.slice(0, 5) : "--:--";
        const b = g.end_time ? g.end_time.slice(0, 5) : "";
        return (
          <Link
            key={g.id}
            href={`/groups/${g.id}`}
            className={`flex gap-4 rounded-2xl border bg-white p-4 ${
              isNext ? "border-teal-700 ring-1 ring-teal-700" : "border-gray-200"
            } ${g.done ? "opacity-60" : ""}`}
          >
            <div className="w-16 shrink-0 tabular-nums">
              <p className="text-lg font-semibold">{a}</p>
              {b && <p className="text-xs text-gray-500">to {b}</p>}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">
                {g.name}
                {g.level ? ` · ${g.level}` : ""}
              </p>
              <p className={ui.muted}>
                {g.teachers?.name} · {g.students} students
              </p>
            </div>
            <div className="self-center text-sm font-medium">
              {g.done ? (
                <span className="text-gray-500">Done</span>
              ) : isNext ? (
                <span className="rounded-full bg-teal-700 px-3 py-1 text-white">Next up</span>
              ) : (
                <span className="text-teal-700">Open</span>
              )}
            </div>
          </Link>
        );
      })}

      <Link href="/groups" className={`${ui.link} block text-center`}>
        All groups
      </Link>
    </main>
  );
}