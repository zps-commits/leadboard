'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, Columns3, LayoutDashboard, Settings, Users } from 'lucide-react';
import { IS_DEMO } from '@/lib/config';

const LINKS = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/leads', label: 'Leads', icon: Users },
  { href: '/pipeline', label: 'Pipeline', icon: Columns3 },
  { href: '/activity', label: 'Activity', icon: Activity },
  { href: '/settings', label: 'Settings', icon: Settings },
] as const;

function useIsCurrent() {
  const pathname = usePathname();
  return (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));
}

export function Sidebar() {
  const isCurrent = useIsCurrent();

  return (
    <aside className="hidden w-60 shrink-0 border-r border-line bg-surface lg:block">
      <div className="flex h-full flex-col p-4">
        <p className="px-2 text-lg font-semibold">LeadBoard</p>
        <p className="mt-0.5 px-2 text-sm text-muted">Pipeline for one person</p>

        <nav aria-label="Sections" className="mt-6">
          <ul className="space-y-1">
            {LINKS.map((link) => {
              const current = isCurrent(link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={current ? 'page' : undefined}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${
                      current ? 'bg-ink text-surface' : 'text-ink hover:bg-paper'
                    }`}
                  >
                    <link.icon aria-hidden="true" size={17} />
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {IS_DEMO ? (
          <p className="mt-auto rounded-lg border border-line bg-paper p-3 text-xs text-muted">
            Demonstration mode. Everything you enter stays in this browser and is never sent
            anywhere.
          </p>
        ) : null}
      </div>
    </aside>
  );
}

export function MobileNav() {
  const isCurrent = useIsCurrent();

  return (
    <nav
      aria-label="Sections"
      className="sticky bottom-0 z-10 border-t border-line bg-surface lg:hidden"
    >
      <ul className="flex">
        {LINKS.map((link) => {
          const current = isCurrent(link.href);
          return (
            <li key={link.href} className="flex-1">
              <Link
                href={link.href}
                aria-current={current ? 'page' : undefined}
                className={`flex flex-col items-center gap-1 px-1 py-2 text-xs font-medium ${
                  current ? 'text-ink' : 'text-muted'
                }`}
              >
                <link.icon aria-hidden="true" size={19} />
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
