'use client';

import React from 'react';
import { 
  Trophy, 
  Target, 
  RotateCcw, 
  LayoutDashboard, 
  CheckCircle2, 
  XCircle 
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ScoreProps {
  score: number;
  totalQuestions: number;
  onReset: () => void;
}

export default function ScoreSummary({ score, totalQuestions, onReset }: ScoreProps) {
  const router = useRouter();
  const percentage = Math.round((score / totalQuestions) * 100);
  
  // Dynamic feedback based on score
  const getFeedback = () => {
    if (percentage === 100) return { msg: "Perfect Score!", color: "text-yellow-500", icon: <Trophy size={48} /> };
    if (percentage >= 70) return { msg: "Great Job!", color: "text-green-500", icon: <Target size={48} /> };
    if (percentage >= 50) return { msg: "Keep Practicing!", color: "text-blue-500", icon: <CheckCircle2 size={48} /> };
    return { msg: "Keep Pushing!", color: "text-orange-500", icon: <XCircle size={48} /> };
  };

  const feedback = getFeedback();

  return (
    <div className="max-w-2xl mx-auto py-10 px-6">
      <div className="bg-white rounded-[40px] shadow-2xl shadow-blue-100 p-8 md:p-12 text-center border border-slate-50">
        
        {/* Animated Icon Section */}
        <div className={`flex justify-center mb-6 ${feedback.color} animate-bounce`}>
          {feedback.icon}
        </div>

        <h1 className="text-4xl font-black text-slate-900 mb-2">{feedback.msg}</h1>
        <p className="text-slate-400 font-medium mb-10">You've completed this study session.</p>

        {/* Score Circle */}
        <div className="relative w-48 h-48 mx-auto mb-12">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="96"
              cy="96"
              r="88"
              stroke="currentColor"
              strokeWidth="12"
              fill="transparent"
              className="text-slate-100"
            />
            <circle
              cx="96"
              cy="96"
              r="88"
              stroke="currentColor"
              strokeWidth="12"
              fill="transparent"
              strokeDasharray={553}
              strokeDashoffset={553 - (553 * percentage) / 100}
              strokeLinecap="round"
              className={`${feedback.color} transition-all duration-1000 ease-out`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl font-black text-slate-900">{percentage}%</span>
            <span className="text-slate-400 font-bold text-sm uppercase tracking-tighter">
              {score} / {totalQuestions}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={onReset}
            className="flex items-center justify-center space-x-3 bg-slate-100 text-slate-700 py-4 rounded-2xl font-black hover:bg-slate-200 transition-all"
          >
            <RotateCcw size={20} />
            <span>Try Again</span>
          </button>
          
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center justify-center space-x-3 bg-blue-600 text-white py-4 rounded-2xl font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
          >
            <LayoutDashboard size={20} />
            <span>Go to Library</span>
          </button>
        </div>
      </div>
    </div>
  );
}