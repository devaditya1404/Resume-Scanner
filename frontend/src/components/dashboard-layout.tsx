"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import {
  LayoutDashboard,
  Database,
  UploadCloud,
  FileText,
  Sparkles,
  Bot,
  TrendingUp,
  Settings,
  LogOut,
  Search,
  Bell,
  User,
  ChevronDown
} from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [globalSearch, setGlobalSearch] = useState("");

  const navigationItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Talent Vault", href: "/dashboard/vault", icon: Database },
    { name: "Upload Resumes", href: "/dashboard/upload", icon: UploadCloud },
    { name: "Requirements", href: "/dashboard/requirements", icon: FileText },
    { name: "AI Recommendations", href: "/dashboard/recommendations", icon: Sparkles },
    { name: "AI Recruiter Chat", href: "/dashboard/chat", icon: Bot },
    { name: "Reports", href: "/dashboard/reports", icon: TrendingUp },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  const handleGlobalSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (globalSearch.trim()) {
      // Redirect to vault with search parameter
      router.push(`/dashboard/vault?q=${encodeURIComponent(globalSearch.trim())}`);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden">
      {/* Left Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0">
        <div>
          {/* Brand Logo Header */}
          <div className="p-6 border-b border-slate-100 flex items-center gap-3">
            <Bot className="h-8 w-8 text-indigo-600" />
            <div>
              <span className="text-lg font-bold tracking-tight text-slate-900 block leading-tight">
                ResumeX Brain
              </span>
              <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider block">
                TalentVault AI
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-indigo-50 text-indigo-600 shadow-sm"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer logout button / Org info */}
        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 mb-4 p-2 rounded-xl bg-slate-50 border border-slate-100">
            <div className="h-9 w-9 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm">
              {user?.full_name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "RE"}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-slate-800 truncate">{user?.full_name || "Recruiter"}</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.company_name || "Enterprise"}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 text-xs border border-slate-200 hover:border-red-200 hover:bg-red-50 hover:text-red-600 text-slate-600 px-4 py-2.5 rounded-xl transition-all"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-10 shrink-0">
          {/* Global Search Bar */}
          <form onSubmit={handleGlobalSearchSubmit} className="w-96 relative">
            <Search className="h-4.5 w-4.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Global candidate search..."
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white text-slate-700 transition-all placeholder-slate-400"
            />
          </form>

          {/* Right Header Options */}
          <div className="flex items-center gap-4">
            {/* Org Switcher */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-600 cursor-pointer hover:bg-slate-100 transition-colors">
              <span>{user?.company_name || "Workspace"}</span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </div>

            {/* Notifications */}
            <div className="relative p-2 rounded-xl text-slate-500 hover:bg-slate-100 cursor-pointer transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-indigo-600 rounded-full" />
            </div>

            {/* Profile Avatar */}
            <div className="h-9 w-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 text-sm font-semibold cursor-pointer">
              <User className="h-4.5 w-4.5 text-slate-500" />
            </div>
          </div>
        </header>

        {/* Dynamic Route Content */}
        <main className="flex-1 overflow-y-auto p-8 bg-slate-50">
          {children}
        </main>
      </div>
    </div>
  );
}
