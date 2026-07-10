"use client";

import { useEffect, useState } from "react";
import { fetchProfile, ProfileResponseData } from "src/lib/api";
import { Loader2, Zap, Flame, Gem, Calendar, Check, Award } from "lucide-react";
import { Button } from "src/components/ui/Button";

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileResponseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile()
      .then((data) => {
        setProfile(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load profile", err);
        setError("Could not load user profile details.");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-12 h-12 text-[#58CC02] animate-spin" />
        <p className="text-zinc-500 font-extrabold">Loading your stats...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-white border-2 border-zinc-200 rounded-2xl max-w-md mx-auto">
        <h2 className="text-2xl font-extrabold text-red-500 mb-2">Error</h2>
        <p className="text-zinc-600 mb-6 font-bold">{error || "Failed to load profile."}</p>
        <Button variant="primary" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  const { user, progress, achievements } = profile;
  const createdDate = new Date(user.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });

  // Master list of all possible achievements to show earned vs unearned states
  const allAchievements = [
    { id: 1, code: "streak_7", title: "Wildfire", description: "Reach a 7-day streak", icon: "🔥" },
    { id: 2, code: "xp_100", title: "Sage", description: "Earn 100 total XP", icon: "🦉" },
    { id: 3, code: "perfect_lesson", title: "Superstar", description: "Complete a lesson with no mistakes", icon: "⭐" },
  ];

  return (
    <div className="max-w-2xl mx-auto w-full select-none pb-12">
      {/* User Info Header Card */}
      <div className="bg-white border-2 border-zinc-200 rounded-3xl p-6 sm:p-8 shadow-sm mb-8 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left relative">
        <img
          src={user.avatar_url || "https://api.dicebear.com/7.x/adventurer/svg?seed=duo_learner"}
          alt={user.display_name}
          className="w-24 h-24 rounded-full border-4 border-[#58CC02] bg-zinc-50"
        />
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-black text-zinc-700">{user.display_name}</h1>
          <p className="text-zinc-400 font-bold">@{user.username}</p>
          <div className="flex items-center justify-center sm:justify-start gap-1.5 text-zinc-400 text-sm font-semibold mt-3">
            <Calendar className="w-4 h-4" />
            <span>Joined {createdDate}</span>
          </div>
        </div>
      </div>

      {/* Statistics Section */}
      <h2 className="text-2xl font-black text-zinc-700 mb-4 px-1">Statistics</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {/* Total XP */}
        <div className="bg-white border-2 border-zinc-200 rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-yellow-50 rounded-xl text-yellow-500">
            <Zap className="w-6 h-6 fill-current" />
          </div>
          <div>
            <span className="block text-xl font-black text-zinc-700">{progress.total_xp}</span>
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wide">Total XP</span>
          </div>
        </div>

        {/* Current Streak */}
        <div className="bg-white border-2 border-zinc-200 rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-orange-50 rounded-xl text-orange-500">
            <Flame className="w-6 h-6 fill-current" />
          </div>
          <div>
            <span className="block text-xl font-black text-zinc-700">{progress.current_streak}</span>
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wide">Day Streak</span>
          </div>
        </div>

        {/* Longest Streak */}
        <div className="bg-white border-2 border-zinc-200 rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-red-50 rounded-xl text-red-500">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-xl font-black text-zinc-700">{progress.longest_streak}</span>
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wide">Max Streak</span>
          </div>
        </div>

        {/* Gems */}
        <div className="bg-white border-2 border-zinc-200 rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 rounded-xl text-blue-500">
            <Gem className="w-6 h-6 fill-current" />
          </div>
          <div>
            <span className="block text-xl font-black text-zinc-700">{progress.gems}</span>
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wide">Gems Balance</span>
          </div>
        </div>
      </div>

      {/* Achievements Section */}
      <h2 className="text-2xl font-black text-zinc-700 mb-4 px-1">Achievements</h2>
      <div className="flex flex-col gap-4">
        {allAchievements.map((ach) => {
          // Check if user earned this achievement
          const earned = achievements.find((ua) => ua.achievement.code === ach.code);

          return (
            <div
              key={ach.code}
              className={`bg-white border-2 rounded-2xl p-4 sm:p-5 flex items-center gap-5 shadow-sm transition-all ${
                earned 
                  ? "border-[#58CC02]/40 bg-white" 
                  : "border-zinc-200 opacity-60 bg-zinc-50"
              }`}
            >
              {/* Badge Icon */}
              <div 
                className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl border-2 shadow-inner select-none ${
                  earned 
                    ? "bg-[#DDF4FF]/50 border-[#84d8ff] scale-105" 
                    : "bg-zinc-200 border-zinc-300 filter grayscale"
                }`}
              >
                {ach.icon}
              </div>

              {/* Detail texts */}
              <div className="flex-1">
                <h3 className="font-extrabold text-zinc-700 text-lg flex items-center gap-2">
                  {ach.title}
                  {earned && (
                    <span className="px-2 py-0.5 rounded-full bg-[#E5F6DF] text-[#388501] text-[10px] font-black uppercase flex items-center gap-0.5 border border-[#58CC02]/30">
                      <Check className="w-3 h-3" /> Earned
                    </span>
                  )}
                </h3>
                <p className="text-sm text-zinc-500 font-semibold">{ach.description}</p>
                {earned && (
                  <span className="text-[10px] text-zinc-400 font-bold block mt-1">
                    Earned on {new Date(earned.earned_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
