"use client";

import { useAuth } from "@/lib/firebase/auth-context";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  Package,
  Users,
  FileText,
  Receipt,
  Settings,
  LogOut,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/reservations", label: "Reservations", icon: FileText },
  { href: "/admin/calendar", label: "Calendar", icon: Calendar },
  { href: "/admin/inventory", label: "Inventory", icon: Package },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/contracts", label: "Contracts", icon: FileText },
  { href: "/admin/invoices", label: "Invoices", icon: Receipt },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, loading, isAuthorized, signIn, signOut } = useAuth();
  const pathname = usePathname();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-green-700" />
      </div>
    );
  }

  if (!user || !isAuthorized) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-10 text-center max-w-sm w-full">
          <Image
            src="/stlyardgames.png"
            alt="STL Yard Games"
            width={80}
            height={80}
            className="rounded-full mx-auto mb-4"
          />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Admin Portal</h1>
          <p className="text-gray-500 text-sm mb-6">Sign in with your Google account to continue.</p>
          {user && !isAuthorized && (
            <p className="text-red-600 text-sm mb-4">
              Access denied. {user.email} is not authorized.
            </p>
          )}
          <button
            onClick={signIn}
            className="w-full bg-green-700 text-white py-3 rounded-xl font-bold hover:bg-green-800 transition-colors"
          >
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-green-900 text-white flex flex-col">
        <div className="px-6 py-5 border-b border-green-800">
          <div className="flex items-center gap-3">
            <Image
              src="/stlyardgames.png"
              alt="STL Yard Games"
              width={40}
              height={40}
              className="rounded-full"
            />
            <div>
              <div className="font-bold text-sm">STL Yard Games</div>
              <div className="text-xs text-green-400">Admin</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium mb-1 transition-colors",
                  active
                    ? "bg-green-700 text-white"
                    : "text-green-300 hover:text-white hover:bg-green-800"
                )}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-green-800">
          <div className="px-3 mb-2 text-xs text-green-400 truncate">{user.email}</div>
          <button
            onClick={signOut}
            className="flex items-center gap-3 px-3 py-2.5 text-green-300 hover:text-white text-sm w-full rounded-lg hover:bg-green-800 transition-colors"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
