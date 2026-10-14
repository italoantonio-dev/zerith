import {
  Building2,
  LogOut,
  Sun,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { NavigationMenu } from "@/components/navigation/NavigationMenu";
import { cn } from "@/lib/utils";

interface SidebarProps {
  collapsed: boolean;
}

export function Sidebar({ collapsed }: SidebarProps) {
  const { user, logout } = useAuth();

  return (
    <aside
      className={cn(
        "hidden shrink-0 flex-col border-r border-slate-200/70 bg-[#f4f6f9] transition-[width] duration-300 md:flex",
        collapsed ? "w-[88px]" : "w-[270px]"
      )}
    >
      <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-5 lg:px-4">
        <NavigationMenu collapsed={collapsed} />

        <div className="mx-2 my-5 border-t border-slate-200" />

        {!collapsed && (
          <div className="px-3 pb-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">Filiais</p>
          </div>
        )}

        <div className={cn("space-y-1 text-xs text-slate-500", collapsed && "flex flex-col items-center")}>
          <div className={cn("flex items-center", collapsed ? "justify-center py-2" : "gap-3 px-4 py-2")}>
            {collapsed ? <Building2 className="h-4 w-4" /> : <><span className="h-1.5 w-1.5 rounded-full bg-slate-300" /><span>{user?.company ?? "Matriz"}</span></>}
          </div>
          {!collapsed && (
            <div className="flex items-center gap-3 px-4 py-2">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
              <span>Operação principal</span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2 px-3 pb-5">
        <button
          type="button"
          className={cn(
            "flex h-12 w-full items-center rounded-2xl border border-slate-200 bg-white text-sm font-medium text-slate-600 shadow-sm transition-colors hover:text-slate-900",
            collapsed ? "justify-center" : "gap-3 px-4"
          )}
          title={collapsed ? "Modo claro" : undefined}
        >
          <Sun className="h-[18px] w-[18px]" strokeWidth={1.7} />
          {!collapsed && <span>Modo Claro</span>}
        </button>

        <button
          type="button"
          onClick={logout}
          className={cn(
            "flex h-10 w-full items-center rounded-xl text-xs font-medium text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600",
            collapsed ? "justify-center" : "gap-3 px-4"
          )}
          title={collapsed ? "Sair" : undefined}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </aside>
  );
}
