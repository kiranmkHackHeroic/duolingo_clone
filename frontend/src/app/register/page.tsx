"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { register, getStoredToken } from "../../lib/api";
import { useStore } from "../../lib/store";
import { Button } from "../../components/ui/Button";

export default function RegisterPage() {
  const router = useRouter();
  const fetchProgressData = useStore((state) => state.fetchProgressData);
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = getStoredToken();
    if (token) {
      router.push("/learn");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim() || !username.trim() || !password) {
      setError("Please fill in all fields.");
      return;
    }

    if (username.trim().length < 3) {
      setError("Username must be at least 3 characters long.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await register(
        username.trim().toLowerCase(),
        displayName.trim(),
        password
      );
      await fetchProgressData();
      router.push("/learn");
    } catch (err: any) {
      setError(err.message || "Registration failed. Username may be taken.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
      {/* Container */}
      <div className="max-w-md w-full border-2 border-gray-200 rounded-2xl p-8 shadow-sm">
        {/* Logo Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-[#58CC02] tracking-wide mb-2 uppercase font-baloo">
            duolingo
          </h1>
          <p className="text-gray-500 font-bold">Create a new profile</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border-2 border-red-200 text-red-600 rounded-xl text-sm font-bold text-center">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-extrabold text-gray-600 mb-1">
              DISPLAY NAME
            </label>
            <input
              type="text"
              placeholder="e.g. John Doe"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl font-bold placeholder-gray-400 focus:outline-none focus:border-[#1CB0F6] transition-colors"
              disabled={loading}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-extrabold text-gray-600 mb-1">
              USERNAME
            </label>
            <input
              type="text"
              placeholder="e.g. john_doe"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl font-bold placeholder-gray-400 focus:outline-none focus:border-[#1CB0F6] transition-colors"
              disabled={loading}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-extrabold text-gray-600 mb-1">
              PASSWORD
            </label>
            <input
              type="password"
              placeholder="Min. 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl font-bold placeholder-gray-400 focus:outline-none focus:border-[#1CB0F6] transition-colors"
              disabled={loading}
              required
            />
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="secondary"
              className="w-full py-3"
              disabled={loading}
            >
              {loading ? "CREATING PROFILE..." : "CREATE PROFILE"}
            </Button>
          </div>
        </form>

        {/* Footer Toggle */}
        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <p className="text-gray-500 font-bold">
            Already have an account?{" "}
            <Link href="/login" className="text-[#1CB0F6] hover:underline">
              Log In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
