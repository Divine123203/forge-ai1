import { createClient } from '@/utils/supabase/server'; 
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  console.log("🚀 API Route Hit: Generating Private Quiz...");

  // 1. Load environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const groqApiKey = process.env.GROQ_API_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("❌ ERROR: Missing Supabase Environment Variables");
    return NextResponse.json({ error: "Server configuration error." }, { status: 500 });
  }

  // 2. AUTHENTICATE THE USER
  // We initialize the server client which automatically parses cookies from 'req'
  const supabase = await createClient();

  // We use getUser() - this is the most reliable way to check the session in an API route
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error("❌ AUTH ERROR: Session invalid or expired", authError?.message);
    return NextResponse.json(
      { error: "Unauthorized: Your session has expired. Please log in again." }, 
      { status: 401 }
    );
  }

  const userId = user.id;

  // 3. INITIALIZE ADMIN CLIENT (For database writes bypassing RLS if necessary)
  const supabaseAdmin = createAdminClient(supabaseUrl, supabaseServiceKey);

  try {
    const { content, title, count } = await req.json();

    if (!content) {
      return NextResponse.json({ error: "Content is required to generate a quiz." }, { status: 400 });
    }

    if (!groqApiKey) {
      throw new Error("GROQ_API_KEY is missing in the server environment.");
    }

    // 4. Save Note
    const { data: note, error: noteError } = await supabaseAdmin
      .from('notes')
      .insert([{ 
        content: content, 
        title: title || "New Study Session",
        user_id: userId 
      }])
      .select()
      .single();

    if (noteError) throw new Error(`Supabase Note: ${noteError.message}`);

    // 5. Construct Prompt
    const promptText = `
      You are a specialized JSON quiz generator.
      Analyze the following content and create exactly ${count || 5} multiple-choice questions.
      STRICT RULES: Return ONLY raw JSON with "summary" (string) and "questions" (array of objects). 
      Each question must have "question_text", "options" (array of 4 strings), and "correct_answer" (must match one of the options exactly).
      Content: ${content}
    `;

    // 6. Fetch from Groq
    const aiResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${groqApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "You are a JSON-only API that outputs structured quiz data." },
          { role: "user", content: promptText }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7
      }),
    });

    const result = await aiResponse.json();
    if (!aiResponse.ok) throw new Error(result.error?.message || "Groq API Failure");

    const aiData = JSON.parse(result.choices[0].message.content);

    // 7. Create Quiz record
    const { data: quiz, error: quizError } = await supabaseAdmin
      .from('quizzes')
      .insert([{ 
        note_id: note.id, 
        summary: aiData.summary || "No summary generated.",
        user_id: userId 
      }])
      .select()
      .single();

    if (quizError) throw new Error(`Supabase Quiz: ${quizError.message}`);

    // 8. Insert Questions
    const questionsToInsert = aiData.questions.map((q: any) => ({
      quiz_id: quiz.id,
      question_text: q.question_text,
      options: q.options,
      correct_answer: q.correct_answer,
      question_type: "CBT",
      user_id: userId 
    }));

    const { error: qError } = await supabaseAdmin.from('questions').insert(questionsToInsert);
    
    if (qError) throw new Error(`Supabase Questions: ${qError.message}`);

    console.log(`🎉 SUCCESS! Private quiz created for user: ${userId}`);
    return NextResponse.json({ success: true, quizId: quiz.id });

  } catch (err: any) {
    console.error("❌ API ERROR:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}