'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Tesseract from 'tesseract.js'; // 1. Import Tesseract for OCR
import { 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  Loader2, 
  BookOpen, 
  Settings2, 
  RotateCcw,
  Search // New icon for scanning
} from 'lucide-react';

export default function Dashboard() {
  const router = useRouter();
  
  // States
  const [inputText, setInputText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false); // New state for image scanning
  const [questionCount, setQuestionCount] = useState(10);

  // --- HELPER: PDF Text Extraction ---
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
      let payload: any = { 
        count: questionCount,
        title: file ? file.name : "New Study Session"
      };

      // 2. Handle File Processing
      if (file) {
        if (file.type === "application/pdf") {
          finalContent = await extractPdfText(file);
        } else if (file.type.startsWith("image/")) {
          // --- OCR LOGIC START ---
          setScanning(true);
          const { data: { text } } = await Tesseract.recognize(file, 'eng');
          finalContent = text;
          setScanning(false);
          // --- OCR LOGIC END ---
        }
      }

      if (!finalContent || finalContent.trim().length < 10) {
        alert("The content is too short to generate a quiz!");
        setLoading(false);
        return;
      }

      payload.content = finalContent;

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await res.json();
      if (result.success) {
        router.push(`/quiz/${result.quizId}`);
      } else {
        alert("Error: " + result.error);
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong during generation!");
    } finally {
      setLoading(false);
      setScanning(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-black p-4 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center space-x-4">
            <div className="bg-blue-600 p-3 rounded-2xl shadow-lg">
              <BookOpen className="text-white" size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900">StudyAI</h1>
              <p className="text-slate-500 font-medium">Generate CBT exams from any material</p>
            </div>
          </div>

          <button 
            onClick={() => router.push('/dashboard')}
            className="flex items-center space-x-2 text-slate-600 font-bold hover:text-blue-600 transition"
          >
            <RotateCcw size={18} />
            <span className="hidden sm:inline">View History</span>
          </button>
        </div>

        {/* Inputs Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100">
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-4 font-mono">Input Text</label>
            <textarea 
              className="w-full h-64 p-5 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-blue-500 transition-all outline-none resize-none text-slate-800"
              placeholder="Paste notes here..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={!!file}
            />
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100 text-center">
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-4 font-mono text-left">Upload PDF/Photo</label>
            <div className={`relative h-64 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center transition-all ${file ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-slate-50'}`}>
              <input 
                type="file" 
                accept="application/pdf,image/*" 
                className="absolute inset-0 opacity-0 cursor-pointer" 
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              {file ? (
                <div className="p-4">
                  <div className="bg-blue-600 p-4 rounded-full text-white mx-auto w-fit mb-2 shadow-md">
                    {file.type === 'application/pdf' ? <FileText size={32} /> : <ImageIcon size={32} />}
                  </div>
                  <p className="font-bold text-slate-800 text-sm truncate max-w-[200px]">{file.name}</p>
                  <button onClick={() => setFile(null)} className="text-xs text-red-500 font-bold mt-2 hover:underline">Remove File</button>
                </div>
              ) : (
                <>
                  <Upload className="text-slate-300 mb-2" size={48} />
                  <p className="text-slate-500 font-bold text-sm px-4">Drop PDF or Photo here</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* --- THE SLIDER SECTION --- */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100 mb-8">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-2 text-slate-800">
              <Settings2 size={20} className="text-blue-600" />
              <span className="font-black text-sm uppercase tracking-wider">Exam Configuration</span>
            </div>
            <span className="bg-blue-600 text-white px-4 py-1 rounded-full font-black text-lg shadow-md">
              {questionCount} <span className="text-xs uppercase ml-1">Questions</span>
            </span>
          </div>
          
          <input 
            type="range" 
            min="5" 
            max="70" 
            step="5"
            value={questionCount}
            onChange={(e) => setQuestionCount(parseInt(e.target.value))}
            className="w-full h-3 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600 mb-4"
          />
          
          <div className="flex justify-between text-[10px] text-slate-400 font-black uppercase px-1">
            <span>Short (5)</span>
            <span>Standard (35)</span>
            <span>Intensive (70)</span>
          </div>
        </div>

        {/* --- DYNAMIC BUTTON --- */}
        <button 
          onClick={handleGenerate}
          disabled={loading || scanning || (!inputText && !file)}
          className="w-full py-6 bg-slate-900 text-white rounded-3xl font-black text-xl hover:bg-black disabled:bg-slate-200 flex flex-col items-center justify-center transition-all transform active:scale-[0.98] shadow-2xl"
        >
          {scanning ? (
            <div className="flex items-center space-x-3">
              <Search className="animate-bounce" />
              <span>Scanning Image...</span>
            </div>
          ) : loading ? (
            <div className="flex items-center space-x-3">
              <Loader2 className="animate-spin" />
              <span>Creating Your Quiz...</span>
            </div>
          ) : (
            <span>Generate {questionCount} Questions</span>
          )}
        </button>
      </div>
    </div>
  );
}