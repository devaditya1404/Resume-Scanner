"use client";

import React, { useState, useEffect, useRef } from "react";
import { api } from "@/lib/api";
import {
  Send,
  Bot,
  User as UserIcon,
  Sparkles,
  MapPin,
  Briefcase,
  Clock,
  Loader2,
  X,
  BookOpen,
  Award,
  Mail,
  Phone,
  Globe,
  MessageSquare,
  FileText
} from "lucide-react";

interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
  candidates?: any[];
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "bot",
      text: "Hello! I am the ResumeX Recruiter Brain. Ask me any recruiting or candidate search questions in plain English, and I will scan your Talent Vault to find the best matches."
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Drawer States for details
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [candidateDetail, setCandidateDetail] = useState<any | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState("overview");
  const [newNote, setNewNote] = useState("");
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [contactStatus, setContactStatus] = useState("Emailed");
  const [contactRemarks, setContactRemarks] = useState("");
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);

  // Suggested Prompt Pills
  const suggestedPrompts = [
    "Find Java Developers",
    "Find Banking domain candidates",
    "Show immediate joiners",
    "Find candidates similar to Rahul"
  ];

  // Auto Scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  // Load candidate detail for drawer
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
        console.error("Failed to load details:", err);
      } finally {
        setIsDetailLoading(false);
      }
    };
    loadDetails();
  }, [selectedCandidateId]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isSending) return;

    // Add user message
    const userMsg: Message = {
      id: Math.random().toString(),
      sender: "user",
      text: textToSend
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsSending(true);

    try {
      // Hit semantic chat endpoint
      const response = await api.post<any>("/candidates/chat", { query: textToSend });
      
      const botMsg: Message = {
        id: Math.random().toString(),
        sender: "bot",
        text: response.message,
        candidates: response.candidates || []
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error("Chat failure:", err);
      const errMsg: Message = {
        id: Math.random().toString(),
        sender: "bot",
        text: "I encountered an error trying to search the vault. Please verify the backend is running."
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsSending(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputText);
  };

  // Submit note in drawer
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

  // Log contact in drawer
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
      console.error("Failed to log contact:", err);
    } finally {
      setIsSubmittingContact(false);
    }
  };

  return (
    <div className="flex h-full gap-8 relative overflow-hidden animate-fadeIn">
      {/* Main Conversational Section */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-white border border-slate-200 rounded-2xl shadow-sm">
        
        {/* Chat Header */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-3 shrink-0">
          <Bot className="h-6 w-6 text-indigo-600" />
          <div>
            <h2 className="text-sm font-bold text-slate-800 leading-tight">AI Recruiter Assistant</h2>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mt-0.5">ResumeX Brain Live</p>
          </div>
        </div>

        {/* Message Logs */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-4 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
              {msg.sender === "bot" && (
                <div className="h-8 w-8 rounded-full bg-indigo-50 border border-indigo-150 flex items-center justify-center text-indigo-600 shrink-0">
                  <Bot className="h-4.5 w-4.5" />
                </div>
              )}

              <div className="space-y-3 max-w-xl">
                <div className={`p-4 rounded-2xl text-xs leading-relaxed ${
                  msg.sender === "user"
                    ? "bg-indigo-600 text-white font-medium rounded-tr-none shadow-sm"
                    : "bg-slate-50 border border-slate-150 text-slate-700 rounded-tl-none font-medium"
                }`}>
                  {msg.text}
                </div>

                {/* Display candidate cards inside Chat feed */}
                {msg.candidates && msg.candidates.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                    {msg.candidates.map((cand) => (
                      <div
                        key={cand.id}
                        onClick={() => setSelectedCandidateId(cand.id)}
                        className="p-4 bg-white border border-slate-200 hover:border-indigo-500 hover:shadow-sm rounded-xl cursor-pointer transition-all flex flex-col justify-between text-xs space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-1.5">
                          <div>
                            <h4 className="font-bold text-slate-800">{cand.name}</h4>
                            <p className="text-[10px] text-slate-400 mt-0.5">{cand.current_company}</p>
                          </div>
                          <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                            {cand.match_score}%
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-400">
                          <span className="truncate">{cand.experience_years} Years Exp</span>
                          <span className="truncate">{cand.location}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed bg-slate-50 border border-slate-100 p-2 rounded-lg">
                          {cand.reason_why}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {msg.sender === "user" && (
                <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
                  <UserIcon className="h-4.5 w-4.5" />
                </div>
              )}
            </div>
          ))}

          {isSending && (
            <div className="flex gap-4 justify-start">
              <div className="h-8 w-8 rounded-full bg-indigo-50 border border-indigo-150 flex items-center justify-center text-indigo-600 shrink-0 animate-pulse">
                <Bot className="h-4.5 w-4.5" />
              </div>
              <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl rounded-tl-none flex items-center gap-2">
                <Loader2 className="h-4.5 w-4.5 text-indigo-600 animate-spin" />
                <span className="text-xs text-slate-400 font-semibold">Brain is scanning candidates...</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Prompt Suggestions & Form Box */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 shrink-0 space-y-3">
          {/* Prompt pills */}
          <div className="flex flex-wrap gap-2">
            {suggestedPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(prompt)}
                disabled={isSending}
                className="px-3 py-1.5 bg-white hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 text-[10px] text-slate-500 font-bold border border-slate-200 rounded-xl transition-all whitespace-nowrap cursor-pointer shadow-sm"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleFormSubmit} className="flex gap-2">
            <input
              type="text"
              placeholder="Ask anything (e.g. Find ServiceNow developers availability)..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isSending}
              className="flex-1 px-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white text-slate-700 transition-all placeholder-slate-400"
            />
            <button
              type="submit"
              disabled={isSending || !inputText.trim()}
              className="px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-400 text-white rounded-xl shadow-sm flex items-center justify-center"
            >
              <Send className="h-4.5 w-4.5" />
            </button>
          </form>
        </div>
      </div>

      {/* Right Drawer details panel */}
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

          {/* Drawer tabs */}
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
                          className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-400 text-white font-bold rounded-xl transition-all"
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
                  <div className="space-y-6 text-xs font-medium">
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
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all"
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
