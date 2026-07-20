"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { api } from "@/lib/api";
import { Bot, Mail, Loader2, AlertTriangle, CheckCircle, ArrowLeft } from "lucide-react";

const forgotSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
});

type ForgotFields = z.infer<typeof forgotSchema>;

export default function ForgotPasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotFields>({
    resolver: zodResolver(forgotSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotFields) => {
    setError(null);
    setSuccess(false);
    try {
      await api.post<{ message: string }>("/auth/forgot-password", {
        email: data.email,
      }, false);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to submit request. Please try again.");
    }
  };

  return (
    <div className="w-full max-w-md p-8 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-2xl relative overflow-hidden">
      {/* Decorative Glow inside Card */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-violet-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col items-center text-center mb-8 relative z-10">
        <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 mb-4">
          <Bot className="h-6 w-6 text-indigo-400" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-white mb-1.5">
          Forgot Password
        </h2>
        <p className="text-sm text-slate-400">
          Enter your email to receive recovery instructions
        </p>
      </div>

      {/* Success Alert */}
      {success ? (
        <div className="text-center py-6 relative z-10 space-y-4">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <CheckCircle className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold text-white">Reset Link Dispatched</h3>
          <p className="text-sm text-slate-400 max-w-xs mx-auto">
            If an account matches that email, we&apos;ve sent recovery instructions. Check your inbox and spam folders.
          </p>
          <div className="pt-4">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Return to Login
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-500/20 flex items-start gap-3 text-red-200 text-sm">
              <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 relative z-10">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                <input
                  type="email"
                  placeholder="name@company.com"
                  {...register("email")}
                  disabled={isSubmitting}
                  className={`w-full h-12 pl-11 pr-4 rounded-xl border bg-slate-950/60 text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-all ${
                    errors.email
                      ? "border-red-500/50 focus:border-red-500"
                      : "border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  }`}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-400 mt-1.5">{errors.email.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-sm font-semibold text-white transition-all hover:shadow-[0_0_15px_rgba(99,102,241,0.4)]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending email...
                </>
              ) : (
                "Send Password Reset Link"
              )}
            </button>
          </form>

          {/* Footer Link */}
          <div className="text-center mt-6 relative z-10">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Sign in
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
