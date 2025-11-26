"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signUp } from "@/lib/better-auth-client";
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AuthSignupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    try {
      const response = await signUp.email({ name, email, password });
      console.log("SignUp API Response:", response);
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
        setError("Unknown error during signup. See console.");
      }
    } catch (err: any) {
      console.error("SignUp Exception:", err);
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
      <h2 className="text-2xl font-bold mb-2 text-center">Create an account</h2>
      <p className="mb-6 text-center text-gray-500">Sign up to start using QueryMate AI</p>
      <div className="mb-3">
        <label>Name</label>
        <input className="input w-full" required type="text" value={name} onChange={e => setName(e.target.value)} />
      </div>
      <div className="mb-3">
        <label>Email</label>
        <input className="input w-full" required type="email" value={email} onChange={e => setEmail(e.target.value)} />
      </div>
      <div className="mb-3">
        <label>Password</label>
        <input className="input w-full" required type="password" value={password} onChange={e => setPassword(e.target.value)} />
      </div>
      <div className="mb-4">
        <label>Confirm Password</label>
        <input className="input w-full" required type="password" value={confirm} onChange={e => setConfirm(e.target.value)} />
      </div>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      <button className="w-full bg-black text-white py-2 rounded mb-4">Sign up</button>
      <div className="my-4 text-center text-gray-400 font-medium text-xs">OR CONTINUE WITH</div>
      <div className="flex gap-4 mb-4">
        <button type="button" className="btn-ghost flex-1" onClick={() => signUp.github()}>Github</button>
        <button type="button" className="btn-ghost flex-1" onClick={() => signUp.google()}>Google</button>
      </div>
      <div className="text-center mt-2 text-sm">
        Already have an account? <a href="/auth/login" className="text-black">Sign in</a>
      </div>
    </form>
  );
}
