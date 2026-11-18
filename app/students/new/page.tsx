"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { ui } from "@/components/ui";

export default function NewStudent() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [chosen, setChosen] = useState<Record<string, string>>({});
  const [q, setQ] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) return router.push("/login");
      const su = await supabase.from("subjects").select("*, teachers(name)").order("name");
      setSubjects(su.data ?? []);
    })();
  }, [router]);

  function toggle(s: any) {
    const next = { ...chosen };
    if (s.id in next) delete next[s.id];
    else next[s.id] = String(s.monthly_price);
    setChosen(next);
  }

  async function save() {
    if (!name.trim()) return alert("Enter the student's name");
    setSaving(true);
    const st = await supabase
      .from("students")
      .insert({ name: name.trim(), phone: phone || null, notes: notes || null })
      .select()
      .single();
    if (st.error) {
      setSaving(false);
      return alert(st.error.message);
    }
    for (const s of subjects.filter((x) => x.id in chosen)) {
      const fee = Number(chosen[s.id]);
      if (!fee || fee <= 0) continue;
      const en = await supabase
        .from("enrollments")
        .insert({ student_id: st.data.id, subject_id: s.id, monthly_fee: fee })
        .select()
        .single();
      if (en.error) {
        alert(`Could not add to ${s.name}: ${en.error.message}`);
        continue;
      }
      await supabase.from("cycles").insert({
        enrollment_id: en.data.id,
        fee,
        teacher_share: (fee * Number(s.teacher_share_percent)) / 100,
      });
    }
    setSaving(false);
    router.push(`/students/${st.data.id}`);
  }

  const count = Object.keys(chosen).length;
  const shown = subjects.filter((s) =>
    `${s.name} ${s.level ?? ""} ${s.teachers?.name ?? ""}`.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <main className={`${ui.page} pb-40`}>
      <Link href="/students" className={ui.link}>
        Back to students
      </Link>
      <h1 className={ui.title}>New student</h1>

      <div className={`${ui.card} space-y-3`}>
        <input autoFocus className={ui.input} placeholder="Student name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className={ui.input} type="tel" placeholder="Phone (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <textarea className={ui.input} rows={2} placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      <p className={ui.label}>Groups ({count} selected)</p>
      {subjects.length > 6 && (
        <input className={ui.input} placeholder="Search groups" value={q} onChange={(e) => setQ(e.target.value)} />
      )}
      {subjects.length === 0 && (
        <p className={ui.muted}>
          No groups yet.{" "}
          <Link href="/groups/new" className={ui.link}>
            Add a group
          </Link>
        </p>
      )}

      {shown.map((s) => {
        const on = s.id in chosen;
        return (
          <div
            key={s.id}
            className={`rounded-2xl border-2 bg-white p-3 ${on ? "border-brand" : "border-gray-200"}`}
          >
            <button onClick={() => toggle(s)} className="flex w-full items-center gap-3 text-left">
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                  on ? "border-brand bg-brand text-white" : "border-gray-300"
                }`}
              >
                {on && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12l5 5L20 7" />
                  </svg>
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">
                  {s.name}
                  {s.level ? ` · ${s.level}` : ""}
                </span>
                <span className="block text-sm text-gray-500">{s.teachers?.name}</span>
              </span>
              <span className="text-sm font-semibold tabular-nums">{Number(s.monthly_price).toLocaleString()} DA</span>
            </button>
            {on && (
              <div className="mt-3">
                <p className={ui.label}>Monthly fee for this student (DA)</p>
                <input
                  className={`${ui.input} mt-1`}
                  type="number"
                  value={chosen[s.id]}
                  onChange={(e) => setChosen({ ...chosen, [s.id]: e.target.value })}
                />
              </div>
            )}
          </div>
        );
      })}

      <div className="fixed inset-x-0 bottom-16 border-t border-gray-200 bg-white p-3">
        <div className="mx-auto max-w-lg">
          <button onClick={save} disabled={saving} className={ui.btn}>
            {saving
              ? "Saving..."
              : count > 0
              ? `Save student and add to ${count} group${count > 1 ? "s" : ""}`
              : "Save student"}
          </button>
        </div>
      </div>
    </main>
  );
}