import Link from "next/link";
import { ArrowRight, Bot, ShieldCheck, Zap, Database } from "lucide-react";

export default function Home() {
  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-slate-950 overflow-hidden text-slate-100 font-sans">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-violet-500/10 blur-[120px] pointer-events-none" />

      {/* Navbar */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <Bot className="h-8 w-8 text-indigo-500 animate-pulse" />
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            TalentVault AI
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            Login
          </Link>
          <Link
            href="/signup"
            className="text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-full transition-all hover:shadow-[0_0_15px_rgba(99,102,241,0.5)]"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 flex flex-col items-center justify-center text-center z-10 py-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/20 bg-indigo-500/5 text-indigo-400 text-xs font-semibold tracking-wide mb-8 animate-bounce">
          <Zap className="h-3 w-3" />
          Next-Gen AI Resume Intelligence
        </div>
        
        <h1 className="max-w-4xl text-5xl md:text-7xl font-extrabold tracking-tight leading-none bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent mb-6">
          Replace Manual Resume Screening with AI Intelligence
        </h1>
        
        <p className="max-w-2xl text-lg text-slate-400 mb-10 leading-relaxed">
          RecruitIQ AI instantly parses, extracts, matches, and ranks thousands of resumes against any job description. Shortlist your top 10 candidates in seconds.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-20">
          <Link
            href="/signup"
            className="flex items-center justify-center gap-2 h-14 px-8 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:scale-[1.02]"
          >
            Start Free Trial
            <ArrowRight className="h-5 w-5" />
          </Link>
          <Link
            href="/login"
            className="flex items-center justify-center h-14 px-8 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 font-semibold rounded-xl transition-all duration-300 hover:text-white"
          >
            Schedule a Demo
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mt-8">
          <div className="group relative p-8 rounded-2xl border border-slate-900 bg-slate-900/50 backdrop-blur-xl hover:border-indigo-500/30 transition-all duration-300">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <Database className="h-10 w-10 text-indigo-500 mb-4" />
            <h3 className="text-xl font-bold mb-2 group-hover:text-indigo-400 transition-colors">
              Bulk Extraction
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Upload thousands of resumes in ZIP, PDF, or DOCX formats. Extract texts and OCR scanned profiles instantly.
            </p>
          </div>

          <div className="group relative p-8 rounded-2xl border border-slate-900 bg-slate-900/50 backdrop-blur-xl hover:border-violet-500/30 transition-all duration-300">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-violet-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <Bot className="h-10 w-10 text-violet-500 mb-4" />
            <h3 className="text-xl font-bold mb-2 group-hover:text-violet-400 transition-colors">
              Semantic Alignment
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Match skills, experience, and education using AI embeddings. Discover fit beyond standard keyword matching.
            </p>
          </div>

          <div className="group relative p-8 rounded-2xl border border-slate-900 bg-slate-900/50 backdrop-blur-xl hover:border-pink-500/30 transition-all duration-300">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-pink-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <ShieldCheck className="h-10 w-10 text-pink-500 mb-4" />
            <h3 className="text-xl font-bold mb-2 group-hover:text-pink-400 transition-colors">
              Structured Profiles
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Create detailed reports with strength and risk assessments, AI shortlists, and automatically generated interview templates.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-8 border-t border-slate-900 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 z-10 gap-4">
        <div>
          &copy; {new Date().getFullYear()} TalentVault AI Inc. All rights reserved.
        </div>
        <div className="flex gap-6">
          <a href="#" className="hover:text-slate-400 transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-slate-400 transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-slate-400 transition-colors">Contact Support</a>
        </div>
      </footer>
    </div>
  );
}
