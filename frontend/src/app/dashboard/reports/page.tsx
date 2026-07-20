"use client";

import React from "react";
import { TrendingUp, Users, Calendar, Activity } from "lucide-react";

export default function ReportsPage() {
  return (
    <div className="space-y-8 animate-fadeIn max-w-4xl">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Reports & Analytics</h1>
        <p className="text-sm text-slate-500 mt-1">
          Visual insights on your database pool expansion and recruiter AI metrics.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm text-xs text-slate-500 space-y-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <TrendingUp className="h-4.5 w-4.5 text-indigo-600 animate-pulse" />
            AI Search Utilization
          </h3>
          <div className="h-40 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center font-bold text-slate-400">
            [Chart: 1,420 Semantic Queries In Last 30 Days]
          </div>
        </div>

        <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm text-xs text-slate-500 space-y-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Users className="h-4.5 w-4.5 text-indigo-600" />
            Talent Pool Distribution
          </h3>
          <div className="h-40 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center font-bold text-slate-400">
            [Chart: 45% Java Developer • 25% Frontend • 30% ServiceNow]
          </div>
        </div>
      </div>
    </div>
  );
}
