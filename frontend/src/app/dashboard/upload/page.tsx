"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import {
  UploadCloud,
  FileText,
  CheckCircle,
  XCircle,
  Loader2,
  ExternalLink,
  Info
} from "lucide-react";
import Link from "next/link";

export default function UploadPage() {
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [uploadResult, setUploadResult] = useState<any | null>(null);
  const [uploadsHistory, setUploadsHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  const fetchUploadsHistory = async () => {
    try {
      setIsLoadingHistory(true);
      const res = await api.get<any[]>("/uploads");
      setUploadsHistory(res);
    } catch (err) {
      console.error("Failed to load uploads history:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchUploadsHistory();
  }, []);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processUpload = async (file: File) => {
    setIsUploading(true);
    setUploadResult(null);
    setUploadProgress(`Uploading ${file.name}...`);

    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploadProgress("Sending file to AI Recruiter Brain...");
      // Hit candidates upload endpoint
      const response = await api.post<any>("/candidates/upload", formData);
      setUploadResult(response);
      setUploadProgress("Import completed successfully!");
      fetchUploadsHistory();
    } catch (err: any) {
      console.error("Upload failed:", err);
      setUploadProgress(err.message || "Failed to process resume file");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processUpload(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-4xl">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Talent Import Portal</h1>
        <p className="text-sm text-slate-500 mt-1">
          Upload individual resumes (PDF/DOCX) or bulk ZIP files containing thousands of profiles to construct your vault.
        </p>
      </div>

      {/* Drag & Drop Box */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center transition-all min-h-[220px] relative ${
          dragActive
            ? "border-indigo-600 bg-indigo-50/20"
            : "border-slate-300 hover:border-indigo-400 bg-white"
        }`}
      >
        <input
          type="file"
          accept=".zip,.pdf,.docx"
          onChange={handleFileChange}
          disabled={isUploading}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
        />

        {isUploading ? (
          <div className="space-y-4">
            <Loader2 className="h-10 w-10 text-indigo-600 animate-spin mx-auto" />
            <div>
              <p className="text-sm font-semibold text-slate-800">Processing file payload...</p>
              <p className="text-xs text-indigo-600 font-medium mt-1">{uploadProgress}</p>
            </div>
          </div>
        ) : (
          <>
            <UploadCloud className="h-12 w-12 text-slate-400 mb-4" />
            <p className="text-sm font-semibold text-slate-700">
              Drag and drop your file here, or <span className="text-indigo-600 hover:underline font-bold">browse</span>
            </p>
            <p className="text-xs text-slate-400 mt-1.5 max-w-md leading-relaxed">
              Supports standard ZIP folders (containing PDF or DOCX resumes), PDF files, or DOCX files. Files are automatically cleaned, duplicate-checked, and indexed.
            </p>
          </>
        )}
      </div>

      {/* Processing Result Indicator */}
      {uploadResult && (
        <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-start gap-4">
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div className="flex-1 text-xs space-y-2">
            <h4 className="font-bold text-slate-800 text-sm">Upload Result Summary</h4>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <span className="text-slate-400 block mb-0.5 font-medium">Status</span>
                <span className="text-slate-800 font-bold uppercase tracking-wider text-[10px] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                  {uploadResult.status}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5 font-medium">Resumes Processed</span>
                <span className="text-slate-800 font-bold">{uploadResult.processed}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5 font-medium">Duplicates Merged</span>
                <span className="text-slate-800 font-bold text-amber-600">{uploadResult.duplicates_merged}</span>
              </div>
              {uploadResult.candidate_id && (
                <div>
                  <span className="text-slate-400 block mb-0.5 font-medium">Shortcut Link</span>
                  <Link
                    href={`/dashboard/vault?q=${uploadResult.candidate_id}`}
                    className="text-indigo-600 hover:underline font-bold flex items-center gap-1"
                  >
                    View Candidate Profile
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Uploads History List */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Upload Process History</h2>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl">
            <Info className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
            <span>Updates refresh automatically</span>
          </div>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {isLoadingHistory ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="h-6 w-6 text-indigo-600 animate-spin mb-3" />
              <p className="font-medium">Loading history...</p>
            </div>
          ) : uploadsHistory.length > 0 ? (
            uploadsHistory.map((upload) => (
              <div key={upload.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-slate-400" />
                  <div>
                    <p className="font-bold text-slate-800">{upload.file_name}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {(upload.file_size / 1024).toFixed(1)} KB • {new Date(upload.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  upload.status === "COMPLETED"
                    ? "bg-emerald-50 border border-emerald-100 text-emerald-600"
                    : upload.status === "PROCESSING"
                    ? "bg-indigo-50 border border-indigo-100 text-indigo-600 animate-pulse"
                    : "bg-red-50 border border-red-100 text-red-600"
                }`}>
                  {upload.status}
                </span>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-slate-400 font-medium">
              No files uploaded yet in this workspace.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
