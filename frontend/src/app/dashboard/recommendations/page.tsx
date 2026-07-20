"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import {
  Sparkles,
  MapPin,
  Briefcase,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Mail,
  Phone,
  Globe,
  MessageSquare,
  PlusCircle,
  FileText,
  Clock,
  ChevronDown,
  Loader2,
  User,
  X,
  BookOpen,
  Award
} from "lucide-react";

function RecommendationsContent() {
  const searchParams = useSearchParams();
  const initialJobId = searchParams.get("id") || "";

  // States
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJobId, setSelectedJobId] = useState(initialJobId);
  const [matches, setMatches] = useState<any[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);

  // Drawer States
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [candidateDetail, setCandidateDetail] = useState<any | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState("overview");
  const [newNote, setNewNote] = useState("");
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [contactStatus, setContactStatus] = useState("Emailed");
  const [contactRemarks, setContactRemarks] = useState("");
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);

  // Load active jobs dropdown
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setIsLoadingJobs(true);
        const res = await api.get<any[]>("/jobs");
        setJobs(res);
        if (res.length > 0 && !selectedJobId) {
          setSelectedJobId(res[0].id);
        }
      } catch (err) {
        console.error("Failed to load jobs list:", err);
      } finally {
        setIsLoadingJobs(false);
      }
    };
    fetchJobs();
  }, []);

  // Load matches when job requirement selection changes
  useEffect(() => {
    if (!selectedJobId) {
      setMatches([]);
      return;
    }

    const fetchMatches = async () => {
      try {
        setIsLoadingMatches(true);
        const res = await api.get<any[]>(`/jobs/${selectedJobId}/matches`);
        setMatches(res);
      } catch (err) {
        console.error("Failed to load matches:", err);
      } finally {
        setIsLoadingMatches(false);
      }
    };
    fetchMatches();
  }, [selectedJobId]);

  // Load candidate details for drawer
  useEffect(() => {
    if (!selectedCandidateId) {
      setCandidateDetail(null);
      return;
    }

    const loadDetails = async () => {
      try {
        setIsDetailLoading(true);
        const res = await api.get<any>(`/candidates/${selectedCandidateId}`);
        setCandidateDetail(res);
      } catch (err) {
        console.error("Failed to load candidate details:", err);
      } finally {
        setIsDetailLoading(false);
      }
    };
    loadDetails();
  }, [selectedCandidateId]);

  // Submit Note in Drawer
  const handleNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !selectedCandidateId) return;

    try {
      setIsSubmittingNote(true);
      const res = await api.post<any>(`/candidates/${selectedCandidateId}/notes`, { note: newNote });
      if (candidateDetail) {
        setCandidateDetail({
          ...candidateDetail,
          notes: [res, ...(candidateDetail.notes || [])],
          timeline: [
            {
              id: res.id,
              event_type: "NOTE",
              event_details: `Recruiter added note: ${newNote}`,
              created_at: new Date().toISOString()
            },
            ...(candidateDetail.timeline || [])
          ]
        });
      }
      setNewNote("");
    } catch (err) {
      console.error("Failed to post note:", err);
    } finally {
      setIsSubmittingNote(false);
    }
  };

  // Log contact
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidateId) return;

    try {
      setIsSubmittingContact(true);
      const res = await api.post<any>(`/candidates/${selectedCandidateId}/contact`, {
        status: contactStatus,
        remarks: contactRemarks
      });
      if (candidateDetail) {
        const contactEvent = {
          id: Math.random().toString(),
          event_type: "CONTACT",
          event_details: `Contacted via {contactStatus}. Remarks: {contactRemarks || "None"}`,
          created_at: new Date().toISOString()
        };
        setCandidateDetail({
          ...candidateDetail,
          last_contact_date: res.last_contact_date,
          timeline: [contactEvent, ...(candidateDetail.timeline || [])],
          contact_history: [contactEvent, ...(candidateDetail.contact_history || [])]
        });
      }
      setContactRemarks("");
    } catch (err) {
      console.error("Failed to log contact:", err);
    } finally {
      setIsSubmittingContact(false);
    }
  };

  return (
    <div className="flex h-full gap-8 relative overflow-hidden animate-fadeIn">
      {/* Matches List Column */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto pr-2 space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">AI Talent Rediscovery</h1>
          <p className="text-sm text-slate-500 mt-1">
            Re-evaluate candidates in your Talent Vault against requirement schemas.
          </p>
        </div>

        {/* Dropdown Selector */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <FileText className="h-5 w-5 text-indigo-600 shrink-0" />
            <div className="flex-1 sm:flex-initial">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Active Requirement</span>
              {isLoadingJobs ? (
                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium py-1">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-600" />
                  Loading requirements...
                </div>
              ) : jobs.length > 0 ? (
                <select
                  value={selectedJobId}
                  onChange={(e) => setSelectedJobId(e.target.value)}
                  className="bg-transparent text-sm font-bold text-slate-800 focus:outline-none cursor-pointer border-b border-indigo-200 pb-0.5"
                >
                  {jobs.map((job) => (
                    <option key={job.id} value={job.id}>{job.title}</option>
                  ))}
                </select>
              ) : (
                <span className="text-sm font-bold text-slate-400">No active requirements</span>
              )}
            </div>
          </div>
          <span className="text-xs text-indigo-600 bg-indigo-50 px-3 py-1 rounded-xl font-bold border border-indigo-100 whitespace-nowrap shrink-0">
            {matches.length} Candidates Scored
          </span>
        </div>

        {/* Matches Feed */}
        {isLoadingMatches ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="h-8 w-8 text-indigo-600 animate-spin mb-4" />
            <p className="text-sm font-semibold">Running rediscovery engine...</p>
          </div>
        ) : matches.length > 0 ? (
          <div className="space-y-4 shrink-0">
            {matches.map((match) => (
              <div
                key={match.candidate_id}
                className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-stretch gap-6 transition-all"
              >
                {/* Circular Score Badge */}
                <div className="flex flex-col items-center justify-center shrink-0 min-w-[100px] border-r border-slate-100 pr-6">
                  <div className="relative h-20 w-20 flex items-center justify-center">
                    {/* SVG circle track */}
                    <svg className="absolute inset-0 h-full w-full -rotate-90">
                      <circle cx="40" cy="40" r="34" className="stroke-slate-100 fill-none" strokeWidth="6" />
                      <circle
                        cx="40"
                        cy="40"
                        r="34"
                        className="stroke-indigo-600 fill-none"
                        strokeWidth="6"
                        strokeDasharray="213"
                        strokeDashoffset={213 - (213 * match.match_score) / 100}
                      />
                    </svg>
                    <span className="text-lg font-black text-slate-800">{match.match_score}%</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-2.5">Match Score</span>
                </div>

                {/* Candidate Overview */}
                <div className="flex-1 min-w-0 space-y-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-extrabold text-slate-900 text-base">{match.name}</h3>
                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-slate-350 shrink-0" />
                        Last Contacted: {match.last_contact_date ? new Date(match.last_contact_date).toLocaleDateString() : "Never"}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 font-semibold mt-0.5 flex items-center gap-3">
                      <span className="flex items-center gap-1"><Briefcase className="h-3.5 w-3.5 shrink-0" /> {match.experience_years} Years Exp</span>
                      <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 shrink-0" /> {match.location}</span>
                    </p>

                    <p className="text-xs text-slate-500 bg-slate-50 border border-slate-100 p-3 rounded-xl leading-relaxed mt-3">
                      {match.reason_why}
                    </p>
                  </div>

                  {/* Skills tags */}
                  <div className="flex flex-wrap gap-2 text-[10px]">
                    {match.matching_skills?.map((skill: string, index: number) => (
                      <span key={index} className="px-2 py-1 bg-emerald-50 border border-emerald-100 text-emerald-600 font-bold rounded-lg flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        {skill}
                      </span>
                    ))}
                    {match.missing_skills?.map((skill: string, index: number) => (
                      <span key={index} className="px-2 py-1 bg-red-50 border border-red-100 text-red-600 font-bold rounded-lg flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {skill} (Missing)
                      </span>
                    ))}
                  </div>
                </div>

                {/* Match Action items */}
                <div className="flex flex-col justify-between shrink-0 pl-6 border-l border-slate-100 min-w-[150px]">
                  <div className="space-y-2">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Recommended Action</span>
                    <span className="text-xs font-bold text-slate-800 bg-slate-50 border border-slate-150 p-2.5 rounded-xl text-center block">
                      {match.recommended_action}
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedCandidateId(match.candidate_id)}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-all shadow-sm flex items-center justify-center gap-1.5"
                  >
                    View Details
                    <Sparkles className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl py-16 text-center text-slate-500 text-sm shadow-sm shrink-0">
            No candidate matching results found. Make sure your Talent Vault is seeded and requirements are saved.
          </div>
        )}
      </div>

      {/* Right Drawer */}
      {selectedCandidateId && (
        <div className="w-128 bg-white border-l border-slate-200 flex flex-col h-full shrink-0 shadow-xl overflow-hidden animate-slideLeft">
          {/* Drawer Header */}
          <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center font-extrabold text-indigo-700 text-base shadow-sm">
                {candidateDetail?.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) || "C"}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">{candidateDetail?.name}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{candidateDetail?.companies?.[0] || "Software Engineer"}</p>
              </div>
            </div>
            <button
              onClick={() => setSelectedCandidateId(null)}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Tab Selectors */}
          <div className="flex border-b border-slate-100 text-xs font-semibold px-4 select-none shrink-0 bg-slate-50">
            {["overview", "experience", "skills", "notes", "timeline", "ai insights"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveDetailTab(tab)}
                className={`px-4 py-3 capitalize transition-all border-b-2 -mb-[2px] ${
                  activeDetailTab === tab
                    ? "border-indigo-600 text-indigo-600 font-bold"
                    : "border-transparent text-slate-400 hover:text-slate-700"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Drawer Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {isDetailLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Loader2 className="h-6 w-6 text-indigo-600 animate-spin mb-3" />
                <p className="text-xs font-medium">Fetching details...</p>
              </div>
            ) : candidateDetail ? (
              <>
                {activeDetailTab === "overview" && (
                  <div className="space-y-6 text-xs text-slate-600">
                    <div className="grid grid-cols-2 gap-4 bg-slate-50 border border-slate-100 p-4 rounded-xl">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                        <span className="truncate">{candidateDetail.email || "No email"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                        <span className="truncate">{candidateDetail.phone || "No phone"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-slate-400 shrink-0" />
                        {candidateDetail.linkedin_url ? (
                          <a href={candidateDetail.linkedin_url} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline truncate">LinkedIn Profile</a>
                        ) : (
                          <span className="text-slate-400">No LinkedIn</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                        <span className="truncate">{candidateDetail.current_location}</span>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">AI Summary</h4>
                      <p className="text-slate-500 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                        {candidateDetail.summary}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Resume History</h4>
                      <div className="space-y-2">
                        {candidateDetail.resume_versions?.map((version: any) => (
                          <div key={version.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-xl hover:bg-slate-50">
                            <div className="flex items-center gap-2.5">
                              <FileText className="h-4 w-4 text-indigo-500" />
                              <div>
                                <p className="font-bold text-slate-800">Version V{version.version}</p>
                                <p className="text-[10px] text-slate-400">{new Date(version.uploaded_at).toLocaleDateString()}</p>
                              </div>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono italic">
                              {version.file_path}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-6">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Log Contact Event</h4>
                      <form onSubmit={handleContactSubmit} className="space-y-3">
                        <div className="flex gap-2">
                          <select
                            value={contactStatus}
                            onChange={(e) => setContactStatus(e.target.value)}
                            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-700"
                          >
                            <option value="Emailed">Emailed</option>
                            <option value="Called">Called</option>
                            <option value="Interview Scheduled">Scheduled Interview</option>
                            <option value="Offered">Offered</option>
                          </select>
                          <input
                            type="text"
                            placeholder="Add brief contact remarks..."
                            value={contactRemarks}
                            onChange={(e) => setContactRemarks(e.target.value)}
                            className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-700"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={isSubmittingContact}
                          className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-400 text-xs font-bold text-white rounded-xl transition-all"
                        >
                          {isSubmittingContact ? "Logging..." : "Log Contact History"}
                        </button>
                      </form>
                    </div>
                  </div>
                )}

                {activeDetailTab === "experience" && (
                  <div className="space-y-6 text-xs">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Experience Timeline</h4>
                    <div className="relative border-l-2 border-slate-150 pl-5 ml-2.5 space-y-6">
                      {candidateDetail.companies?.map((company: string, idx: number) => (
                        <div key={idx} className="relative">
                          <div className="absolute -left-7 top-1 h-3.5 w-3.5 rounded-full border-2 border-indigo-600 bg-white" />
                          <h4 className="font-bold text-slate-800">{company}</h4>
                          <p className="text-[10px] text-slate-400 mt-0.5">Software Engineer • 2 Years Tenure</p>
                          <p className="text-slate-500 mt-2 leading-relaxed font-medium">
                            Contributed to system migration, feature development, backend optimization, and database schemas.
                          </p>
                        </div>
                      ))}
                    </div>
                    
                    <div className="border-t border-slate-100 pt-6">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Education</h4>
                      {candidateDetail.education?.map((edu: any, idx: number) => (
                        <div key={idx} className="flex gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <BookOpen className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                          <div>
                            <p className="font-bold text-slate-800">{edu.degree}</p>
                            <p className="text-[10px] text-slate-400">Bachelor's Degree • Computer Science</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeDetailTab === "skills" && (
                  <div className="space-y-6 text-xs">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Indexed Technical Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {candidateDetail.top_skills?.map((skill: string, idx: number) => (
                          <span
                            key={idx}
                            className="px-3 py-1.5 bg-indigo-50/50 border border-indigo-100 text-indigo-600 text-xs font-bold rounded-xl"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    {candidateDetail.certifications?.length > 0 && (
                      <div className="border-t border-slate-100 pt-6">
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Verified Certifications</h4>
                        <div className="space-y-2">
                          {candidateDetail.certifications.map((cert: string, idx: number) => (
                            <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                              <Award className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                              <span className="font-bold text-slate-800">{cert}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeDetailTab === "notes" && (
                  <div className="space-y-6 text-xs">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Recruiter Notes</h4>
                    <form onSubmit={handleNoteSubmit} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Add quick recruiter note..."
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-700"
                      />
                      <button
                        type="submit"
                        disabled={isSubmittingNote || !newNote.trim()}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-400 text-white font-bold rounded-xl transition-all"
                      >
                        {isSubmittingNote ? "Saving..." : "Add"}
                      </button>
                    </form>

                    <div className="space-y-3">
                      {candidateDetail.notes?.length > 0 ? (
                        candidateDetail.notes.map((note: any) => (
                          <div key={note.id} className="p-4 bg-slate-50 rounded-xl border border-slate-150 relative">
                            <p className="text-slate-600 leading-relaxed font-medium">{note.note}</p>
                            <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase">
                              <span>By {note.recruiter_name}</span>
                              <span>{new Date(note.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-slate-400 text-center py-6">No recruiter notes posted yet.</p>
                      )}
                    </div>
                  </div>
                )}

                {activeDetailTab === "timeline" && (
                  <div className="space-y-6 text-xs text-slate-500">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Timeline History</h4>
                    <div className="relative border-l border-slate-150 pl-5 ml-2.5 space-y-5">
                      {candidateDetail.timeline?.map((event: any) => (
                        <div key={event.id} className="relative">
                          <div className="absolute -left-[25px] top-0.5 h-2.5 w-2.5 rounded-full bg-slate-400 border border-white" />
                          <div className="flex items-baseline justify-between gap-4">
                            <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                              {event.event_type}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {new Date(event.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-slate-500 mt-1">{event.event_details}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeDetailTab === "ai insights" && (
                  <div className="space-y-6 text-xs">
                    <div>
                      <h4 className="font-bold text-slate-800 uppercase tracking-wider mb-3">Audit Logs & Version Diffs</h4>
                      {candidateDetail.changes_history?.length > 0 ? (
                        candidateDetail.changes_history.map((change: any) => (
                          <div key={change.id} className="p-4 border border-slate-200 rounded-xl space-y-2 mb-2 bg-slate-50">
                            <p className="font-bold text-slate-700">{change.summary}</p>
                            
                            {change.skills_added?.length > 0 && (
                              <div>
                                <span className="text-emerald-600 font-bold block mb-0.5">Skills Added:</span>
                                <span className="text-slate-500">{change.skills_added.join(", ")}</span>
                              </div>
                            )}
                            
                            {change.companies_added?.length > 0 && (
                              <div>
                                <span className="text-indigo-600 font-bold block mb-0.5">Companies Added:</span>
                                <span className="text-slate-500">{change.companies_added.join(", ")}</span>
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-slate-400 text-center py-4 bg-slate-50 rounded-xl border border-slate-100">
                          First-time upload. No changes logged yet.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-xs text-slate-400 text-center py-6">Could not load candidate details.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function RecommendationsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-slate-500">
        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin mb-4" />
        <p className="text-sm font-medium">Loading recommendations feed...</p>
      </div>
    }>
      <RecommendationsContent />
    </Suspense>
  );
}
