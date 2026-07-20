import LoginForm from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="relative flex-1 min-h-[calc(100vh-80px)] flex items-center justify-center bg-slate-950 py-12 px-6">
      {/* Decorative ambient background glows */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-violet-500/5 rounded-full blur-[100px] pointer-events-none" />
      
      <LoginForm />
    </div>
  );
}
