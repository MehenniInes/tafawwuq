"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const icons: Record<string, React.ReactNode> = {
  today: (
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </>
  ),
  groups: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  students: (
    <>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </>
  ),
  money: (
    <>
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="2" />
      <path d="M6 12h.01M18 12h.01" />
    </>
  ),
  report: (
    <>
      <path d="M3 3v18h18" />
      <path d="M8 16v-4M13 16V8M18 16v-7" />
    </>
  ),
};

const tabs = [
  { href: "/today", label: "Today", icon: "today" },
  { href: "/groups", label: "Groups", icon: "groups" },
  { href: "/students", label: "Students", icon: "students" },
  { href: "/", label: "Money", icon: "money" },
  { href: "/report", label: "Reports", icon: "report" },
];

export default function BottomNav() {
  const path = usePathname();
  if (path === "/login") return null;

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 h-[78px] bg-white border-t border-slate-200/90 px-1.5 pt-1.5 pb-2 grid grid-cols-5 items-center">
      {tabs.map((t) => {
        const active = t.href === "/" ? path === "/" : path.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className="flex flex-col items-center justify-center gap-1 h-full spring-press"
          >
            <span
              className={`w-14 h-7 rounded-full flex items-center justify-center transition-colors ${
                active ? "bg-indigo-100 text-indigo-700" : "text-slate-500"
              }`}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {icons[t.icon]}
              </svg>
            </span>
            <span
              className={`text-[11px] ${
                active ? "font-bold text-slate-900" : "font-medium text-slate-500"
              }`}
            >
              {t.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}