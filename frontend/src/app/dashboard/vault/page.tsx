"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import {
  Search,
  Filter,
  X,
  MapPin,
  Briefcase,
  Calendar,
  DollarSign,
  Award,
  BookOpen,
  User,
  Phone,
  Mail,
  Globe,
  PlusCircle,
  FileText,
  Clock,
  Loader2,
  Trash2,
  Sparkles,
  MessageSquare
} from "lucide-react";

// Create a client-side search wrapper to handle search parameters safely inside Suspense
function VaultContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  // States
  const [candidates, setCandidates] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [candidateDetail, setCandidateDetail] = useState<any | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isListLoading, setIsListLoading] = useState(true);
  const [activeDetailTab, setActiveDetailTab] = useState("overview");

  // Filters State
  const [filterSkills, setFilterSkills] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [filterExperienceMin, setFilterExperienceMin] = useState("");
  const [filterNoticePeriod, setFilterNoticePeriod] = useState("");
  
  // Note/Contact Forms
  const [newNote, setNewNote] = useState("");
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [contactStatus, setContactStatus] = useState("Emailed");
  const [contactRemarks, setContactRemarks] = useState("");
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);

  // Load Candidates
  const fetchCandidates = async () => {
    try {
      setIsListLoading(true);
      let endpoint = "/candidates";
      
      const params: any = {};
      if (filterSkills) params.skills = filterSkills;
      if (filterLocation) params.location = filterLocation;
      if (filterExperienceMin) params.experience_min = parseInt(filterExperienceMin);
      if (filterNoticePeriod) params.notice_period = filterNoticePeriod;

      let res: any[];
      if (searchQuery.trim()) {
        // If query is present, do a semantic search
        res = await api.post<any[]>("/candidates/search", { query: searchQuery });
      } else {
        // Normal list with filters
        res = await api.get<any[]>(endpoint, params);
      }
      setCandidates(res);
    } catch (err) {
      console.error("Failed to load candidates list:", err);
    } finally {
      setIsListLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, [searchQuery, filterSkills, filterLocation, filterExperienceMin, filterNoticePeriod]);

  // Load Candidate Detail
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

  // Submit Note
  const handleNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !selectedCandidateId) return;

    try {
      setIsSubmittingNote(true);
      const res = await api.post<any>(`/candidates/${selectedCandidateId}/notes`, { note: newNote });
      // Add note locally to UI
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

  // Log Contact History
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidateId) return;

    try {
      setIsSubmittingContact(true);
      const res = await api.post<any>(`/candidates/${selectedCandidateId}/contact`, {
        status: contactStatus,
        remarks: contactRemarks
      });
      // Update locally
      if (candidateDetail) {
        const contactEvent = {
          id: Math.random().toString(),
          event_type: "CONTACT",
          event_details: `Contacted via ${contactStatus}. Remarks: ${contactRemarks || "None"}`,
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
      console.error("Failed to log contact attempt:", err);
    } finally {
      setIsSubmittingContact(false);
    }
  };

  // Reset Filters
  const resetFilters = () => {
    setFilterSkills("");
    setFilterLocation("");
    setFilterExperienceMin("");
    setFilterNoticePeriod("");
    setSearchQuery("");
  };

  return (
    <div className="flex h-full gap-8 relative overflow-hidden animate-fadeIn">
      {/* Candidates List Column */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto pr-2 space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">AI Talent Vault</h1>
          <p className="text-sm text-slate-500 mt-1">
            Search candidates semantically or apply filters to screen profiles.
          </p>
        </div>

        {/* Search & Filters Panel */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 shrink-0">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="h-4.5 w-4.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Ask plain English queries (e.g. Find Java developers in Pune)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white text-slate-700 transition-all"
              />
            </div>
            <button
              onClick={resetFilters}
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              Clear Filters
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Skills */}
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Skills</label>
              <input
                type="text"
                placeholder="e.g. React, Java"
                value={filterSkills}
                onChange={(e) => setFilterSkills(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:bg-white text-slate-700"
              />
            </div>
            {/* Location */}
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Location</label>
              <input
                type="text"
                placeholder="e.g. Pune, Tokyo"
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:bg-white text-slate-700"
              />
            </div>
            {/* Exp */}
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Min Exp (Yrs)</label>
              <input
                type="number"
                placeholder="e.g. 3"
                value={filterExperienceMin}
                onChange={(e) => setFilterExperienceMin(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:bg-white text-slate-700"
              />
            </div>
            {/* Notice Period */}
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Notice Period</label>
              <select
                value={filterNoticePeriod}
                onChange={(e) => setFilterNoticePeriod(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:bg-white text-slate-700"
              >
                <option value="">Any</option>
                <option value="Immediate">Immediate</option>
                <option value="30 days">30 Days</option>
                <option value="60 days">60 Days</option>
                <option value="90 days">90 Days</option>
              </select>
            </div>
          </div>
        </div>

        {/* Candidates Cards Grid */}
        {isListLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="h-8 w-8 text-indigo-600 animate-spin mb-4" />
            <p className="text-sm font-semibold">Filtering Talent Vault...</p>
          </div>
        ) : candidates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 shrink-0">
            {candidates.map((cand) => (
              <div
                key={cand.id}
                onClick={() => setSelectedCandidateId(cand.id)}
                className={`p-5 bg-white border rounded-2xl cursor-pointer hover:shadow-md transition-all ${
                  selectedCandidateId === cand.id
                    ? "border-indigo-500 shadow-sm bg-indigo-50/20"
                    : "border-slate-200"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600 text-sm">
                      {cand.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">{cand.name}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">{cand.current_company || "Unknown Company"}</p>
                    </div>
                  </div>
                  {cand.match_score && (
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg shrink-0">
                      {cand.match_score}% Score
                    </span>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Briefcase className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{cand.experience_years || 0} Years Exp</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{cand.current_location || "Remote"}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{cand.notice_period || "Immediate"} Notice</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{cand.expected_salary || "Open"}</span>
                  </div>
                </div>

                {/* Skills tags */}
                <div className="mt-4 flex flex-wrap gap-1">
                  {(cand.top_skills || []).slice(0, 4).map((skill: string, index: number) => (
                    <span
                      key={index}
                      className="px-2 py-0.5 bg-slate-50 border border-slate-100 text-[10px] text-slate-500 font-medium rounded-md"
                    >
                      {skill}
                    </span>
                  ))}
                  {(cand.top_skills || []).length > 4 && (
                    <span className="text-[10px] text-slate-400 font-semibold px-1 py-0.5">
                      +{(cand.top_skills || []).length - 4} more
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl py-16 text-center text-slate-500 text-sm shadow-sm shrink-0">
            No candidates matched your filters. Adjust search parameters or upload profiles.
          </div>
        )}
      </div>

      {/* Right candidate drawer */}
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

          {/* Drawer Tab Selectors */}
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
                {/* Active Tab rendering */}
                {activeDetailTab === "overview" && (
                  <div className="space-y-6">
                    {/* Key Attributes Grid */}
                    <div className="grid grid-cols-2 gap-4 bg-slate-50 border border-slate-100 p-4 rounded-xl text-xs text-slate-600">
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

                    {/* Summary */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">AI Summary</h4>
                      <p className="text-xs text-slate-500 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                        {candidateDetail.summary}
                      </p>
                    </div>

                    {/* Resume Versions */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Resume History</h4>
                      <div className="space-y-2">
                        {candidateDetail.resume_versions?.map((version: any) => (
                          <div key={version.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-xl hover:bg-slate-50 text-xs">
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

                    {/* Contact Attempt form */}
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
                  <div className="space-y-6">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Experience Timeline</h4>
                    <div className="relative border-l-2 border-slate-150 pl-5 ml-2.5 space-y-6 text-xs">
                      {candidateDetail.companies?.map((company: string, idx: number) => (
                        <div key={idx} className="relative">
                          <div className="absolute -left-7 top-1 h-3.5 w-3.5 rounded-full border-2 border-indigo-600 bg-white" />
                          <h4 className="font-bold text-slate-800">{company}</h4>
                          <p className="text-[10px] text-slate-400 mt-0.5">Software Engineer • 2 Years Tenure</p>
                          <p className="text-slate-500 mt-2 leading-relaxed">
                            Contributed to system migration, feature development, backend optimization, and database schemas.
                          </p>
                        </div>
                      ))}
                    </div>
                    {/* Education */}
                    <div className="border-t border-slate-100 pt-6">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Education</h4>
                      {candidateDetail.education?.map((edu: any, idx: number) => (
                        <div key={idx} className="flex gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
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
                  <div className="space-y-6">
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
                    {/* Certifications */}
                    {candidateDetail.certifications?.length > 0 && (
                      <div className="border-t border-slate-100 pt-6">
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Verified Certifications</h4>
                        <div className="space-y-2">
                          {candidateDetail.certifications.map((cert: string, idx: number) => (
                            <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
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
                  <div className="space-y-6">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Recruiter Notes</h4>
                    {/* Add note form */}
                    <form onSubmit={handleNoteSubmit} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Add quick recruiter note..."
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-700"
                      />
                      <button
                        type="submit"
                        disabled={isSubmittingNote || !newNote.trim()}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-400 text-xs font-bold text-white rounded-xl transition-all"
                      >
                        {isSubmittingNote ? "Saving..." : "Add"}
                      </button>
                    </form>

                    {/* Notes List */}
                    <div className="space-y-3">
                      {candidateDetail.notes?.length > 0 ? (
                        candidateDetail.notes.map((note: any) => (
                          <div key={note.id} className="p-4 bg-slate-50 rounded-xl border border-slate-150 text-xs relative">
                            <p className="text-slate-600 leading-relaxed font-medium">{note.note}</p>
                            <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase">
                              <span>By {note.recruiter_name}</span>
                              <span>{new Date(note.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-400 text-center py-6">No recruiter notes posted yet.</p>
                      )}
                    </div>
                  </div>
                )}

                {activeDetailTab === "timeline" && (
                  <div className="space-y-6">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Timeline History</h4>
                    <div className="relative border-l border-slate-150 pl-5 ml-2.5 space-y-5 text-xs">
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
                    {/* Resume Changes log */}
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

export default function VaultPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-slate-500">
        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin mb-4" />
        <p className="text-sm font-medium">Opening Talent Vault...</p>
      </div>
    }>
      <VaultContent />
    </Suspense>
  );
}
