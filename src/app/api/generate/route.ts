import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  console.log("🚀 API Route Hit: Generating Private Quiz via Groq...");

  // Initialize Supabase with service role key
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const { content, title, count } = await req.json();
    
    // 1. Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "You must be logged in to generate quizzes." }, { status: 401 });
    }

    const userId = user.id;
    const API_KEY = process.env.GROQ_API_KEY;

    if (!API_KEY) {
      throw new Error("GROQ_API_KEY is missing in your .env.local file.");
    }

    // 2. Save Note with user_id
    const { data: note, error: noteError } = await supabase
      .from('notes')
      .insert([{ 
        content: content || "Manual entry analysis", 
        title: title || "New Study Session",
        user_id: userId // <--- Crucial for RLS
      }])
      .select()
      .single();

    if (noteError) throw new Error(`Supabase Note: ${noteError.message}`);

    // 3. Construct the Quiz Prompt (Unchanged)
    const promptText = `
      You are a specialized JSON quiz generator.
      Analyze the following content and create exactly ${count} multiple-choice questions.
      STRICT RULES: Return ONLY raw JSON. "correct_answer" must match options exactly.
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
          { role: "system", content: "You are a JSON-only API." },
          { role: "user", content: promptText }
        ],
        response_format: { type: "json_object" }
      }),
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error?.message || "Groq API Failure");

    // 5. Parse Data
    const rawContent = result.choices[0].message.content;
    const aiData = JSON.parse(rawContent);

    // 6. Create Quiz record with user_id
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .insert([{ 
        note_id: note.id, 
        summary: aiData.summary,
        user_id: userId // <--- Crucial for RLS
      }])
      .select()
      .single();

    if (quizError) throw new Error(`Supabase Quiz: ${quizError.message}`);

    // 7. Format and Insert Questions with user_id
    const questionsToInsert = aiData.questions.map((q: any) => ({
      quiz_id: quiz.id,
      question_text: q.question_text,
      options: q.options,
      correct_answer: q.correct_answer,
      question_type: q.question_type || "CBT",
      user_id: userId // <--- Crucial for RLS
    }));

    const { error: qError } = await supabase.from('questions').insert(questionsToInsert);
    
    if (qError) throw new Error(`Supabase Questions: ${qError.message}`);

    console.log(`🎉 SUCCESS! Private quiz created for user: ${userId}`);
    return NextResponse.json({ success: true, quizId: quiz.id });

  } catch (err: any) {
    console.error("❌ API ERROR:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}