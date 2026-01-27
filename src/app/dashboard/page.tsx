'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation'; 
import Link from 'next/link'; 
import { 
  BookOpen, 
  Calendar, 
  ChevronRight, 
  MessageSquareText, 
  Search, 
  Trash2, 
  Loader2, 
  ArrowLeft,
  PlusCircle,
  LogOut
} from 'lucide-react';

interface QuizHistory {
  id: string;
  summary: string;
  created_at: string;
  notes: {
    title: string;
  };
}

export default function HistoryDashboard() {
  const [history, setHistory] = useState<QuizHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchHistory();
  }, []);

  async function fetchHistory() {
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select(`
          id,
          summary,
          created_at,
          notes ( title )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHistory(data as any);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation(); 
    
    const confirmed = window.confirm("Delete this quiz forever?");
    if (!confirmed) return;

    setDeletingId(id);
    try {
      const { error } = await supabase.from('quizzes').delete().eq('id', id);
      if (error) throw error;
      setHistory(prev => prev.filter(quiz => quiz.id !== id));
    } catch (err) {
      alert("Failed to delete.");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredHistory = history.filter(item => 
    item.notes?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.summary?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center font-sans text-slate-500">
        <Loader2 className="animate-spin mb-4 text-blue-600" size={40} /> 
        <span className="font-black text-lg tracking-tight">Accessing Library...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 md:px-12 text-slate-900 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Navigation Bar */}
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center space-x-6">
            <Link 
              href="/" 
              className="flex items-center space-x-2 text-slate-500 hover:text-blue-600 font-bold transition-all group"
            >
              <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
              <span>Back</span>
            </Link>
            
            <button 
              onClick={handleLogout}
              className="flex items-center space-x-2 text-slate-400 hover:text-red-500 font-bold transition-all text-sm"
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>

          <Link 
            href="/" 
            className="bg-blue-600 text-white px-5 py-2.5 rounded-2xl font-black flex items-center space-x-2 hover:bg-blue-700 transition shadow-lg shadow-blue-100"
          >
            <PlusCircle size={18} />
            <span>New Quiz</span>
          </Link>
        </div>

        {/* Title and Search */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div>
            <h1 className="text-5xl font-black tracking-tighter text-slate-900">Your Library</h1>
            <p className="text-slate-500 font-medium mt-2 text-lg">Revisit and manage your study sessions.</p>
          </div>
          
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text"
              placeholder="Search topics or summaries..."
              className="pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl w-full outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 shadow-sm transition-all"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* History Cards Grid */}
        {filteredHistory.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredHistory.map((quiz) => (
              <Link 
                key={quiz.id} 
                href={`/quiz/${quiz.id}`}
                className="group bg-white p-7 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all block relative"
              >
                <div className="flex justify-between items-start mb-5">
                  <div className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full flex items-center space-x-2">
                    <Calendar size={12} />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      {new Date(quiz.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>

                  <button 
                    onClick={(e) => handleDelete(e, quiz.id)}
                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all relative z-50"
                  >
                    {deletingId === quiz.id ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Trash2 size={18} />
                    )}
                  </button>
                </div>

                <h3 className="text-2xl font-extrabold mb-3 text-slate-800 line-clamp-2 group-hover:text-blue-600 transition-colors leading-tight">
                  {quiz.notes?.title || "Untitled Session"}
                </h3>

                <p className="text-slate-400 text-sm leading-relaxed line-clamp-3 mb-8 font-medium">
                  {quiz.summary || "No summary available for this practice session."}
                </p>

                <div className="mt-auto flex items-center justify-between pt-5 border-t border-slate-50">
                  <div className="flex items-center space-x-2 text-slate-400">
                    <BookOpen size={16} />
                    <span className="text-xs font-black uppercase tracking-widest">Practice Mode</span>
                  </div>
                  <div className="bg-slate-900 text-white p-2.5 rounded-2xl group-hover:bg-blue-600 transition-colors shadow-lg">
                    <ChevronRight size={20} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-white rounded-[40px] border-2 border-dashed border-slate-200 shadow-inner">
             <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="text-slate-300" size={32} />
             </div>
             <p className="text-slate-400 font-black text-xl mb-2">No quizzes found.</p>
             <p className="text-slate-400 font-medium mb-8">Try a different search or create something new.</p>
             <Link 
               href="/" 
               className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black hover:bg-blue-600 transition-all uppercase tracking-widest text-sm"
             >
                Start a new session
             </Link>
          </div>
        )}
      </div>
    </div>
  );
}