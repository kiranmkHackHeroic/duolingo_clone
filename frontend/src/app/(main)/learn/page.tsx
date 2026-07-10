"use client";

import { useEffect, useState } from "react";
import { fetchPath, CourseData, SkillData } from "src/lib/api";
import { SkillNode } from "src/components/path/SkillNode";
import { Button } from "src/components/ui/Button";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export default function LearnPage() {
  const [course, setCourse] = useState<CourseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTooltipId, setActiveTooltipId] = useState<number | null>(null);

  useEffect(() => {
    fetchPath()
      .then((data) => {
        setCourse(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load learning path", err);
        setError("Could not load learning path. Please try again.");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-12 h-12 text-[#58CC02] animate-spin" />
        <p className="text-zinc-500 font-extrabold">Loading your path...</p>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-white border-2 border-zinc-200 rounded-2xl max-w-md mx-auto">
        <h2 className="text-2xl font-extrabold text-red-500 mb-2">Oops!</h2>
        <p className="text-zinc-600 mb-6 font-bold">{error || "Something went wrong"}</p>
        <Button variant="primary" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  // Find the active lesson (first skill with status 'in_progress' or 'available')
  let activeSkillId: number | null = null;
  let foundActive = false;
  for (const unit of course.units) {
    for (const skill of unit.skills) {
      if (skill.progress.status === "in_progress" || skill.progress.status === "available") {
        activeSkillId = skill.id;
        foundActive = true;
        break;
      }
    }
    if (foundActive) break;
  }

  // Zigzag horizontal offsets in pixels
  const getXOffset = (index: number) => {
    const offsets = [0, 48, 80, 48, 0, -48, -80, -48];
    return offsets[index % offsets.length];
  };

  const handleNodeClick = (skill: SkillData) => {
    if (skill.progress.status === "locked") return;
    setActiveTooltipId(activeTooltipId === skill.id ? null : skill.id);
  };

  return (
    <div className="flex flex-col pb-16">
      {course.units.map((unit) => (
        <section key={unit.id} className="mb-12 flex flex-col items-center w-full">
          {/* Unit Header */}
          <div 
            style={{ backgroundColor: unit.color_theme }}
            className="w-full max-w-xl text-white p-6 rounded-2xl shadow-md mb-8 relative border-b-4 border-black/20"
          >
            <h2 className="text-xl font-black uppercase tracking-wider">{unit.title}</h2>
            <p className="text-sm font-semibold opacity-90 mt-1">{unit.description}</p>
          </div>

          {/* Skill path list */}
          <div className="relative flex flex-col items-center w-full max-w-md">
            {/* SVG Connecting Line in the background */}
            <svg 
              className="absolute top-12 bottom-12 left-0 right-0 w-full h-[calc(100%-6rem)] pointer-events-none -z-10"
              style={{ overflow: "visible" }}
            >
              <path
                d={unit.skills.map((skill, idx) => {
                  const x = 200 + getXOffset(idx); // center of width 400px is 200
                  const y = 48 + idx * 128; // spacing of 128px
                  return `${idx === 0 ? "M" : "L"} ${x} ${y}`;
                }).join(" ")}
                fill="none"
                stroke="#E5E5E5"
                strokeWidth="8"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="12 12"
              />
            </svg>

            {unit.skills.map((skill, idx) => {
              const xOffset = getXOffset(idx);
              const isCurrent = skill.id === activeSkillId;
              const isTooltipOpen = activeTooltipId === skill.id;

              return (
                <div 
                  key={skill.id} 
                  style={{ transform: `translateX(${xOffset}px)` }}
                  className="relative transition-transform duration-300"
                >
                  <SkillNode
                    skill={skill}
                    isActiveLesson={isCurrent}
                    onClick={handleNodeClick}
                  />

                  {/* Start Popup Tooltip */}
                  {isTooltipOpen && (
                    <>
                      {/* Invisible backdrop to close the popup */}
                      <div 
                        className="fixed inset-0 z-20 cursor-default"
                        onClick={() => setActiveTooltipId(null)}
                      />
                      {/* Tooltip Card */}
                      <div className="absolute bottom-[110%] left-1/2 -translate-x-1/2 bg-white border-2 border-zinc-200 p-4 rounded-2xl shadow-xl w-60 z-30 flex flex-col items-center gap-2 select-none border-b-4 animate-in fade-in slide-in-from-bottom-2 duration-150">
                        <h3 className="font-extrabold text-base text-zinc-700 uppercase tracking-wide">
                          {skill.title}
                        </h3>
                        <p className="text-xs text-zinc-400 font-extrabold">
                          {skill.progress.status === "completed" 
                            ? "Mastery Level 1/1" 
                            : `Lesson ${skill.progress.lessons_completed + 1} of ${skill.total_lessons}`
                          }
                        </p>
                        
                        <Link href={`/lesson/${skill.id}`} className="w-full mt-1">
                          <Button 
                            variant={skill.progress.status === "completed" ? "super" : "primary"}
                            className="w-full py-2 text-sm shadow-md"
                          >
                            {skill.progress.status === "completed" ? "PRACTICE" : "START"}
                          </Button>
                        </Link>
                        
                        {/* Tooltip arrow */}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-b-2 border-r-2 border-zinc-200 rotate-45 -mt-2" />
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
