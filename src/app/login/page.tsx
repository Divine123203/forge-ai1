'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { BookOpen, Loader2, Mail, Lock, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage("Check your email for the confirmation link!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push('/'); // Redirect to dashboard after login
      }
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) return alert("Please enter your email first.");
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) alert(error.message);
    else alert("Password reset link sent to your email!");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-blue-600 p-3 rounded-2xl shadow-lg">
            <BookOpen className="text-white" size={32} />
          </div>
        </div>
        <h2 className="text-3xl font-black text-slate-900">
          {isSignUp ? "Create Account" : "Welcome Back"}
        </h2>
        <p className="mt-2 text-slate-500 font-medium">
          {isSignUp ? "Start generating your private quizzes" : "Login to access your study history"}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-8 shadow-xl rounded-3xl border border-slate-100">
          <form className="space-y-6" onSubmit={handleAuth}>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-slate-400" size={20} />
                <input
                  type="email"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-slate-50 rounded-xl focus:border-blue-500 transition-all outline-none"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-slate-400" size={20} />
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-slate-50 rounded-xl focus:border-blue-500 transition-all outline-none"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {!isSignUp && (
              <div className="flex justify-end">
                <button 
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-lg hover:bg-black flex items-center justify-center space-x-2 transition-all transform active:scale-95 shadow-lg"
            >
              {loading ? <Loader2 className="animate-spin" /> : (
                <>
                  <span>{isSignUp ? "Sign Up" : "Sign In"}</span>
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          {message && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-100 text-blue-700 text-sm rounded-xl text-center font-medium">
              {message}
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm font-bold text-slate-500 hover:text-slate-800 transition"
            >
              {isSignUp ? "Already have an account? Log in" : "New user? Create an account"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}