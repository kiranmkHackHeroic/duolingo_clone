"use client";

import { useEffect, useState } from "react";
import { fetchLeaderboard, LeaderboardEntryData } from "src/lib/api";
import { Loader2, Trophy, Award, Medal } from "lucide-react";
import { Button } from "src/components/ui/Button";

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLeaderboard()
      .then((data) => {
        setEntries(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load leaderboard", err);
        setError("Could not load leaderboard entries.");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-12 h-12 text-[#58CC02] animate-spin" />
        <p className="text-zinc-500 font-extrabold">Loading rankings...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-white border-2 border-zinc-200 rounded-2xl max-w-md mx-auto">
        <h2 className="text-2xl font-extrabold text-red-500 mb-2">Error</h2>
        <p className="text-zinc-600 mb-6 font-bold">{error}</p>
        <Button variant="primary" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto w-full select-none">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-3xl p-6 shadow-md mb-8 flex items-center justify-between border-b-4 border-orange-600">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-wider flex items-center gap-2">
            <Trophy className="w-8 h-8 animate-bounce fill-yellow-200 stroke-yellow-700" />
            Bronze League
          </h1>
          <p className="text-sm font-semibold opacity-90 mt-1">
            Top 3 learners advance to Silver League!
          </p>
        </div>
        <div className="bg-white/20 px-4 py-2 rounded-xl text-center hidden sm:block">
          <span className="block text-xs font-black uppercase opacity-75">Time Left</span>
          <span className="text-lg font-black tracking-wide">2d 04h</span>
        </div>
      </div>

      {/* Rankings List */}
      <div className="bg-white border-2 border-zinc-200 rounded-3xl overflow-hidden shadow-sm flex flex-col">
        {entries.map((entry) => {
          const isGold = entry.rank === 1;
          const isSilver = entry.rank === 2;
          const isBronze = entry.rank === 3;
          
          return (
            <div
              key={entry.username}
              className={`flex items-center gap-4 p-4 sm:p-5 border-b-2 border-zinc-100 last:border-b-0 transition-colors ${
                entry.is_current_user
                  ? "bg-[#DDF4FF]/40 border-[#bfe8ff] text-[#1899D6] border-y-2 -my-[2px] z-10"
                  : "hover:bg-zinc-50"
              }`}
            >
              {/* Rank Badge / Number */}
              <div className="w-10 flex justify-center items-center">
                {isGold ? (
                  <Award className="w-8 h-8 text-yellow-500 fill-yellow-100" />
                ) : isSilver ? (
                  <Medal className="w-7 h-7 text-zinc-400 fill-zinc-100" />
                ) : isBronze ? (
                  <Medal className="w-7 h-7 text-amber-600 fill-amber-100" />
                ) : (
                  <span className="font-extrabold text-lg text-zinc-400">{entry.rank}</span>
                )}
              </div>

              {/* Avatar */}
              <img
                src={entry.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${entry.username}`}
                alt={entry.display_name}
                className="w-12 h-12 rounded-full border-2 border-zinc-200 bg-zinc-50"
              />

              {/* Identity details */}
              <div className="flex-1 min-w-0">
                <h3 className={`font-extrabold truncate ${entry.is_current_user ? "text-[#1899D6]" : "text-zinc-700"}`}>
                  {entry.display_name}
                </h3>
                <span className="text-xs font-bold text-zinc-400">@{entry.username}</span>
              </div>

              {/* XP */}
              <div className="text-right">
                <span className="font-black text-lg text-zinc-600 tracking-wide">{entry.xp_this_week}</span>
                <span className="text-[10px] font-black text-zinc-400 block uppercase tracking-wide">XP</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
