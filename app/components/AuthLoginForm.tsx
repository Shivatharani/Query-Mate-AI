"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/better-auth-client";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AuthLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    try {
      const response = await signIn.email({ email, password });
      console.log("SignIn API Response:", response);
      let textError: string | null = null;

      if (response?.error) {
        if (typeof response.error === "string") {
          textError = response.error;
        } else if (response.error?.message) {
          textError = response.error.message;
        } else {
          textError = JSON.stringify(response.error);
        }
      }

      if (textError) {
        setError(textError);
      } else if (response?.data?.token) {
        localStorage.setItem("token", response.data.token);
        router.push("/chat");
      } else {
        setError("Unknown error during login. See console.");
      }
    } catch (err: any) {
      console.error("SignIn Exception:", err);
      const fallbackError =
        typeof err === "string"
          ? err
          : err?.message
          ? err.message
          : JSON.stringify(err);
      setError(fallbackError);
    }
  }

  return (
    <form className="max-w-md w-full bg-white p-8 rounded-xl shadow-md" onSubmit={handleSubmit}>
      <h2 className="text-2xl font-bold mb-2 text-center">Welcome back</h2>
      <p className="mb-6 text-center text-gray-500">Enter your credentials to access your account</p>
      <div className="mb-3">
        <label>Email</label>
        <input className="input w-full" required type="email" value={email} onChange={e => setEmail(e.target.value)} />
      </div>
      <div className="mb-3">
        <label>Password</label>
        <input className="input w-full" required type="password" value={password} onChange={e => setPassword(e.target.value)} />
      </div>
      <div className="flex justify-between items-center mb-4">
        <label className="flex items-center gap-2">
          <input type="checkbox"/>
          Remember me
        </label>
        <a href="#" className="text-xs text-gray-400">Forgot password?</a>
      </div>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      <button className="w-full bg-black text-white py-2 rounded mb-4">Sign in</button>
      <div className="my-4 text-center text-gray-400 font-medium text-xs">OR CONTINUE WITH</div>
      <div className="flex gap-4 mb-4">
        <button type="button" className="btn-ghost flex-1" onClick={() => signIn.github()}>Github</button>
        <button type="button" className="btn-ghost flex-1" onClick={() => signIn.google()}>Google</button>
      </div>
      <div className="text-center mt-2 text-sm">
        Don&apos;t have an account? <a href="/auth/signup" className="text-black">Sign up</a>
      </div>
    </form>
  );
}
