import { createClient } from '@/utils/supabase/server'; // 1. Use the new server utility
import { createClient as createAdminClient } from '@supabase/supabase-js'; // For the Admin/Service Role
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
  // We use our server utility which automatically handles cookies
  const supabase = await createClient();

  // Check for the Manual Token first (from our frontend 'Authorization' header)
  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.split('Bearer ')[1];

  let user = null;

  if (token) {
    // Verify session using the manual token
    const { data } = await supabase.auth.getUser(token);
    user = data.user;
  } else {
    // Fall back to checking the browser cookies
    const { data } = await supabase.auth.getUser();
    user = data.user;
  }

  if (!user) {
    console.error("❌ AUTH ERROR: No user found via token or cookies");
    return NextResponse.json({ error: "Unauthorized: Please log in again." }, { status: 401 });
  }

  const userId = user.id;

  // 3. INITIALIZE ADMIN CLIENT (For database writes)
  const supabaseAdmin = createAdminClient(supabaseUrl, supabaseServiceKey);

  try {
    const { content, title, count } = await req.json();

    if (!groqApiKey) {
      throw new Error("GROQ_API_KEY is missing in the server environment.");
    }

    // 4. Save Note
    const { data: note, error: noteError } = await supabaseAdmin
      .from('notes')
      .insert([{ 
        content: content || "Manual entry analysis", 
        title: title || "New Study Session",
        user_id: userId 
      }])
      .select()
      .single();

    if (noteError) throw new Error(`Supabase Note: ${noteError.message}`);

    // 5. Construct Prompt
    const promptText = `
      You are a specialized JSON quiz generator.
      Analyze the following content and create exactly ${count} multiple-choice questions.
      STRICT RULES: Return ONLY raw JSON with "summary" (string) and "questions" (array of objects). 
      Each question must have "question_text", "options" (array), and "correct_answer".
      Content: ${content}
    `;

    // 6. Fetch from Groq
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${groqApiKey}`,
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
      question_type: q.question_type || "CBT",
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