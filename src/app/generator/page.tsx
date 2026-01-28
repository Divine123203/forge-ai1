'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Tesseract from 'tesseract.js';
import { 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  Loader2, 
  BookOpen, 
  Settings2, 
  RotateCcw,
  Sparkles
} from 'lucide-react';

export default function GeneratorPage() {
  const router = useRouter();
  
  const [inputText, setInputText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [questionCount, setQuestionCount] = useState(10);

  const extractPdfText = async (file: File) => {
    const pdfjs = await import('pdfjs-dist');
    pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      fullText += textContent.items.map((s: any) => (s as any).str).join(' ') + '\n';
    }
    return fullText;
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      let finalContent = inputText;
      
      // Handle OCR and PDF extraction
      if (file) {
        if (file.type === "application/pdf") {
          setScanning(true);
          finalContent = await extractPdfText(file);
          setScanning(false);
        } else if (file.type.startsWith("image/")) {
          setScanning(true);
          const { data: { text } } = await Tesseract.recognize(file, 'eng', {
            corePath: 'https://unpkg.com/tesseract.js-core@v5.0.0/tesseract-core.wasm.js',
            logger: m => console.log(m)
          });
          finalContent = text;
          setScanning(false);
        }
      }

      if (!finalContent || finalContent.trim().length < 10) {
        alert("The content is too short to generate a quiz!");
        setLoading(false);
        return;
      }

      console.log("🚀 Sending request to API...");

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: finalContent,
          count: questionCount,
          title: file ? file.name : "New Study Session"
        })
      });

      const result = await res.json();
      console.log("📩 API Response received:", result);

      if (res.ok && result.success && result.quizId) {
        console.log("✅ Success! Redirecting to quiz:", result.quizId);
        
        // Navigation Strategy: Try router first, fallback to window.location
        const destination = `/quiz/${result.quizId}`;
        router.push(destination);
        
        // Fallback for slow router instances
        setTimeout(() => {
          if (window.location.pathname !== destination) {
            window.location.href = destination;
          }
        }, 1500);

      } else {
        setLoading(false);
        if (res.status === 401) {
          alert("Your session has expired. Redirecting to login...");
          router.push('/login');
        } else {
          alert("Error: " + (result.error || "The server didn't return a quiz ID. Check your database tables."));
        }
      }
    } catch (err) {
      console.error("Frontend Error:", err);
      alert("Something went wrong during generation! Check the console.");
      setLoading(false);
      setScanning(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 py-12 px-4 selection:bg-blue-100">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center space-x-4">
            <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-100">
              <Sparkles className="text-white" size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900">Generator</h1>
              <p className="text-slate-500 font-medium text-sm">Create your AI study session</p>
            </div>
          </div>

          <button 
            onClick={() => router.push('/library')}
            className="flex items-center space-x-2 px-4 py-2 bg-white rounded-xl border border-slate-200 text-slate-600 font-bold hover:text-blue-600 hover:border-blue-100 transition shadow-sm"
          >
            <RotateCcw size={18} />
            <span className="hidden sm:inline">Library</span>
          </button>
        </div>

        {/* Inputs Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 font-mono">Input Text</label>
            <textarea 
              className="w-full h-64 p-5 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-blue-500 focus:bg-white transition-all outline-none resize-none text-slate-800 leading-relaxed font-medium"
              placeholder="Paste your study material here..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={!!file}
            />
          </div>

          <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 flex flex-col">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 font-mono">Upload Source</label>
            <div className={`relative flex-1 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center transition-all ${file ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-slate-50'}`}>
              <input 
                type="file" 
                accept="application/pdf,image/*" 
                className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              {file ? (
                <div className="text-center p-4">
                  <div className="bg-blue-600 p-4 rounded-2xl text-white mx-auto w-fit mb-3 shadow-lg shadow-blue-200">
                    {file.type === 'application/pdf' ? <FileText size={32} /> : <ImageIcon size={32} />}
                  </div>
                  <p className="font-bold text-slate-800 text-sm truncate max-w-[180px]">{file.name}</p>
                  <button onClick={() => setFile(null)} className="text-xs text-red-500 font-bold mt-2 hover:underline relative z-20">Change File</button>
                </div>
              ) : (
                <>
                  <div className="bg-white p-4 rounded-2xl shadow-sm mb-3">
                    <Upload className="text-blue-500" size={32} />
                  </div>
                  <p className="text-slate-500 font-bold text-sm">Drop PDF or Image</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Configuration Slider */}
        <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 mb-8">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center space-x-3">
              <div className="bg-slate-900 p-2 rounded-lg">
                <Settings2 size={18} className="text-white" />
              </div>
              <span className="font-black text-xs uppercase tracking-widest text-slate-400">Exam Configuration</span>
            </div>
            <div className="bg-blue-50 text-blue-700 px-6 py-2 rounded-2xl font-black text-2xl flex items-baseline">
              {questionCount} <span className="text-[10px] uppercase ml-2 tracking-tighter">Questions</span>
            </div>
          </div>
          
          <input 
            type="range" 
            min="5" 
            max="50" 
            step="5"
            value={questionCount}
            onChange={(e) => setQuestionCount(parseInt(e.target.value))}
            className="w-full h-2.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
        </div>

        {/* Action Button */}
        <button 
          onClick={handleGenerate}
          disabled={loading || scanning || (!inputText && !file)}
          className="group w-full py-6 bg-slate-900 text-white rounded-[32px] font-black text-xl hover:bg-blue-600 disabled:bg-slate-200 disabled:text-slate-400 transition-all transform active:scale-[0.98] shadow-xl hover:shadow-blue-200 flex items-center justify-center space-x-3"
        >
          {scanning ? (
            <><Loader2 className="animate-spin" /> <span>Reading File...</span></>
          ) : loading ? (
            <><Loader2 className="animate-spin" /> <span>AI is generating...</span></>
          ) : (
            <>
              <span>Generate Quiz</span>
              <Sparkles size={20} className="group-hover:rotate-12 transition-transform" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}