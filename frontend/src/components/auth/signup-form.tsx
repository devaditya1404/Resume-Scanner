"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/context/auth-context";
import { Bot, Mail, Lock, Loader2, AlertTriangle, User, Building, Eye, EyeOff } from "lucide-react";

const signupSchema = z
  .object({
    fullName: z.string().min(1, { message: "Full name is required" }),
    companyName: z.string().optional(),
    email: z.string().email({ message: "Invalid email address" }),
    password: z.string().min(8, { message: "Password must be at least 8 characters" }),
    confirmPassword: z.string().min(1, { message: "Confirm password is required" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type SignupFields = z.infer<typeof signupSchema>;

export default function SignupForm() {
  const { signup } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFields>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: "",
      companyName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: SignupFields) => {
    setError(null);
    try {
      await signup(data.email, data.password, data.fullName, data.companyName);
    } catch (err: any) {
      setError(err.message || "Signup failed. Please try again.");
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
          Create Recruiter Account
        </h2>
        <p className="text-sm text-slate-400">
          Sign up to build your persistent AI Talent Vault
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-500/20 flex items-start gap-3 text-red-200 text-sm">
          <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 relative z-10">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
            Full Name
          </label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
            <input
              type="text"
              placeholder="Jane Doe"
              {...register("fullName")}
              disabled={isSubmitting}
              className={`w-full h-11 pl-11 pr-4 rounded-xl border bg-slate-950/60 text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-all ${
                errors.fullName
                  ? "border-red-500/50 focus:border-red-500"
                  : "border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              }`}
            />
          </div>
          {errors.fullName && (
            <p className="text-xs text-red-400 mt-1.5">{errors.fullName.message}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
            Company Name
          </label>
          <div className="relative">
            <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
            <input
              type="text"
              placeholder="Acme Corp"
              {...register("companyName")}
              disabled={isSubmitting}
              className="w-full h-11 pl-11 pr-4 rounded-xl border border-slate-800 bg-slate-950/60 text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
            Work Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
            <input
              type="email"
              placeholder="name@company.com"
              {...register("email")}
              disabled={isSubmitting}
              className={`w-full h-11 pl-11 pr-4 rounded-xl border bg-slate-950/60 text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-all ${
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

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="•••••••• (Min 8 chars)"
              {...register("password")}
              disabled={isSubmitting}
              className={`w-full h-11 pl-11 pr-11 rounded-xl border bg-slate-950/60 text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-all ${
                errors.password
                  ? "border-red-500/50 focus:border-red-500"
                  : "border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-red-400 mt-1.5">{errors.password.message}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
            Confirm Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
            <input
              type="password"
              placeholder="••••••••"
              {...register("confirmPassword")}
              disabled={isSubmitting}
              className={`w-full h-11 pl-11 pr-4 rounded-xl border bg-slate-950/60 text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-all ${
                errors.confirmPassword
                  ? "border-red-500/50 focus:border-red-500"
                  : "border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              }`}
            />
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-red-400 mt-1.5">{errors.confirmPassword.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-sm font-semibold text-white transition-all hover:shadow-[0_0_15px_rgba(99,102,241,0.4)] pt-0.5"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating account...
            </>
          ) : (
            "Create Account"
          )}
        </button>
      </form>

      {/* Footer Link */}
      <p className="text-center text-xs text-slate-400 mt-6 relative z-10">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
