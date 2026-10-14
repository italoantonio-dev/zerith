import { ArrowLeft, BookOpenCheck, CircleDashed, Clock3 } from "lucide-react";
import { Link } from "react-router-dom";

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import {
  type NavigationItem,
  navigationGroups,
  reportModules,
} from "@/config/navigation";
import { cn } from "@/lib/utils";

function sectionFor(module: NavigationItem) {
  return navigationGroups.find((group) => group.items.some((item) => item.id === module.id));
}

export function DevelopmentModuleContent({ module }: { module: NavigationItem }) {
  const section = sectionFor(module);
  const sectionLabel = section?.label ?? "navegação";

  return (
    <section className="mx-auto max-w-4xl" aria-labelledby="development-module-title">
      <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_8px_32px_rgba(15,23,42,0.05)]">
        <div className="border-b border-slate-100 bg-slate-50/80 px-6 py-8 sm:px-9">
          <span role="status" className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-amber-900">
            <Clock3 className="h-4 w-4" aria-hidden="true" />
            Em desenvolvimento
          </span>
          <p className="zerith-kicker mt-5">{sectionLabel}</p>
          <h1 id="development-module-title" className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            {module.label}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">{module.description}</p>
        </div>

        <div className="grid gap-6 px-6 py-8 sm:px-9 lg:grid-cols-[minmax(0,1fr)_240px]">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Objetivo</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{module.objective}</p>

            <h2 className="mt-7 text-base font-semibold text-slate-900">Situação atual</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Este módulo está planejado na navegação, mas ainda não possui contrato de backend, dados operacionais ou ações disponíveis nesta versão.
            </p>
          </div>

          <aside className="rounded-2xl border border-slate-200 bg-slate-50 p-5" aria-labelledby="planned-capabilities-title">
            <div className="flex items-center gap-2 text-slate-700">
              <BookOpenCheck className="h-5 w-5" aria-hidden="true" />
              <h2 id="planned-capabilities-title" className="text-sm font-semibold">Recursos previstos</h2>
            </div>
            <ul className="mt-4 space-y-3 text-sm leading-5 text-slate-600">
              {module.plannedCapabilities.map((capability) => (
                <li key={capability} className="flex gap-2">
                  <CircleDashed className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                  <span>{capability}</span>
                </li>
              ))}
            </ul>
          </aside>
        </div>

        <div className="border-t border-slate-100 px-6 py-5 sm:px-9">
          <Link
            to={module.sectionPath}
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Voltar para {sectionLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}

export function DevelopmentModulePage({ module }: { module: NavigationItem }) {
  return (
    <DashboardLayout>
      <DevelopmentModuleContent module={module} />
    </DashboardLayout>
  );
}

export function ReportsCatalogContent() {
  return (
    <section className="mx-auto max-w-5xl" aria-labelledby="reports-catalog-title">
      <header className="rounded-[28px] border border-slate-200 bg-white px-6 py-8 shadow-[0_8px_32px_rgba(15,23,42,0.05)] sm:px-9">
        <span role="status" className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-amber-900">
          <Clock3 className="h-4 w-4" aria-hidden="true" />
          Em desenvolvimento
        </span>
        <p className="zerith-kicker mt-5">Inteligência operacional</p>
        <h1 id="reports-catalog-title" className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Catálogo de relatórios</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          {reportModules.length} relatórios planejados. Cada item declara seu estado e dependências antes de receber dados, filtros ou exportações.
        </p>
      </header>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {reportModules.map((module) => (
          <Link
            key={module.id}
            to={module.path}
            className={cn(
              "group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition",
              "hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2",
            )}
          >
            <span className="text-[11px] font-bold uppercase tracking-wide text-amber-700">Em desenvolvimento</span>
            <h2 className="mt-2 text-base font-semibold text-slate-900 group-hover:text-slate-700">{module.label}</h2>
            <p className="mt-2 text-sm leading-5 text-slate-600">{module.description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function ReportsCatalogPage() {
  return (
    <DashboardLayout>
      <ReportsCatalogContent />
    </DashboardLayout>
  );
}
