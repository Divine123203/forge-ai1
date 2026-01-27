import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  console.log("🚀 API Route Hit: Generating Quiz via Groq...");

  try {
    const { content, title, count } = await req.json();
    
    // 1. Pull the key from environment variables (No more hardcoding!)
    const API_KEY = process.env.GROQ_API_KEY;

    if (!API_KEY) {
      throw new Error("GROQ_API_KEY is missing in your .env.local file.");
    }

    // 2. Save the initial Note to Supabase
    const { data: note, error: noteError } = await supabase
      .from('notes')
      .insert([{ 
        content: content || "Manual entry analysis", 
        title: title || "New Study Session" 
      }])
      .select()
      .single();

    if (noteError) throw new Error(`Supabase Note: ${noteError.message}`);

    // 3. Construct the Quiz Prompt
    const promptText = `
      You are a specialized JSON quiz generator.
      Analyze the following content and create exactly ${count} multiple-choice questions.

      STRICT RULES:
      - Return ONLY raw JSON. No conversational text.
      - "correct_answer" must be the exact string from the options array.
      - Each question must have 4 options.

      JSON Format:
      {
        "summary": "1-sentence summary of content",
        "questions": [
          {
            "question_text": "...",
            "options": ["...", "...", "...", "..."],
            "correct_answer": "...",
            "question_type": "CBT"
          }
        ]
      }

      Content: ${content}
    `;

    // 4. Fetch from Groq
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "You are a JSON-only API. No explanations." },
          { role: "user", content: promptText }
        ],
        response_format: { type: "json_object" } // This prevents "Please..." or markdown blocks
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("❌ Groq Error Response:", result);
      throw new Error(result.error?.message || "Groq API Connection Failed");
    }

    // 5. PARSE GROQ DATA (Corrected for Groq/OpenAI structure)
    const rawContent = result.choices[0].message.content;
    const aiData = JSON.parse(rawContent);

    // 6. Create Quiz record in Supabase
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .insert([{ 
        note_id: note.id, 
        summary: aiData.summary 
      }])
      .select()
      .single();

    if (quizError) throw new Error(`Supabase Quiz: ${quizError.message}`);

    // 7. Format and Insert Questions
    const questionsToInsert = aiData.questions.map((q: any) => ({
      quiz_id: quiz.id,
      question_text: q.question_text,
      options: q.options,
      correct_answer: q.correct_answer,
      question_type: q.question_type || "CBT"
    }));

    const { error: qError } = await supabase.from('questions').insert(questionsToInsert);
    
    if (qError) throw new Error(`Supabase Questions: ${qError.message}`);

    console.log(`🎉 SUCCESS! Generated ${aiData.questions.length} questions.`);
    return NextResponse.json({ success: true, quizId: quiz.id });

  } catch (err: any) {
    console.error("❌ API ERROR:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}