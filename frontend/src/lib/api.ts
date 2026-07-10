const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export interface UserProgressData {
  total_xp: number;
  current_streak: number;
  longest_streak: number;
  hearts: number;
  max_hearts: number;
  gems: number;
  daily_xp_goal: number;
  xp_today: number;
  streak_freeze_count: number;
  active_course_id: number;
}

export interface SkillProgress {
  status: "locked" | "available" | "in_progress" | "completed";
  crowns: number;
  lessons_completed: number;
}

export interface SkillData {
  id: number;
  unit_id: number;
  title: string;
  icon: string;
  order_index: number;
  required_skill_id: number | null;
  total_lessons: number;
  progress: SkillProgress;
}

export interface UnitData {
  id: number;
  course_id: number;
  title: string;
  description: string;
  order_index: number;
  color_theme: string;
  skills: SkillData[];
}

export interface CourseData {
  id: number;
  name: string;
  language_code: string;
  flag_emoji: string;
  units: UnitData[];
}

export interface LeaderboardEntryData {
  rank: number;
  username: string;
  display_name: string;
  avatar_url: string;
  xp_this_week: number;
  is_current_user: boolean;
}

export interface AchievementData {
  id: number;
  code: string;
  title: string;
  description: string;
  icon: string;
  xp_threshold: number | null;
  streak_threshold: number | null;
}

export interface UserAchievementData {
  achievement: AchievementData;
  earned_at: string;
}

export interface ProfileResponseData {
  user: {
    username: string;
    display_name: string;
    avatar_url: string;
    created_at: string;
  };
  progress: UserProgressData;
  achievements: UserAchievementData[];
}

export interface ExerciseData {
  id: number;
  lesson_id: number;
  order_index: number;
  exercise_type: "multiple_choice" | "translate" | "word_bank" | "match_pairs" | "fill_blank" | "type_answer";
  prompt: string;
  data: any;
}

export interface LessonData {
  lesson_id: number;
  exercises: ExerciseData[];
}

export interface AnswerResponse {
  correct: boolean;
  correct_answer: any;
  xp_delta: number;
  hearts_remaining: number;
}

export interface LessonCompleteResponse {
  xp_earned: number;
  hearts_lost: number;
  mistakes_count: number;
  is_perfect: boolean;
  streak_updated: boolean;
  new_streak: number;
  crowns_earned: number;
  new_achievements: AchievementData[];
}

// Token Storage helpers
function setCookie(name: string, value: string, days = 7) {
  if (typeof window !== "undefined") {
    let expires = "";
    if (value === "") {
      expires = "; expires=Thu, 01 Jan 1970 00:00:00 UTC";
    } else {
      const date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/";
  }
}

export function getStoredToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("duo_token");
  }
  return null;
}

export function setStoredToken(token: string | null) {
  if (typeof window !== "undefined") {
    if (token) {
      localStorage.setItem("duo_token", token);
      setCookie("duo_token", token, 7);
    } else {
      localStorage.removeItem("duo_token");
      setCookie("duo_token", "", -1);
    }
  }
}

// Global Auth Fetch Wrapper
async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getStoredToken();
  const headers = {
    ...options.headers,
    "Content-Type": "application/json",
  } as Record<string, string>;

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return fetch(url, {
    ...options,
    headers,
  });
}

// Auth endpoints
export async function login(username: string, password: string): Promise<{ access_token: string; username: string }> {
  const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || "Incorrect username or password");
  }
  const data = await res.json();
  setStoredToken(data.access_token);
  return data;
}

export async function register(
  username: string, 
  displayName: string, 
  password: string
): Promise<{ access_token: string; username: string }> {
  const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, display_name: displayName, password }),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || "Registration failed. Try a different username.");
  }
  const data = await res.json();
  setStoredToken(data.access_token);
  return data;
}

export function logout() {
  setStoredToken(null);
}

// Protected Resource fetches
export async function fetchHealth(): Promise<{ status: string; message: string }> {
  const res = await fetch(`${API_BASE_URL}/api/health`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch health check");
  return res.json();
}

export async function fetchProgress(): Promise<UserProgressData> {
  const res = await fetchWithAuth(`${API_BASE_URL}/api/progress`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch progress");
  return res.json();
}

export async function refillHearts(): Promise<UserProgressData> {
  const res = await fetchWithAuth(`${API_BASE_URL}/api/progress/hearts/refill`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to refill hearts");
  return res.json();
}

export async function fetchPath(): Promise<CourseData> {
  const res = await fetchWithAuth(`${API_BASE_URL}/api/path`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch path");
  return res.json();
}

export async function fetchLeaderboard(): Promise<LeaderboardEntryData[]> {
  const res = await fetchWithAuth(`${API_BASE_URL}/api/leaderboard`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch leaderboard");
  return res.json();
}

export async function fetchProfile(): Promise<ProfileResponseData> {
  const res = await fetchWithAuth(`${API_BASE_URL}/api/profile`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch profile");
  return res.json();
}

export async function fetchLesson(skillId: number): Promise<LessonData> {
  const res = await fetchWithAuth(`${API_BASE_URL}/api/skills/${skillId}/lesson`, { cache: "no-store" });
  if (!res.ok) {
    if (res.status === 403) {
      throw new Error("heart_empty");
    }
    throw new Error("Failed to fetch lesson");
  }
  return res.json();
}

export async function submitAnswer(exerciseId: number, answer: any): Promise<AnswerResponse> {
  const res = await fetchWithAuth(`${API_BASE_URL}/api/exercises/${exerciseId}/answer`, {
    method: "POST",
    body: JSON.stringify({ answer }),
  });
  if (!res.ok) {
    if (res.status === 403) {
      const data = await res.json();
      if (data.detail === "heart_empty") {
        throw new Error("heart_empty");
      }
    }
    throw new Error("Failed to submit answer");
  }
  return res.json();
}

export async function completeLesson(
  lessonId: number,
  mistakes: number,
  exercisesAnswered: number
): Promise<LessonCompleteResponse> {
  const res = await fetchWithAuth(`${API_BASE_URL}/api/lessons/${lessonId}/complete`, {
    method: "POST",
    body: JSON.stringify({ mistakes, exercises_answered: exercisesAnswered }),
  });
  if (!res.ok) throw new Error("Failed to complete lesson");
  return res.json();
}

export interface CourseListItem {
  id: number;
  name: string;
  language_code: string;
  flag_emoji: string;
}

export async function fetchCourses(): Promise<CourseListItem[]> {
  const res = await fetchWithAuth(`${API_BASE_URL}/api/courses`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch courses");
  return res.json();
}

export async function selectCourse(courseId: number): Promise<UserProgressData> {
  const res = await fetchWithAuth(`${API_BASE_URL}/api/courses/select`, {
    method: "POST",
    body: JSON.stringify({ course_id: courseId }),
  });
  if (!res.ok) throw new Error("Failed to select course");
  return res.json();
}

