export const EXAM_GEN_PROMPT = (content: string) => `
  You are an expert professor. Based on the lecture notes provided below, generate a structured study kit.
  
  NOTES:
  ${content}

  RETURN ONLY A JSON OBJECT with this exact structure:
  {
    "summary": "3-4 sentence high-level summary",
    "questions": [
      {
        "question_text": "The question here",
        "question_type": "CBT",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correct_answer": "Option A",
        "explanation": "Why this is correct"
      }
    ],
    "theory_questions": [
      {
        "question_text": "The theory question here",
        "key_points": ["point 1", "point 2"]
      }
    ]
  }
`;