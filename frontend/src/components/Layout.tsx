import { useState, type ReactNode } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";

function IconDashboard() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  );
}

function IconCalculo() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M9 8h6M9 12h.01M13 12h.01M9 16h.01M13 16h.01" strokeLinecap="round" />
    </svg>
  );
}

function IconVendas() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path d="M3 4h2l2.5 12.5a1 1 0 0 0 1 .8h8.7a1 1 0 0 0 1-.75L20 8H6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9.5" cy="20" r="1.2" />
      <circle cx="17.5" cy="20" r="1.2" />
    </svg>
  );
}

function IconAnalises() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path d="M4 4v16h16" strokeLinecap="round" />
      <path d="M8 15l3.5-4 3 2.5L19 8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const navItems = [
  { to: "/", label: "Dashboard", end: true, icon: <IconDashboard /> },
  { to: "/calculos", label: "Cálculos de Preço", end: false, icon: <IconCalculo /> },
  { to: "/vendas", label: "Vendas", end: false, icon: <IconVendas /> },
  { to: "/analises", label: "Análises", end: false, icon: <IconAnalises /> },
];

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <img src="/logo.png" alt="Loja Automotiva" className="h-10 w-10" />
      <div>
        <p className="text-sm font-bold leading-tight text-primary">Loja Automotiva</p>
        <p className="text-[11px] text-muted">Gestão Comercial</p>
      </div>
    </div>
  );
}

export default function Layout({ children }: { children?: ReactNode }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await fetch("/api/auth/sign-out", {
      method: "POST",
      credentials: "include",
    });
    navigate("/login");
  };

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="px-6 py-6">
        <Brand />
      </div>

      <nav className="mt-2 flex-1 space-y-1 px-3">
        <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-widest text-muted">
          Menu
        </p>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary text-background"
                  : "text-muted hover:bg-white/[0.03] hover:text-primary"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={
                    isActive ? "text-background" : "text-muted group-hover:text-primary"
                  }
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-border p-4">
        <div className="flex items-center gap-3 rounded-xl bg-surface-strong px-3 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-background">
            {user?.name?.charAt(0).toUpperCase() ?? "U"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-primary">{user?.name}</p>
            <p className="truncate text-xs text-muted">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Sair"
            className="rounded-lg border border-border p-2 text-muted transition-colors hover:border-danger/40 hover:text-danger"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
              <path d="M9 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-border bg-background lg:block">
        {sidebar}
      </aside>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-72 bg-background shadow-2xl animate-fade-in">
            <button
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 rounded-lg border border-border p-2 text-muted hover:text-primary"
              title="Fechar menu"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-md">
          <div className="flex h-16 items-center gap-4 px-4 sm:px-8">
            <button
              onClick={() => setOpen(true)}
              className="rounded-lg border border-border p-2 text-muted hover:text-primary lg:hidden"
              title="Abrir menu"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
              </svg>
            </button>

            <div className="lg:hidden">
              <Brand />
            </div>

            <div className="ml-auto hidden text-right sm:block">
              <p className="text-sm font-semibold text-primary">{user?.name}</p>
              <p className="text-xs text-muted">Bem-vindo de volta</p>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-8">{children ?? <Outlet />}</main>
      </div>
    </div>
  );
}
