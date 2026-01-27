'use server'

import { supabase } from '../lib/supabase';

export async function processLectureImage(formData: FormData) {
  const file = formData.get('image') as File;
  if (!file) return { error: "No file uploaded" };

  // 1. Convert image to Base64 so the AI can read it
  const arrayBuffer = await file.arrayBuffer();
  const base64Image = Buffer.from(arrayBuffer).toString('base64');

  try {
    // 2. Here, we would call the AI API. 
    // I will mock the return data for now so we can finish the DB flow.
    const extractedText = "This is the text the AI found in your image..."; 
    const summary = "AI-generated summary of the image content.";

    // 3. Save to Supabase
    const { data, error } = await supabase
      .from('notes')
      .insert([{ content: extractedText, title: file.name }])
      .select()
      .single();

    if (error) throw error;

    return { success: true, noteId: data.id, summary };
  } catch (err) {
    return { error: "Failed to process image" };
  }
}