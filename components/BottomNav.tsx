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
  { href: "/report", label: "Report", icon: "report" },
];

export default function BottomNav() {
  const path = usePathname();
  if (path === "/login") return null;
  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 flex h-16 border-t border-gray-200 bg-white">
      {tabs.map((t) => {
        const active = t.href === "/" ? path === "/" : path.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`flex flex-1 flex-col items-center justify-center gap-1 text-xs font-medium ${
              active ? "text-teal-700" : "text-gray-400"
            }`}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {icons[t.icon]}
            </svg>
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}