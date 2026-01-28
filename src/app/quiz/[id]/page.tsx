'use client';

import React, { useState, useEffect, use } from 'react';
import { createClient } from '@/utils/supabase/client'; // Updated import
import { useRouter } from 'next/navigation';
import { ChevronRight, ChevronLeft, RotateCcw, Award, Home, Eye, CheckCircle, Loader2 } from 'lucide-react';

interface Question {
  id: string;
  question_text: string;
  options: string[];
  correct_answer: string;
}

export default function QuizPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const supabase = createClient(); // Initialize client
  
  const [masterQuestions, setMasterQuestions] = useState<Question[]>([]); 
  const [questions, setQuestions] = useState<Question[]>([]); 
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [isFinished, setIsFinished] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [loading, setLoading] = useState(true); // Added loading state

  const shuffleArray = (array: any[]) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  useEffect(() => {
    async function fetchQuestions() {
      setLoading(true);
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('quiz_id', id);

      if (error) {
        console.error("Supabase Error:", error);
      }

      if (data && data.length > 0) {
        setMasterQuestions(data);
        setQuestions(shuffleArray(data)); 
      }
      setLoading(false);
    }
    fetchQuestions();
  }, [id, supabase]);

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsReviewing(true); 
    }
  };

  const resetQuiz = () => {
    setUserAnswers({});
    setCurrentIndex(0);
    setIsFinished(false);
    setIsReviewing(false);
    setQuestions(shuffleArray(masterQuestions)); 
    window.scrollTo(0, 0);
  };

  const calculateFinalScore = () => {
    let total = 0;
    questions.forEach((q, index) => {
      if (userAnswers[index] === q.correct_answer) total++;
    });
    return total;
  };

  // Improved Loading State
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
        <p className="text-slate-500 font-bold animate-pulse">Fetching your questions...</p>
      </div>
    );
  }

  // Handle case where ID is valid but no questions exist in DB
  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <h2 className="text-2xl font-bold mb-2">No questions found</h2>
        <p className="text-slate-500 mb-6">This quiz might be empty or was deleted.</p>
        <button onClick={() => router.push('/generator')} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold">
          Go to Generator
        </button>
      </div>
    );
  }

  // --- SCREEN A: FINAL RESULTS ---
  if (isFinished) {
    const finalScore = calculateFinalScore();
    const percentage = Math.round((finalScore / questions.length) * 100);

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white p-10 rounded-3xl shadow-2xl text-center border-t-8 border-blue-600">
          <Award className="mx-auto text-yellow-500 mb-4" size={80} />
          <h2 className="text-3xl font-bold mb-2">Quiz Results</h2>
          <div className="text-6xl font-black text-blue-600 my-6">{finalScore} / {questions.length}</div>
          <p className="text-lg text-gray-500 mb-8 font-medium italic">"{percentage >= 70 ? 'Excellent work!' : 'Keep practicing!'}"</p>
          
          <div className="flex flex-col space-y-3">
            <button 
              onClick={resetQuiz} 
              className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold flex items-center justify-center space-x-2 hover:bg-blue-700 transition shadow-lg"
            >
              <RotateCcw size={20} /> <span>Retake (New Order)</span>
            </button>
            <button 
              onClick={() => router.push('/generator')} 
              className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold flex items-center justify-center space-x-2 hover:bg-black transition shadow-lg"
            >
              <Home size={20} /> <span>Create New Quiz</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- SCREEN B: REVIEW SUMMARY ---
  if (isReviewing) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4">
        <div className="max-w-3xl mx-auto bg-white p-8 md:p-12 rounded-3xl shadow-xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-slate-800">Review Summary</h2>
            <p className="text-slate-500">Tap a question to change your answer</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
            {questions.map((_, idx) => (
              <button
                key={idx}
                onClick={() => { setCurrentIndex(idx); setIsReviewing(false); }}
                className={`p-4 rounded-2xl border-2 flex flex-col items-center transition-all ${
                  userAnswers[idx] ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-amber-200 bg-amber-50 text-amber-700'
                }`}
              >
                <span className="text-xs font-bold uppercase mb-1">Q{idx + 1}</span>
                <span className="text-sm font-bold">{userAnswers[idx] ? "Answered" : "Empty"}</span>
              </button>
            ))}
          </div>

          <div className="flex flex-col space-y-4">
            <button onClick={() => setIsReviewing(false)} className="w-full bg-slate-100 text-slate-700 py-5 rounded-2xl font-bold hover:bg-slate-200">
              Back to Questions
            </button>
            <button onClick={() => setIsFinished(true)} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-bold flex items-center justify-center space-x-2 hover:bg-black transition shadow-xl shadow-slate-200">
              <CheckCircle size={20} /> <span>Submit Final Exam</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- SCREEN C: QUESTION VIEW ---
  const q = questions[currentIndex];
  const currentSelection = userAnswers[currentIndex] || null;

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white p-8 md:p-12 rounded-3xl shadow-xl">
        <div className="flex justify-between items-center mb-10">
          <span className="text-xs font-black text-blue-600 uppercase tracking-widest">Question {currentIndex + 1} of {questions.length}</span>
          <button onClick={() => setIsReviewing(true)} className="text-xs font-bold text-slate-400 flex items-center space-x-1 hover:text-blue-600 transition">
            <Eye size={14} /> <span>Review List</span>
          </button>
        </div>

        <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-10 leading-tight">{q.question_text}</h2>

        <div className="space-y-4">
          {q.options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => setUserAnswers({ ...userAnswers, [currentIndex]: option })}
              className={`w-full text-left p-6 rounded-2xl border-2 transition-all ${
                currentSelection === option ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-md' : 'border-slate-100 hover:border-blue-200'
              }`}
            >
              <div className="flex items-center space-x-4">
                <span className={`w-10 h-10 rounded-full flex items-center justify-center border-2 font-bold ${
                  currentSelection === option ? 'bg-blue-600 text-white border-blue-600' : 'text-slate-400 border-slate-200'
                }`}>
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="text-lg font-medium">{option}</span>
              </div>
            </button>
          ))}
        </div>

        <div className="flex space-x-4 mt-12">
          {currentIndex > 0 && (
            <button onClick={() => setCurrentIndex(prev => prev - 1)} className="flex-1 bg-slate-50 text-slate-600 py-5 rounded-2xl font-bold flex items-center justify-center space-x-2 border border-slate-100 hover:bg-slate-100 transition">
              <ChevronLeft size={22} /> <span>Back</span>
            </button>
          )}
          <button
            onClick={handleNext}
            className={`flex-[2] py-5 rounded-2xl font-bold flex items-center justify-center space-x-2 transition shadow-lg ${
              !currentSelection ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-black'
            }`}
          >
            <span>{currentIndex === questions.length - 1 ? "Review All" : "Next Question"}</span>
            <ChevronRight size={22} />
          </button>
        </div>
      </div>
    </div>
  );
}