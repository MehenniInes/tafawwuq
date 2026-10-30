"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { ui } from "@/components/ui";

const localDate = (d = new Date()) =>
  new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_ORDER = [6, 0, 1, 2, 3, 4, 5];
const money = (n: number) => Number(n).toLocaleString() + " DA";

export default function GroupPage() {
  const { id } = useParams<{ id: string }>();
  const [subject, setSubject] = useState<any>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [date, setDate] = useState("");
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [days, setDays] = useState<number[]>([]);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [showSchedule, setShowSchedule] = useState(false);
  const [saving, setSaving] = useState(false);

  async function load(d: string) {
    const su = await supabase.from("subjects").select("*, teachers(name)").eq("id", id).single();
    setSubject(su.data);
    setDays(su.data?.days ?? []);
    setStart(su.data?.start_time ? su.data.start_time.slice(0, 5) : "");
    setEnd(su.data?.end_time ? su.data.end_time.slice(0, 5) : "");

    const en = await supabase
      .from("enrollments")
      .select("id, student_id, students(name)")
      .eq("subject_id", id)
      .eq("active", true);
    const ens = en.data ?? [];
    const ids = ens.map((e: any) => e.id);

    const latest = new Map<string, any>();
    let marked = new Set<string>();
    if (ids.length) {
      const cy = await supabase
        .from("cycle_status")
        .select("*")
        .in("enrollment_id", ids)
        .order("created_at", { ascending: false });
      (cy.data ?? []).forEach((c: any) => {
        if (!latest.has(c.enrollment_id)) latest.set(c.enrollment_id, c);
      });
      const cids = Array.from(latest.values()).map((c: any) => c.id);
      if (cids.length) {
        const at = await supabase.from("attendance").select("cycle_id").eq("date", d).in("cycle_id", cids);
        marked = new Set((at.data ?? []).map((a: any) => a.cycle_id));
      }
    }

    const list = ens
      .map((e: any) => {
        const c = latest.get(e.id);
        return {
          eid: e.id,
          studentId: e.student_id,
          name: e.students?.name ?? "?",
          cycle: c,
          marked: c ? marked.has(c.id) : false,
        };
      })
      .sort((a: any, b: any) => a.name.localeCompare(b.name));

    setRows(list);
    setSel(new Set(list.filter((r: any) => r.cycle && !r.cycle.month_finished && !r.marked).map((r: any) => r.eid)));
  }

  useEffect(() => {
    setDate(localDate());
  }, []);

  useEffect(() => {
    if (id && date) load(date);
  }, [id, date]);

  const canMark = (r: any) => r.cycle && !r.cycle.month_finished && !r.marked;
  const eligible = rows.filter(canMark);

  function toggle(eid: string) {
    const n = new Set(sel);
    if (n.has(eid)) n.delete(eid);
    else n.add(eid);
    setSel(n);
  }

  async function save() {
    if (sel.size === 0) return;
    setSaving(true);
    const payload = rows.filter((r) => sel.has(r.eid) && r.cycle).map((r) => ({ cycle_id: r.cycle.id, date }));
    const { error } = await supabase
      .from("attendance")
      .upsert(payload, { onConflict: "cycle_id,date", ignoreDuplicates: true });
    setSaving(false);
    if (error) return alert(error.message);
    load(date);
  }

  async function saveSchedule() {
    if (start && end && end <= start) return alert("End time must be after start time");
    const { error } = await supabase
      .from("subjects")
      .update({ days, start_time: start || null, end_time: end || null })
      .eq("id", id);
    if (error) return alert(error.message);
    setShowSchedule(false);
    load(date);
  }

  function toggleDay(d: number) {
    setDays(days.includes(d) ? days.filter((x) => x !== d) : [...days, d]);
  }

  if (!subject || !date) return <main className={ui.page}>Loading...</main>;

  const s0 = subject.start_time ? subject.start_time.slice(0, 5) : "";
  const e0 = subject.end_time ? subject.end_time.slice(0, 5) : "";
  const timeText = s0 ? (e0 ? `${s0} – ${e0}` : s0) : "no time";
  const scheduleText = (subject.days ?? []).length
    ? `${DAY_ORDER.filter((d) => subject.days.includes(d)).map((d) => DAYS[d]).join(", ")} · ${timeText}`
    : "No schedule yet";

  return (
    <main className={`${ui.page} pb-40`}>
      <Link href="/groups" className={ui.link}>
        Back to groups
      </Link>

      <div className={ui.card}>
        <h1 className="text-xl font-semibold">
          {subject.name}
          {subject.level ? ` · ${subject.level}` : ""}
        </h1>
        <p className={ui.muted}>{subject.teachers?.name}</p>
        <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
          <span className="text-sm">{scheduleText}</span>
          <button onClick={() => setShowSchedule(!showSchedule)} className={ui.link}>
            {showSchedule ? "Close" : "Edit schedule"}
          </button>
        </div>

        {showSchedule && (
          <div className="mt-3 space-y-3">
            <div className="flex flex-wrap gap-2">
              {DAY_ORDER.map((d) => (
                <button
                  key={d}
                  onClick={() => toggleDay(d)}
                  className={`rounded-xl border px-3 py-2 text-sm font-medium ${
                    days.includes(d)
                      ? "border-teal-700 bg-teal-700 text-white"
                      : "border-gray-300 bg-white text-gray-700"
                  }`}
                >
                  {DAYS[d]}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className={ui.label}>Starts</p>
                <input type="time" className={ui.input} value={start} onChange={(e) => setStart(e.target.value)} />
              </div>
              <div>
                <p className={ui.label}>Ends</p>
                <input type="time" className={ui.input} value={end} onChange={(e) => setEnd(e.target.value)} />
              </div>
            </div>
            <button onClick={saveSchedule} className={ui.btn}>
              Save schedule
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <input
          type="date"
          className="rounded-xl border border-gray-300 bg-white px-3 py-2"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <div className="flex-1" />
        <button onClick={() => setSel(new Set(eligible.map((r) => r.eid)))} className={ui.link}>
          Select all
        </button>
        <button onClick={() => setSel(new Set())} className={ui.link}>
          Clear
        </button>
      </div>

      {rows.length === 0 && <p className={ui.muted}>No students in this group yet.</p>}

      {rows.map((r) => (
        <div key={r.eid} className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white p-3">
          <label className="flex flex-1 items-center gap-3">
            <input
              type="checkbox"
              className="h-5 w-5 accent-teal-700"
              disabled={!canMark(r)}
              checked={sel.has(r.eid)}
              onChange={() => toggle(r.eid)}
            />
            <div className="min-w-0">
              <p className="truncate font-medium">{r.name}</p>
              <p className="text-xs text-gray-500">
                {!r.cycle
                  ? "No month started"
                  : r.marked
                  ? "Present on this date"
                  : r.cycle.month_finished
                  ? "Month finished, renew"
                  : `Session ${r.cycle.sessions_done} of ${r.cycle.sessions_total}`}
              </p>
            </div>
          </label>
          {r.cycle && (
            <span
              className={`text-sm font-medium ${Number(r.cycle.remaining) > 0 ? "text-red-600" : "text-teal-700"}`}
            >
              {Number(r.cycle.remaining) > 0 ? money(r.cycle.remaining) : "Paid"}
            </span>
          )}
          <Link href={`/students/${r.studentId}`} className="p-1 text-gray-400">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </Link>
        </div>
      ))}

      <div className="fixed inset-x-0 bottom-16 border-t border-gray-200 bg-white p-3">
        <div className="mx-auto max-w-lg">
          <button onClick={save} disabled={sel.size === 0 || saving} className={ui.btn}>
            {saving ? "Saving..." : `Save attendance (${sel.size})`}
          </button>
        </div>
      </div>
    </main>
  );
}