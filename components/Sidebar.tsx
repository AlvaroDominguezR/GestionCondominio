"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Users,
  Car,
  Receipt,
  Home,
  TrendingUp,
  Settings
} from "lucide-react";

const links = [
  { href: "/",              label: "Dashboard",      icon: LayoutDashboard },
  { href: "/torres",        label: "Torres",         icon: Building2 },
  { href: "/departamentos", label: "Departamentos",  icon: Home },
  { href: "/habitantes",    label: "Habitantes",     icon: Users },
  { href: "/vehiculos",     label: "Vehículos",      icon: Car },
  { href: "/gastos",        label: "Gastos Comunes", icon: Receipt },
  { href: "/finanzas", label: "Finanzas", icon: TrendingUp },
  { href: "/perfil", label: "Perfil", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-gray-200 flex flex-col">

      {/* Logo */}
      <div className="px-6 py-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
            <Home className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm leading-tight">CondominioPro</p>
            <p className="text-xs text-gray-400 leading-tight">Sistema de Gestión</p>
          </div>
        </div>
      </div>

      {/* Navegación */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                }
              `}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-blue-600" : "text-gray-400"}`} />
              {label}
            </Link>
          );
        })}
      </nav>

    </aside>
  );
}
