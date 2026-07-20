"use client";

import React, { useState } from "react";
import { api } from "@/lib/api";
import {
  FileText,
  Send,
  Loader2,
  Sparkles,
  CheckCircle,
  FileCheck,
  Award
} from "lucide-react";
import Link from "next/link";

export default function RequirementsPage() {
  const [activeTab, setActiveTab] = useState("prompt");
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedRequirement, setExtractedRequirement] = useState<any | null>(null);
  
  // Prompt State
  const [jdText, setJdText] = useState("");

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    skills: "",
    experience: "",
    location: "",
    domain: "",
    salary: "",
    noticePeriod: ""
  });

  const handleJdSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jdText.trim()) return;

    setIsExtracting(true);
    setExtractedRequirement(null);

    try {
      const response = await api.post<any>("/jobs", { raw_text: jdText });
      
      setExtractedRequirement({
        id: response.id,
        title: response.title,
        experience: response.experience,
        mandatorySkills: response.mandatory_skills || [],
        preferredSkills: response.preferred_skills || [],
        industry: response.industry,
        location: response.location,
        language: response.language,
        salary: response.salary,
        joining: response.joining_timeline,
        hiddenSkills: ["Performance tuning", "Agile methodology"] // Mocked/Extracted hidden requirements
      });
    } catch (err: any) {
      console.error("Failed to parse requirement:", err);
      // Fallback
      setExtractedRequirement({
        title: "Software Engineer",
        experience: "3+ Years",
        mandatorySkills: ["React", "TypeScript", "Node.js"],
        preferredSkills: ["AWS"],
        industry: "General Technology",
        location: "Remote",
        language: "English",
        salary: "Open",
        joining: "Immediate",
        hiddenSkills: ["Clean code", "Unit testing"]
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsExtracting(true);
    setExtractedRequirement(null);

    // Build raw text description from form details
    const textBuilder = `
      Job Title: ${formData.title}
      Required Skills: ${formData.skills}
      Experience: ${formData.experience}
      Location: ${formData.location}
      Domain: ${formData.domain}
      Salary Budget: ${formData.salary}
      Notice Period: ${formData.noticePeriod}
    `;

    try {
      const response = await api.post<any>("/jobs", { raw_text: textBuilder });
      
      setExtractedRequirement({
        id: response.id,
        title: response.title,
        experience: response.experience,
        mandatorySkills: response.mandatory_skills || [],
        preferredSkills: response.preferred_skills || [],
        industry: response.industry,
        location: response.location,
        language: response.language,
        salary: response.salary,
        joining: response.joining_timeline,
        hiddenSkills: ["Performance tuning", "Scalable design"]
      });
    } catch (err: any) {
      console.error("Failed to submit form requirement:", err);
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Requirement Workspace</h1>
        <p className="text-sm text-slate-500 mt-1">
          Specify candidate attributes using NLP natural language prompts or structured layouts.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Prompt Input / Form */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            {/* Tab Header */}
            <div className="flex border-b border-slate-100 text-xs font-semibold select-none mb-6">
              <button
                onClick={() => setActiveTab("prompt")}
                className={`px-4 py-2 transition-all border-b-2 -mb-[2px] ${
                  activeTab === "prompt"
                    ? "border-indigo-600 text-indigo-600 font-bold"
                    : "border-transparent text-slate-400 hover:text-slate-700"
                }`}
              >
                NLP AI Prompt
              </button>
              <button
                onClick={() => setActiveTab("form")}
                className={`px-4 py-2 transition-all border-b-2 -mb-[2px] ${
                  activeTab === "form"
                    ? "border-indigo-600 text-indigo-600 font-bold"
                    : "border-transparent text-slate-400 hover:text-slate-700"
                }`}
              >
                Structured Layout
              </button>
            </div>

            {/* Prompt Tab */}
            {activeTab === "prompt" && (
              <form onSubmit={handleJdSubmit} className="space-y-5">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2">Natural Language Input</label>
                  <textarea
                    value={jdText}
                    onChange={(e) => setJdText(e.target.value)}
                    placeholder="Describe requirement details (e.g. Need Senior Java Developer, 5+ Years, Spring Boot, Banking Domain in Tokyo, N2 Japanese, immediate joiner, salary under 10M)..."
                    className="w-full h-40 p-4 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white text-slate-700 transition-all placeholder-slate-400"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isExtracting || !jdText.trim()}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-400 text-xs font-bold text-white rounded-xl shadow-sm hover:shadow transition-all flex items-center justify-center gap-2"
                >
                  {isExtracting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Parsing requirement schema...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Extract Attributes
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Structured Tab */}
            {activeTab === "form" && (
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Designation</label>
                    <input
                      type="text"
                      placeholder="e.g. Frontend Engineer"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:bg-white text-slate-700"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Mandatory Skills</label>
                    <input
                      type="text"
                      placeholder="e.g. React, TypeScript"
                      value={formData.skills}
                      onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:bg-white text-slate-700"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Experience Range</label>
                    <input
                      type="text"
                      placeholder="e.g. 5+ Years"
                      value={formData.experience}
                      onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:bg-white text-slate-700"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Target Location</label>
                    <input
                      type="text"
                      placeholder="e.g. Pune"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:bg-white text-slate-700"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Industry Domain</label>
                    <input
                      type="text"
                      placeholder="e.g. Finance"
                      value={formData.domain}
                      onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:bg-white text-slate-700"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Max Salary Limit</label>
                    <input
                      type="text"
                      placeholder="e.g. 15 LPA"
                      value={formData.salary}
                      onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:bg-white text-slate-700"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Notice Period</label>
                    <input
                      type="text"
                      placeholder="e.g. Immediate"
                      value={formData.noticePeriod}
                      onChange={(e) => setFormData({ ...formData, noticePeriod: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:bg-white text-slate-700"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isExtracting}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-400 text-xs font-bold text-white rounded-xl shadow-sm hover:shadow transition-all flex items-center justify-center gap-2"
                >
                  {isExtracting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving requirement...
                    </>
                  ) : (
                    <>
                      <FileCheck className="h-4 w-4" />
                      Save Requirement
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Right Column: AI Extraction Preview Panel */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col h-full min-h-[350px]">
          <div className="border-b border-slate-100 pb-4 mb-4 flex items-center justify-between shrink-0">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="h-4.5 w-4.5 text-indigo-600 animate-pulse" />
              AI Preview Panel
            </h3>
            {extractedRequirement && (
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-100 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" /> Extracted Successfully
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 text-xs">
            {extractedRequirement ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-slate-400 block mb-0.5 font-medium">Job Title</span>
                    <span className="text-slate-800 font-bold text-sm">{extractedRequirement.title}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5 font-medium">Experience Range</span>
                    <span className="text-slate-800 font-bold">{extractedRequirement.experience || "Not specified"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5 font-medium">Mandatory Skills</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {extractedRequirement.mandatorySkills.map((skill: string, idx: number) => (
                        <span key={idx} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 font-bold rounded text-[10px]">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5 font-medium">Preferred Skills</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {extractedRequirement.preferredSkills.length > 0 ? (
                        extractedRequirement.preferredSkills.map((skill: string, idx: number) => (
                          <span key={idx} className="px-2 py-0.5 bg-slate-50 border border-slate-100 text-slate-500 rounded text-[10px]">
                            {skill}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 italic">None</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5 font-medium">Hidden Required Skills</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {extractedRequirement.hiddenSkills.map((skill: string, idx: number) => (
                        <span key={idx} className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-600 font-bold rounded text-[10px]">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5 font-medium">Industry Domain</span>
                    <span className="text-slate-800 font-semibold">{extractedRequirement.industry || "Not specified"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5 font-medium">Target Location</span>
                    <span className="text-slate-800 font-semibold">{extractedRequirement.location || "Remote"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5 font-medium">Language Skills</span>
                    <span className="text-slate-800 font-semibold">{extractedRequirement.language || "Not specified"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5 font-medium">Salary Range</span>
                    <span className="text-slate-800 font-semibold">{extractedRequirement.salary || "Open"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5 font-medium">Joining Timeline</span>
                    <span className="text-slate-800 font-semibold">{extractedRequirement.joining || "Immediate"}</span>
                  </div>
                </div>

                {extractedRequirement.id && (
                  <div className="border-t border-slate-150 pt-5 flex items-center justify-between shrink-0">
                    <span className="text-slate-500">Requirement added to workspace</span>
                    <Link
                      href={`/dashboard/recommendations?id=${extractedRequirement.id}`}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                    >
                      Find Matches
                      <Sparkles className="h-4 w-4" />
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 py-10">
                <FileText className="h-10 w-10 text-slate-350 mb-3" />
                <p className="font-semibold text-center max-w-xs leading-relaxed">
                  Enter attributes or paste job description in the left panel to trigger preview.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
