import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  BarChart3,
  Car,
  ChevronDown,
  CircleDollarSign,
  ClipboardCheck,
  Compass,
  LayoutDashboard,
  Settings,
  ShieldAlert,
  Sparkles,
  Wrench,
  X,
} from "lucide-react";

import { navigationGroups, type NavigationGroup } from "@/config/navigation";
import { cn } from "@/lib/utils";

const groupIcons = {
  overview: LayoutDashboard,
  tracking: Compass,
  fleet: Car,
  costs: CircleDollarSign,
  maintenance: Wrench,
  operation: ClipboardCheck,
  reports: BarChart3,
  intelligence: Sparkles,
  administration: Settings,
} as const;

function groupHasActiveRoute(group: NavigationGroup, pathname: string) {
  return group.items.some((item) => pathname === item.path || pathname.startsWith(`${item.path}/`));
}

function NavigationGroupItem({ group, collapsed, onNavigate }: { group: NavigationGroup; collapsed: boolean; onNavigate?: () => void }) {
  const { pathname } = useLocation();
  const isActiveGroup = groupHasActiveRoute(group, pathname);
  const [isOpen, setIsOpen] = useState(isActiveGroup);
  const Icon = groupIcons[group.id as keyof typeof groupIcons] ?? ShieldAlert;
  const panelId = `navigation-group-${group.id}`;

  return (
    <section className="space-y-1">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        aria-controls={panelId}
        title={collapsed ? group.label : undefined}
        className={cn(
          "flex w-full items-center rounded-xl text-left text-xs font-bold uppercase tracking-[0.08em] text-slate-500 transition hover:bg-white hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2",
          collapsed ? "h-10 justify-center" : "h-10 gap-2 px-3",
        )}
      >
        <Icon className="h-4 w-4 shrink-0" strokeWidth={1.8} aria-hidden="true" />
        {!collapsed && <span className="min-w-0 flex-1 truncate">{group.label}</span>}
        {!collapsed && <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} aria-hidden="true" />}
      </button>

      <div id={panelId} hidden={!isOpen} className={cn("space-y-1", collapsed ? "" : "pl-2")}>
        {group.items.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            onClick={onNavigate}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) =>
              cn(
                "group flex min-h-10 items-start gap-2 rounded-xl py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2",
                collapsed ? "justify-center px-1" : "px-3",
                isActive ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-white hover:text-slate-900",
              )
            }
          >
            <span className={cn("min-w-0 flex-1 break-words leading-5", collapsed && "sr-only")}>{item.label}</span>
            {collapsed && <span aria-hidden="true" className="h-2 w-2 rounded-full bg-current" />}
            {!collapsed && (
              <span
                className={cn(
                  "mt-0.5 shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide",
                  item.status === "BETA" ? "bg-sky-100 text-sky-900" : "bg-amber-100 text-amber-900",
                )}
              >
                {item.status === "BETA" ? "BETA" : "Em desenvolvimento"}
              </span>
            )}
          </NavLink>
        ))}
      </div>
    </section>
  );
}

export function NavigationMenu({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  return (
    <nav aria-label="Navegação principal" className="space-y-2">
      {navigationGroups.map((group) => (
        <NavigationGroupItem key={group.id} group={group} collapsed={collapsed} onNavigate={onNavigate} />
      ))}
    </nav>
  );
}

export function MobileNavigation({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Navegação principal">
      <button type="button" aria-label="Fechar navegação" className="absolute inset-0 bg-slate-950/45" onClick={onClose} />
      <aside className="relative h-full w-[min(88vw,360px)] overflow-y-auto border-r border-slate-200 bg-[#f4f6f9] p-4 shadow-2xl">
        <div className="mb-5 flex items-center justify-between border-b border-slate-200 pb-4">
          <span className="text-sm font-bold tracking-[0.22em] text-slate-900">ZERITH</span>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
            aria-label="Fechar navegação"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <NavigationMenu collapsed={false} onNavigate={onClose} />
      </aside>
    </div>
  );
}
