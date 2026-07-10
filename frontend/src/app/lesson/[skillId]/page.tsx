"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "src/lib/store";
import {
  fetchLesson,
  submitAnswer,
  completeLesson,
  ExerciseData,
  LessonCompleteResponse,
} from "src/lib/api";
import { Button } from "src/components/ui/Button";
import { Heart, X, Volume2, ArrowRight, CheckCircle, AlertCircle, RefreshCw, Trophy, Zap, Clock, Flame } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

interface PageProps {
  params: Promise<{ skillId: string }>;
}

export default function LessonPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const skillId = parseInt(resolvedParams.skillId);
  const router = useRouter();
  const store = useStore();

  // Lesson State
  const [exercises, setExercises] = useState<ExerciseData[]>([]);
  const [initialCount, setInitialCount] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Exercise Playing State
  const [selectedOption, setSelectedOption] = useState<string | null>(null); // multiple_choice, fill_blank
  const [typedAnswer, setTypedAnswer] = useState(""); // translate, type_answer
  const [selectedWords, setSelectedWords] = useState<string[]>([]); // word_bank
  
  // Match Pairs State
  const [leftWords, setLeftWords] = useState<string[]>([]);
  const [rightWords, setRightWords] = useState<string[]>([]);
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [selectedRight, setSelectedRight] = useState<string | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<[string, string][]>([]);
  const [wrongMatch, setWrongMatch] = useState<[string, string] | null>(null);

  // Check state
  const [checked, setChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [correctAnswerDetail, setCorrectAnswerDetail] = useState<any>(null);
  const [mistakesCount, setMistakesCount] = useState(0);

  // Modal / Win States
  const [outOfHearts, setOutOfHearts] = useState(false);
  const [lessonComplete, setLessonComplete] = useState(false);
  const [completionSummary, setCompletionSummary] = useState<LessonCompleteResponse | null>(null);

  // Framer motion shake triggers
  const [heartShake, setHeartShake] = useState(false);

  const handleSpeak = (text: string, lang = "es-ES") => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      window.speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    fetchLesson(skillId)
      .then((data) => {
        if (data.exercises.length === 0) {
          setError("This lesson has no exercises.");
        } else {
          setExercises(data.exercises);
          setInitialCount(data.exercises.length);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load lesson", err);
        if (err.message === "heart_empty") {
          setOutOfHearts(true);
        } else {
          setError("Failed to start lesson. Make sure you have active hearts!");
        }
        setLoading(false);
      });
  }, [skillId]);

  const currentExercise = exercises[currentIndex];

  // Initialize match pairs shuffling when loading a match pairs exercise
  useEffect(() => {
    if (currentExercise && currentExercise.exercise_type === "match_pairs") {
      const pairs = currentExercise.data.pairs as [string, string][];
      const left = pairs.map((p) => p[0]).sort(() => Math.random() - 0.5);
      const right = pairs.map((p) => p[1]).sort(() => Math.random() - 0.5);
      setLeftWords(left);
      setRightWords(right);
      setSelectedLeft(null);
      setSelectedRight(null);
      setMatchedPairs([]);
      setWrongMatch(null);
    }
  }, [currentExercise, currentIndex]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white gap-4">
        <RefreshCw className="w-12 h-12 text-[#58CC02] animate-spin" />
        <p className="text-zinc-500 font-extrabold">Preparing your lesson...</p>
      </div>
    );
  }

  if (outOfHearts) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white p-6 text-center max-w-md mx-auto">
        <Heart className="w-20 h-20 text-red-500 fill-current animate-bounce mb-6" />
        <h2 className="text-3xl font-black text-zinc-700 mb-2">No Hearts Left!</h2>
        <p className="text-zinc-500 font-bold mb-8">
          You lost all your hearts. Refill them in the shop or practice past lessons to continue.
        </p>
        <div className="flex flex-col gap-3 w-full">
          <Button variant="primary" className="w-full py-4 text-base" onClick={async () => {
            setLoading(true);
            try {
              await store.refillHeartsOptimistic();
              setOutOfHearts(false);
              // reload page or fetch lesson
              window.location.reload();
            } catch (err) {
              console.error(err);
            }
            setLoading(false);
          }}>
            Refill to Full (100 Gems)
          </Button>
          <Button variant="ghost" className="w-full py-4 text-base text-zinc-500" onClick={() => router.push("/learn")}>
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white p-6 text-center max-w-md mx-auto">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-extrabold text-zinc-800 mb-2">Error</h2>
        <p className="text-zinc-500 font-semibold mb-6">{error}</p>
        <Button variant="primary" onClick={() => router.push("/learn")}>
          Back to Path
        </Button>
      </div>
    );
  }

  if (lessonComplete && completionSummary) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white p-6 select-none max-w-lg mx-auto">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }} 
          className="text-center flex flex-col items-center"
        >
          <Trophy className="w-24 h-24 text-yellow-500 fill-yellow-100 mb-6" />
          <h1 className="text-3xl font-black text-[#58CC02] tracking-wider mb-2">Lesson Complete!</h1>
          <p className="text-zinc-500 font-bold mb-8">Excellent work! You are one step closer to mastering Spanish.</p>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-4 w-full mb-8">
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-4 text-center">
              <Zap className="w-6 h-6 text-yellow-500 mx-auto mb-1 fill-current" />
              <span className="block text-xs font-extrabold text-yellow-600 uppercase">XP Earned</span>
              <span className="text-xl font-black text-yellow-700">+{completionSummary.xp_earned}</span>
            </div>
            
            <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-4 text-center">
              <Flame className="w-6 h-6 text-orange-500 mx-auto mb-1 fill-current" />
              <span className="block text-xs font-extrabold text-orange-600 uppercase">Streak</span>
              <span className="text-xl font-black text-orange-700">{completionSummary.new_streak} days</span>
            </div>

            <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 text-center">
              <Clock className="w-6 h-6 text-blue-500 mx-auto mb-1" />
              <span className="block text-xs font-extrabold text-blue-600 uppercase">Mistakes</span>
              <span className="text-xl font-black text-blue-700">{completionSummary.mistakes_count}</span>
            </div>
          </div>

          {/* New Achievements popup */}
          {completionSummary.new_achievements.length > 0 && (
            <div className="w-full bg-[#E5F6DF] border-2 border-[#58CC02] rounded-2xl p-4 mb-8 text-left">
              <h3 className="font-extrabold text-[#388501] mb-2">🏆 Achievement Unlocked!</h3>
              {completionSummary.new_achievements.map((ach) => (
                <div key={ach.id} className="flex items-center gap-3">
                  <span className="text-2xl">{ach.icon}</span>
                  <div>
                    <h4 className="font-bold text-zinc-700">{ach.title}</h4>
                    <p className="text-xs text-zinc-500">{ach.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Button variant="primary" className="w-full py-4 text-base shadow-lg" onClick={() => router.push("/learn")}>
            CONTINUE
          </Button>
        </motion.div>
      </div>
    );
  }

  // Answer Submission Handler
  const handleCheck = async () => {
    if (checked) {
      // Continue to next exercise
      setSelectedOption(null);
      setTypedAnswer("");
      setSelectedWords([]);
      setChecked(false);
      setCorrectAnswerDetail(null);

      if (currentIndex + 1 >= exercises.length) {
        // Complete Lesson
        setLoading(true);
        try {
          const summary = await completeLesson(currentExercise.lesson_id, mistakesCount, exercises.length);
          setCompletionSummary(summary);
          setLessonComplete(true);
          
          // Trigger confetti
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          });
        } catch (err) {
          console.error("Failed to complete lesson", err);
          setError("Failed to finalize lesson progress.");
        }
        setLoading(false);
      } else {
        setCurrentIndex((prev) => prev + 1);
      }
      return;
    }

    // Prepare answer payload based on type
    let answerPayload: any = null;
    if (currentExercise.exercise_type === "multiple_choice") {
      if (selectedOption === null) return;
      const index = currentExercise.data.options.indexOf(selectedOption);
      answerPayload = { index };
    } else if (currentExercise.exercise_type === "translate" || currentExercise.exercise_type === "type_answer") {
      if (!typedAnswer.trim()) return;
      answerPayload = { text: typedAnswer };
    } else if (currentExercise.exercise_type === "fill_blank") {
      if (selectedOption === null) return;
      answerPayload = { answer: selectedOption };
    } else if (currentExercise.exercise_type === "word_bank") {
      if (selectedWords.length === 0) return;
      answerPayload = { sequence: selectedWords };
    } else if (currentExercise.exercise_type === "match_pairs") {
      // For match pairs, we must have matched all pairs client-side to submit
      if (matchedPairs.length !== currentExercise.data.pairs.length) return;
      answerPayload = { pairs: matchedPairs };
    }

    setSubmitting(true);
    try {
      const res = await submitAnswer(currentExercise.id, answerPayload);
      setIsCorrect(res.correct);
      store.setProgress({ hearts: res.hearts_remaining });

      if (res.correct) {
        setCompletedCount((prev) => prev + 1);
      } else {
        setCorrectAnswerDetail(res.correct_answer);
        setMistakesCount((prev) => prev + 1);
        
        // Trigger heart shake animation
        setHeartShake(true);
        setTimeout(() => setHeartShake(false), 500);

        if (res.hearts_remaining <= 0) {
          // Trigger out of hearts modal after current check bar is dismissed
          setTimeout(() => setOutOfHearts(true), 1500);
        }

        // Re-queue the wrong answer at the end of the list
        setExercises((prev) => [...prev, currentExercise]);
      }
      setChecked(true);
    } catch (err: any) {
      console.error(err);
      if (err.message === "heart_empty") {
        setOutOfHearts(true);
      }
    }
    setSubmitting(false);
  };

  // Determine if check button should be active
  let isAnswerGiven = false;
  if (currentExercise.exercise_type === "multiple_choice") {
    isAnswerGiven = selectedOption !== null;
  } else if (currentExercise.exercise_type === "translate" || currentExercise.exercise_type === "type_answer") {
    isAnswerGiven = typedAnswer.trim().length > 0;
  } else if (currentExercise.exercise_type === "fill_blank") {
    isAnswerGiven = selectedOption !== null;
  } else if (currentExercise.exercise_type === "word_bank") {
    isAnswerGiven = selectedWords.length > 0;
  } else if (currentExercise.exercise_type === "match_pairs") {
    isAnswerGiven = matchedPairs.length === currentExercise.data.pairs.length;
  }

  // Word Bank Helper
  const handleWordBankToggle = (word: string) => {
    if (checked) return;
    if (selectedWords.includes(word)) {
      setSelectedWords((prev) => prev.filter((w) => w !== word));
    } else {
      setSelectedWords((prev) => [...prev, word]);
    }
  };

  // Match Pairs Helper
  const handleMatchClick = (word: string, column: "left" | "right") => {
    if (checked) return;

    if (column === "left") {
      // Check if already matched
      if (matchedPairs.some((p) => p[0] === word)) return;
      setSelectedLeft(word === selectedLeft ? null : word);
    } else {
      if (matchedPairs.some((p) => p[1] === word)) return;
      setSelectedRight(word === selectedRight ? null : word);
    }
  };

  // Check matched pair when selectedLeft and selectedRight both exist
  if (selectedLeft && selectedRight) {
    const pair = currentExercise.data.pairs.find(
      (p: [string, string]) => p[0] === selectedLeft && p[1] === selectedRight
    );
    if (pair) {
      // Valid match
      setMatchedPairs((prev) => [...prev, [selectedLeft, selectedRight]]);
      setSelectedLeft(null);
      setSelectedRight(null);
    } else {
      // Invalid match
      const failedLeft = selectedLeft;
      const failedRight = selectedRight;
      setWrongMatch([failedLeft, failedRight]);
      setSelectedLeft(null);
      setSelectedRight(null);
      setTimeout(() => setWrongMatch(null), 1000);
    }
  }

  const progressPct = Math.min(100, (completedCount / initialCount) * 100);

  return (
    <div className="flex flex-col min-h-screen bg-white select-none">
      {/* 1. Header Bar */}
      <header className="max-w-4xl mx-auto w-full px-6 py-6 flex items-center justify-between gap-4">
        {/* Close Button */}
        <button 
          onClick={() => {
            if (confirm("Are you sure you want to quit? You will lose all progress for this lesson.")) {
              router.push("/learn");
            }
          }}
          className="text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Progress Bar */}
        <div className="flex-1 h-4 bg-zinc-100 rounded-full overflow-hidden border border-zinc-200">
          <div 
            style={{ width: `${progressPct}%` }}
            className="h-full bg-[#58CC02] rounded-full transition-all duration-300"
          />
        </div>

        {/* Hearts indicator */}
        <motion.div 
          animate={heartShake ? { x: [0, -10, 10, -10, 10, 0] } : {}}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-1.5 text-red-500 font-extrabold"
        >
          <Heart className="w-6 h-6 fill-current animate-pulse" />
          <span>{store.hearts}</span>
        </motion.div>
      </header>

      {/* 2. Main Content Player */}
      <main className="flex-grow max-w-2xl mx-auto w-full px-6 py-8 flex flex-col justify-center">
        {/* Exercise Prompt */}
        <h2 className="text-2xl sm:text-3xl font-black text-zinc-700 mb-8 leading-snug">
          {currentExercise.prompt}
        </h2>

        {/* Dynamic Exercise Rendering */}
        <div className="flex-grow flex flex-col justify-center">
          {/* Multiple Choice */}
          {currentExercise.exercise_type === "multiple_choice" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {currentExercise.data.options.map((option: string, index: number) => {
                const isSelected = selectedOption === option;
                return (
                  <button
                    key={option}
                    disabled={checked}
                    onClick={() => setSelectedOption(option)}
                    className={`p-4 sm:p-5 rounded-2xl border-2 border-b-4 text-left font-extrabold text-lg transition-all flex items-center justify-between cursor-pointer select-none ${
                      isSelected
                        ? "bg-[#DDF4FF] border-[#1899D6] text-[#1899D6] border-b-[#1899D6]"
                        : "bg-white border-zinc-200 hover:bg-zinc-50 border-b-zinc-300 text-zinc-700"
                    }`}
                  >
                    <span>{option}</span>
                    <span className="text-xs text-zinc-400 font-bold border border-zinc-300 rounded px-1.5 py-0.5 uppercase">
                      {index + 1}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Translate / Type Answer */}
          {(currentExercise.exercise_type === "translate" || currentExercise.exercise_type === "type_answer") && (
            <div className="flex flex-col gap-4">
              <div className="p-5 rounded-2xl bg-zinc-50 border-2 border-zinc-200 flex items-start gap-4">
                <Volume2 
                  className="w-6 h-6 text-[#1899D6] cursor-pointer mt-1 hover:scale-110 transition-transform flex-shrink-0" 
                  onClick={() => handleSpeak(currentExercise.data.source_text)}
                />
                <p className="text-xl font-bold text-zinc-700">{currentExercise.data.source_text}</p>
              </div>
              <textarea
                disabled={checked}
                value={typedAnswer}
                onChange={(e) => setTypedAnswer(e.target.value)}
                placeholder="Type the translation in Spanish..."
                className="w-full h-32 p-4 rounded-2xl border-2 border-b-4 border-zinc-200 focus:border-[#1899D6] focus:border-b-[#1899D6] outline-none text-lg font-bold text-zinc-700 resize-none"
              />
            </div>
          )}

          {/* Word Bank */}
          {currentExercise.exercise_type === "word_bank" && (
            <div className="flex flex-col gap-8">
              {/* Target shelf */}
              <div className="p-4 min-h-16 border-b-2 border-zinc-300 flex flex-wrap gap-2 items-center bg-zinc-50 rounded-2xl">
                {selectedWords.map((word) => (
                  <button
                    key={word}
                    disabled={checked}
                    onClick={() => handleWordBankToggle(word)}
                    className="px-4 py-2 bg-white border-2 border-b-4 border-zinc-200 text-zinc-700 font-bold rounded-xl cursor-pointer"
                  >
                    {word}
                  </button>
                ))}
              </div>

              {/* Tray */}
              <div className="flex flex-wrap gap-2 justify-center">
                {currentExercise.data.word_bank.map((word: string) => {
                  const isSelected = selectedWords.includes(word);
                  return (
                    <button
                      key={word}
                      disabled={checked || isSelected}
                      onClick={() => handleWordBankToggle(word)}
                      className={`px-4 py-2 font-bold rounded-xl border-2 border-b-4 transition-all select-none ${
                        isSelected
                          ? "bg-zinc-100 border-zinc-200 text-zinc-300 border-b-2 translate-y-0.5 cursor-not-allowed shadow-none"
                          : "bg-white border-zinc-200 hover:bg-zinc-50 text-zinc-700 cursor-pointer shadow-sm"
                      }`}
                    >
                      {word}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Match Pairs */}
          {currentExercise.exercise_type === "match_pairs" && (
            <div className="grid grid-cols-2 gap-8 w-full max-w-md mx-auto">
              {/* Left Column (Spanish) */}
              <div className="flex flex-col gap-3">
                {leftWords.map((word) => {
                  const isMatched = matchedPairs.some((p) => p[0] === word);
                  const isSelected = selectedLeft === word;
                  const isFailed = wrongMatch && wrongMatch[0] === word;

                  return (
                    <button
                      key={word}
                      disabled={checked || isMatched}
                      onClick={() => handleMatchClick(word, "left")}
                      className={`p-3 text-center font-bold border-2 border-b-4 rounded-2xl transition-all cursor-pointer ${
                        isMatched
                          ? "bg-[#DDF4FF]/40 border-zinc-200 text-zinc-300 border-b-2 cursor-not-allowed"
                          : isFailed
                          ? "bg-red-50 border-red-500 text-red-500 border-b-red-500"
                          : isSelected
                          ? "bg-[#DDF4FF] border-[#1899D6] text-[#1899D6] border-b-[#1899D6]"
                          : "bg-white border-zinc-200 hover:bg-zinc-50 text-zinc-700"
                      }`}
                    >
                      {word}
                    </button>
                  );
                })}
              </div>

              {/* Right Column (English) */}
              <div className="flex flex-col gap-3">
                {rightWords.map((word) => {
                  const isMatched = matchedPairs.some((p) => p[1] === word);
                  const isSelected = selectedRight === word;
                  const isFailed = wrongMatch && wrongMatch[1] === word;

                  return (
                    <button
                      key={word}
                      disabled={checked || isMatched}
                      onClick={() => handleMatchClick(word, "right")}
                      className={`p-3 text-center font-bold border-2 border-b-4 rounded-2xl transition-all cursor-pointer ${
                        isMatched
                          ? "bg-[#DDF4FF]/40 border-zinc-200 text-zinc-300 border-b-2 cursor-not-allowed"
                          : isFailed
                          ? "bg-red-50 border-red-500 text-red-500 border-b-red-500"
                          : isSelected
                          ? "bg-[#DDF4FF] border-[#1899D6] text-[#1899D6] border-b-[#1899D6]"
                          : "bg-white border-zinc-200 hover:bg-zinc-50 text-zinc-700"
                      }`}
                    >
                      {word}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Fill Blank */}
          {currentExercise.exercise_type === "fill_blank" && (
            <div className="flex flex-col gap-8 items-center">
              {/* The Sentence with Blank */}
              <div className="flex items-center flex-wrap gap-2 text-xl font-extrabold text-zinc-700 bg-zinc-50 p-6 rounded-2xl border border-zinc-200">
                <span>{currentExercise.data.sentence_parts[0]}</span>
                <span className="px-4 py-1.5 border-2 border-dashed border-zinc-300 bg-white rounded-xl text-[#1899D6] min-w-20 text-center font-black">
                  {selectedOption || "______"}
                </span>
                <span>{currentExercise.data.sentence_parts[2]}</span>
              </div>

              {/* Options */}
              <div className="flex gap-3 mt-6">
                {currentExercise.data.options.map((option: string) => {
                  const isSelected = selectedOption === option;
                  return (
                    <button
                      key={option}
                      disabled={checked}
                      onClick={() => setSelectedOption(option)}
                      className={`px-6 py-3 font-bold rounded-xl border-2 border-b-4 transition-all cursor-pointer ${
                        isSelected
                          ? "bg-[#DDF4FF] border-[#1899D6] text-[#1899D6] border-b-[#1899D6]"
                          : "bg-white border-zinc-200 hover:bg-zinc-50 text-zinc-700"
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* 3. Sliding Bottom Feedback Bar */}
      <AnimatePresence>
        <motion.div 
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          className={`border-t-2 py-6 px-8 flex items-center justify-between gap-6 fixed bottom-0 left-0 right-0 z-40 transition-colors ${
            !checked
              ? "bg-white border-zinc-200"
              : isCorrect
              ? "bg-[#DDF4FF] border-[#84d8ff]" // light blue/green correct bg
              : "bg-red-50 border-red-200"
          }`}
        >
          <div className="max-w-4xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Mascot reaction & message */}
            <div className="flex items-center gap-4">
              {checked && (
                isCorrect ? (
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                ) : (
                  <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-white">
                    <AlertCircle className="w-8 h-8" />
                  </div>
                )
              )}
              
              <div className="text-center sm:text-left select-text">
                {!checked ? (
                  <p className="text-zinc-400 font-bold text-sm hidden sm:block">Select an answer to check</p>
                ) : isCorrect ? (
                  <div>
                    <h3 className="font-extrabold text-[#1899D6] text-lg">You are correct!</h3>
                    <p className="text-xs text-zinc-500 font-bold">Excellent job!</p>
                  </div>
                ) : (
                  <div>
                    <h3 className="font-extrabold text-red-500 text-lg">Correct solution:</h3>
                    <p className="text-sm text-red-700 font-black">
                      {correctAnswerDetail?.answer || 
                       correctAnswerDetail?.accepted?.[0] || 
                       correctAnswerDetail?.sequence?.join(" ") ||
                       "Incorrect pair matching"}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Action button */}
            <Button
              variant={
                !checked
                  ? isAnswerGiven ? "primary" : "locked"
                  : isCorrect ? "primary" : "danger"
              }
              disabled={!isAnswerGiven && !checked || submitting}
              onClick={handleCheck}
              className="py-3 px-12 text-base w-full sm:w-auto shadow-md"
            >
              {submitting ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : !checked ? (
                "CHECK"
              ) : (
                "CONTINUE"
              )}
            </Button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
