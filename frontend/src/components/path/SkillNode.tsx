import React from "react";
import Link from "next/link";
import { Lock, Star } from "lucide-react";
import { SkillData } from "src/lib/api";

interface SkillNodeProps {
  skill: SkillData;
  isActiveLesson: boolean;
  onClick: (skill: SkillData, element: HTMLButtonElement) => void;
}

export function SkillNode({ skill, isActiveLesson, onClick }: SkillNodeProps) {
  const { title, icon, progress, total_lessons } = skill;
  const { status, crowns, lessons_completed } = progress;

  const isLocked = status === "locked";
  const isCompleted = status === "completed";
  
  // Progress Ring Math
  const pct = Math.min(100, Math.max(0, (lessons_completed / total_lessons) * 100));
  const radius = 36;
  const stroke = 6;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (pct / 100) * circumference;

  const buttonRef = React.useRef<HTMLButtonElement>(null);

  // Styling based on status
  let outerRingColor = "stroke-zinc-200";
  let progressRingColor = "stroke-[#58CC02]";
  let buttonColor = "bg-[#58CC02] border-[#46a302] text-white";
  let iconColor = "text-white";

  if (isLocked) {
    buttonColor = "bg-[#E5E5E5] border-[#C0C0C0] text-[#AFAFAF]";
    iconColor = "text-[#AFAFAF]";
  } else if (isCompleted) {
    buttonColor = "bg-[#FFC800] border-[#E6B400] text-[#4b4b4b]";
    progressRingColor = "stroke-[#FFC800]";
  } else if (status === "available" || status === "in_progress") {
    // Normal in-progress or available
    buttonColor = "bg-[#58CC02] border-[#46a302] text-white";
  }

  return (
    <div className="flex flex-col items-center select-none relative my-4">
      {/* Skill Node Button and Progress Ring */}
      <div className="relative w-24 h-24 flex items-center justify-center">
        {/* SVG Progress Ring */}
        {!isLocked && (
          <svg className="absolute w-24 h-24 -rotate-90 transform" viewBox="0 0 72 72">
            {/* Background Ring */}
            <circle
              className={outerRingColor}
              strokeWidth={stroke}
              fill="transparent"
              r={normalizedRadius}
              cx="36"
              cy="36"
            />
            {/* Active Progress Ring */}
            <circle
              className={`${progressRingColor} transition-all duration-500`}
              strokeWidth={stroke}
              strokeDasharray={circumference + " " + circumference}
              style={{ strokeDashoffset }}
              strokeLinecap="round"
              fill="transparent"
              r={normalizedRadius}
              cx="36"
              cy="36"
            />
          </svg>
        )}

        {/* Pulsing effect for active lesson node */}
        {isActiveLesson && (
          <span className="absolute inline-flex h-20 w-20 rounded-full bg-[#58CC02]/30 animate-ping" />
        )}

        {/* The Node Button */}
        <button
          ref={buttonRef}
          onClick={() => onClick(skill, buttonRef.current!)}
          className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center border-b-4 font-bold text-2xl active:translate-y-[2px] active:border-b-2 transition-all cursor-pointer shadow-md ${buttonColor}`}
        >
          {isLocked ? (
            <Lock className="w-6 h-6" />
          ) : isCompleted ? (
            <Star className="w-7 h-7 fill-current" />
          ) : (
            <span className="text-2xl">{icon}</span>
          )}
        </button>
      </div>

      {/* Label */}
      <span className="mt-2 text-sm font-extrabold text-zinc-700 tracking-wide text-center">
        {title}
      </span>
    </div>
  );
}
