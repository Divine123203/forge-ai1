'use client';

import React, { useState } from 'react';
import { Upload, FileText, Sparkles, Loader2 } from 'lucide-react';
import { processLectureImage } from '@/app/actions';

export default function NoteUploader() {
  const [activeTab, setActiveTab] = useState<'text' | 'image'>('text');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
  setLoading(true);
  try {
    const res = await fetch('/api/generate', {
      method: 'POST',
      body: JSON.stringify({ content: text, title: "My Lecture Note" }),
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await res.json();
    
    if (data.success) {
      // REDIRECT TO THE EXAM WE JUST CREATED
      window.location.href = `/quiz/${data.quizId}`;
    }
  } catch (err) {
    console.error(err);
  } finally {
    setLoading(false);
  }
};



  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  if (!e.target.files?.[0]) return;
  
  setLoading(true);
  const formData = new FormData();
  formData.append('image', e.target.files[0]);

  const result = await processLectureImage(formData);
  
  if (result.success) {
    alert(`Success! Note ID: ${result.noteId}`);
    // We will redirect to the Exam page next!
  } else {
    alert(result.error);
  }
  setLoading(false);
};

  // ... replace the "image" tab content with:
{activeTab === 'image' && (
  <label className="border-2 border-dashed border-gray-300 rounded-xl h-64 flex flex-col items-center justify-center text-gray-400 hover:border-blue-500 hover:bg-blue-50 transition cursor-pointer">
    <Upload size={48} className="mb-4" />
    <p>{loading ? "AI is reading your image..." : "Click to upload lecture photo"}</p>
    <input 
      type="file" 
      accept="image/*" 
      className="hidden" 
      onChange={handleImageUpload} 
      disabled={loading}
    />
  </label>
)}

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-2xl shadow-xl border border-gray-100">
      <div className="flex space-x-4 mb-6 border-b pb-4">
        <button 
          onClick={() => setActiveTab('text')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition ${activeTab === 'text' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
        >
          <FileText size={20} />
          <span>Paste Notes</span>
        </button>
        <button 
          onClick={() => setActiveTab('image')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition ${activeTab === 'image' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
        >
          <Upload size={20} />
          <span>Upload Image/PDF</span>
        </button>
      </div>

      {activeTab === 'text' ? (
        <textarea
          className="w-full h-64 p-4 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-700"
          placeholder="Paste your lecture notes here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      ) : (
        <div className="border-2 border-dashed border-gray-300 rounded-xl h-64 flex flex-col items-center justify-center text-gray-400 hover:border-blue-500 hover:bg-blue-50 transition cursor-pointer">
          <Upload size={48} className="mb-4" />
          <p>Click or drag and drop your lecture images here</p>
          <input type="file" className="hidden" />
        </div>
      )}

      <button
        onClick={handleGenerate}
        disabled={loading || (activeTab === 'text' && !text)}
        className="w-full mt-6 bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-4 rounded-xl font-bold flex items-center justify-center space-x-2 hover:opacity-90 transition disabled:opacity-50"
      >
        {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
        <span>{loading ? "AI is Reading & Writing Questions..." : "Generate My Exam"}</span>
      </button>
    </div>
  );
}