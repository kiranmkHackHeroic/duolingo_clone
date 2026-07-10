"use client";

import { useEffect, useState } from "react";
import { useStore } from "src/lib/store";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, Trophy, User as UserIcon, Flame, Gem, Heart, Zap, LogOut } from "lucide-react";
import { fetchCourses, CourseListItem } from "src/lib/api";

const navLinks = [
  { href: "/learn", label: "Learn", icon: BookOpen },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/profile", label: "Profile", icon: UserIcon },
];

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const store = useStore();

  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    store.fetchProgressData();
    fetchCourses()
      .then((data) => setCourses(data))
      .catch((err) => console.error("Failed to load courses list", err));
  }, []);

  const activeCourse = courses.find((c) => c.id === store.activeCourseId) || {
    id: 1,
    name: "Spanish",
    language_code: "es",
    flag_emoji: "🇪🇸"
  };

  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-[#FBFBFB]">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r-2 border-zinc-200 bg-white p-6 fixed h-full z-10">
        <div className="flex items-center gap-2 mb-8 px-2">
          <span className="text-3xl font-extrabold text-[#58CC02] tracking-wider select-none">duolingo</span>
        </div>
        <nav className="flex flex-col gap-2 flex-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-4 px-4 py-3 rounded-xl font-bold transition-all border-2 ${
                  isActive
                    ? "bg-[#DDF4FF] text-[#1899D6] border-[#84d8ff]"
                    : "text-[#777777] hover:bg-zinc-100 border-transparent hover:text-zinc-900"
                }`}
              >
                <Icon className="w-6 h-6" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto pt-6 border-t border-zinc-200">
          <button
            onClick={() => {
              store.logout();
              router.push("/login");
            }}
            className="flex items-center gap-4 px-4 py-3 rounded-xl font-bold transition-all text-red-500 hover:bg-red-50 w-full cursor-pointer"
          >
            <LogOut className="w-6 h-6" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Panel wrapper */}
      <div className="flex flex-1 flex-col md:pl-64 pb-20 md:pb-0">
        {/* Sticky TopBar */}
        <header className="sticky top-0 bg-white border-b-2 border-zinc-200 z-20 px-6 py-4 flex items-center justify-between shadow-sm">
          {/* Mobile logo */}
          <span className="md:hidden text-2xl font-extrabold text-[#58CC02] tracking-wider select-none">duolingo</span>
          
          {/* Stats Bar */}
          <div className="flex items-center gap-6 ml-auto font-bold text-sm md:text-base select-none">
            
            {/* Flag Selector Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 bg-zinc-100 px-3 py-1.5 rounded-full border border-zinc-200 shadow-sm cursor-pointer hover:bg-zinc-200 transition-all select-none"
              >
                <span className="text-lg">{activeCourse.flag_emoji}</span>
                <span className="hidden sm:inline text-zinc-600 font-bold">{activeCourse.name}</span>
              </button>
              
              {dropdownOpen && (
                <>
                  {/* Backdrop overlay to close when clicking outside */}
                  <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                  <div className="absolute right-0 mt-2 w-48 bg-white border-2 border-zinc-200 rounded-2xl shadow-xl z-20 py-2">
                    {courses.map((course) => (
                      <button
                        key={course.id}
                        onClick={async () => {
                          setDropdownOpen(false);
                          await store.selectCourse(course.id);
                          window.location.reload();
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-2 text-left font-bold text-sm transition-all hover:bg-zinc-50 ${
                          course.id === store.activeCourseId ? "text-[#1899D6]" : "text-zinc-600"
                        }`}
                      >
                        <span className="text-xl">{course.flag_emoji}</span>
                        <span>{course.name}</span>
                        {course.id === store.activeCourseId && (
                          <span className="ml-auto text-[#1899D6]">✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Streak */}
            <div className="flex items-center gap-1.5 text-orange-500 hover:scale-105 transition-transform" title="Streak">
              <Flame className="w-5 h-5 fill-current" />
              <span>{store.currentStreak}</span>
            </div>

            {/* Gems */}
            <div className="flex items-center gap-1.5 text-blue-500 hover:scale-105 transition-transform" title="Gems">
              <Gem className="w-5 h-5 fill-current" />
              <span>{store.gems}</span>
            </div>

            {/* Hearts */}
            <button 
              onClick={() => store.refillHeartsOptimistic()} 
              className="flex items-center gap-1.5 text-red-500 hover:scale-105 transition-transform cursor-pointer" 
              title="Refill Hearts (Costs 100 Gems)"
            >
              <Heart className={`w-5 h-5 ${store.hearts > 0 ? 'fill-current' : 'animate-pulse'}`} />
              <span>{store.hearts}</span>
            </button>

            {/* XP */}
            <div className="flex items-center gap-1.5 text-yellow-500 hover:scale-105 transition-transform" title="Total XP">
              <Zap className="w-5 h-5 fill-current" />
              <span className="hidden sm:inline text-zinc-500 text-xs font-normal">XP:</span>
              <span>{store.totalXp}</span>
            </div>

            {/* Logout */}
            <button
              onClick={() => {
                store.logout();
                router.push("/login");
              }}
              className="flex items-center text-red-500 hover:text-red-600 transition-colors p-1.5 rounded-full hover:bg-zinc-100 cursor-pointer ml-2"
              title="Log Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Content Container */}
        <main className="flex-grow p-4 sm:p-6 md:p-8 max-w-4xl mx-auto w-full">
          {children}
        </main>
      </div>

      {/* Bottom Navigation - Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 border-t-2 border-zinc-200 bg-white flex items-center justify-around z-30 shadow-lg select-none">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg font-bold text-xs ${
                isActive ? "text-[#1899D6]" : "text-[#777777]"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
