import { ReactNode } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";

const navItems = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/calculos", label: "Cálculos" },
  { to: "/vendas", label: "Vendas" },
  { to: "/analises", label: "Análises" },
];

export default function Layout({ children }: { children?: ReactNode }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await fetch("/api/auth/sign-out", {
      method: "POST",
      credentials: "include",
    });
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-surface border-border border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-xl font-bold text-white">
                  Loja Automotiva
                </span>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                        isActive
                          ? "border-blue-500 text-white"
                          : "border-transparent text-muted hover:text-white hover:border-gray-500"
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
            <div className="flex items-center">
              <button
                onClick={handleLogout}
                className="text-sm text-muted hover:text-white"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children ?? <Outlet />}
      </main>
    </div>
  );
}
