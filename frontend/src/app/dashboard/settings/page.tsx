"use client";

import React from "react";
import { Settings, Shield, HelpCircle, HardDrive } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-8 animate-fadeIn max-w-4xl">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Workspace Settings</h1>
        <p className="text-sm text-slate-500 mt-1">
          Configure organization rules, vector indexes, and parser tolerances.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 text-xs text-slate-600">
        <div className="flex items-start gap-4">
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-500 shrink-0">
            <Settings className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-800 text-sm">Parser Rules</h4>
            <p className="text-slate-400 mt-1">Configure threshold requirements for parsing fields like notice periods and salary ranges.</p>
          </div>
        </div>

        <div className="flex items-start gap-4 border-t border-slate-100 pt-6">
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-500 shrink-0">
            <HardDrive className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-800 text-sm">Vector Embedding Sync</h4>
            <p className="text-slate-400 mt-1">Force rebuild of candidate FAISS embeddings flat-index using SentenceTransformers.</p>
            <button className="mt-3 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-sm">
              Re-Sync FAISS Index
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
