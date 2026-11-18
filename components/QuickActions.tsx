"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const SHOW = ["/", "/today", "/groups", "/students", "/report"];

const actions = [
  { href: "/pay", title: "Record a payment", sub: "Find a student and enter the amount", color: "bg-teal-700" },
  { href: "/today", title: "Take attendance", sub: "Today's groups", color: "bg-brand" },
  { href: "/students/new", title: "Add a student", sub: "Name, phone and groups in one step", color: "bg-accent" },
  { href: "/groups/new", title: "Add a group", sub: "Teacher, subject, price and days", color: "bg-amber-300" },
];

export default function QuickActions() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  if (!SHOW.includes(path)) return null;

  return (
    <>
      {open && <div className="fixed inset-0 z-[60] bg-black/40" onClick={() => setOpen(false)} />}
      {open && (
        <div className="fixed inset-x-0 bottom-0 z-[70] rounded-t-3xl bg-white p-4 pb-24 shadow-2xl">
          <div className="mx-auto max-w-lg space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-lg font-bold text-navy">What do you want to do?</p>
              <button onClick={() => setOpen(false)} className="text-sm font-semibold text-gray-500">
                Close
              </button>
            </div>
            {actions.map((a) => (
              <Link
                key={a.href}
                href={a.href}
                onClick={() => setOpen(false)}
                className="flex items-stretch overflow-hidden rounded-2xl border border-gray-200 bg-white active:bg-gray-50"
              >
                <span className={`w-2 ${a.color}`} />
                <span className="flex-1 px-4 py-3">
                  <span className="block font-semibold text-navy">{a.title}</span>
                  <span className="block text-sm text-gray-500">{a.sub}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Quick actions"
          className="fixed bottom-20 right-4 z-[80] flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white shadow-xl shadow-brand/40 transition active:scale-95"
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      )}
    </>
  );
}