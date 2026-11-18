"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { ui } from "@/components/ui";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_ORDER = [6, 0, 1, 2, 3, 4, 5];

export default function Groups() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      const [su, en] = await Promise.all([
        supabase.from("subjects").select("*, teachers(name)").order("name"),
        supabase.from("enrollments").select("id, subject_id").eq("active", true),
      ]);
      setSubjects(su.data ?? []);
      setEnrollments(en.data ?? []);
    })();
  }, []);

  const filtered = subjects.filter((s) =>
    `${s.name} ${s.level ?? ""} ${s.teachers?.name ?? ""}`.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <main className={ui.page}>
      <h1 className={ui.title}>Groups</h1>

      <Link href="/groups/new" className={`${ui.btn} block text-center`}>
        Add group
      </Link>

      <input
        className={ui.input}
        placeholder="Search subject, level or teacher"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      {filtered.map((s) => {
        const count = enrollments.filter((e) => e.subject_id === s.id).length;
        const dayText = DAY_ORDER.filter((d) => (s.days ?? []).includes(d)).map((d) => DAYS[d]).join(", ");
        const a = s.start_time ? s.start_time.slice(0, 5) : "";
        const b = s.end_time ? s.end_time.slice(0, 5) : "";
        return (
          <Link key={s.id} href={`/groups/${s.id}`} className={`${ui.card} block`}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-semibold">
                  {s.name}
                  {s.level ? ` · ${s.level}` : ""}
                </p>
                <p className={ui.muted}>
                  {s.teachers?.name} · {count} students
                </p>
              </div>
              {dayText ? (
                <p className="shrink-0 text-right text-sm font-semibold">
                  {a ? (b ? `${a} - ${b}` : a) : ""}
                  <span className="block text-xs font-normal text-gray-500">{dayText}</span>
                </p>
              ) : (
                <span className="shrink-0 rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">
                  No schedule
                </span>
              )}
            </div>
          </Link>
        );
      })}

      <Link href="/setup" className={`${ui.link} block text-center`}>
        Teachers and subjects
      </Link>
    </main>
  );
}