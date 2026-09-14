import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Menu, Search, SlidersHorizontal } from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

interface HeaderProps {
  onToggleSidebar: () => void;
  sidebarCollapsed: boolean;
}

export function Header({ onToggleSidebar, sidebarCollapsed }: HeaderProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((name) => name[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "ZE";

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    const term = search.trim();
    navigate(term ? "/veiculos?search=" + encodeURIComponent(term) : "/veiculos");
  };

  return (
    <header className="relative z-40 grid h-[72px] shrink-0 grid-cols-[auto_1fr_auto] items-center gap-4 border-b border-white/5 bg-[#202735] px-4 text-white md:px-7">
      <div className="flex items-center gap-5">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full text-slate-200 hover:bg-white/10 hover:text-white"
          onClick={onToggleSidebar}
          aria-label={sidebarCollapsed ? "Expandir menu" : "Recolher menu"}
        >
          <Menu className="h-5 w-5" />
        </Button>

        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="hidden bg-transparent p-0 text-[18px] font-medium tracking-[0.32em] text-white shadow-none hover:bg-transparent sm:block"
          aria-label="Ir para a visão global"
        >
          ZERITH
        </button>
      </div>

      <form onSubmit={submitSearch} className="mx-auto w-full max-w-[610px]">
        <label className="flex h-11 items-center gap-3 rounded-full border border-white/10 bg-[#fff9f8] px-4 text-slate-500 shadow-sm">
          <Search className="h-4 w-4 shrink-0" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm text-slate-700 outline-none placeholder:text-slate-400"
            placeholder="Buscar placa, motorista ou veículo..."
            aria-label="Buscar na frota"
          />
          <SlidersHorizontal className="h-3.5 w-3.5 shrink-0 text-slate-400" />
        </label>
      </form>

      <div className="flex items-center gap-1 sm:gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="relative hidden h-10 w-10 rounded-full text-slate-300 hover:bg-white/10 hover:text-white sm:inline-flex"
          aria-label="Notificações"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#ff5c62]" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-11 gap-2 rounded-full px-1.5 text-white hover:bg-white/10"
              aria-label="Abrir menu do usuário"
            >
              <Avatar className="h-8 w-8 border border-white/20 bg-white/10">
                <AvatarFallback className="bg-transparent text-xs font-semibold text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="hidden max-w-28 truncate text-sm font-medium lg:block">{user?.name}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60 rounded-2xl border-slate-200 bg-white p-2 shadow-xl">
            <DropdownMenuLabel className="px-3 py-2">
              <span className="block text-sm text-slate-900">{user?.name}</span>
              <span className="block truncate text-xs font-normal text-slate-500">{user?.email}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="rounded-xl px-3 py-2 text-sm text-slate-600">
              {user?.company}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={logout} className="rounded-xl px-3 py-2 text-sm text-red-600">
              Sair do sistema
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
