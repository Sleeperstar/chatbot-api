import supabase from './supabase.js';
import openai, { generateTitle } from './openai.js';

const SYSTEM_PROMPT = 'Eres un asistente útil y conciso.';

export async function sendMessage(userContent, conversationId = null) {
  if (!conversationId) {
    const title = await generateTitle(userContent);
    const { data, error } = await supabase
      .from('conversations')
      .insert({ title })
      .select('id')
      .single();
    if (error) throw error;
    conversationId = data.id;
  }

  // Recuperar historial
  const { data: history, error: histError } = await supabase
    .from('messages')
    .select('role, content')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });
  if (histError) throw histError;

  // Guardar mensaje del usuario
  const { error: insertError } = await supabase
    .from('messages')
    .insert({ conversation_id: conversationId, role: 'user', content: userContent });
  if (insertError) throw insertError;

  // Llamar a OpenAI con historial completo
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history,
    { role: 'user', content: userContent },
  ];

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
  });

  const assistantContent = completion.choices[0].message.content;

  // Guardar respuesta del asistente
  const { error: saveError } = await supabase
    .from('messages')
    .insert({ conversation_id: conversationId, role: 'assistant', content: assistantContent });
  if (saveError) throw saveError;

  return { conversationId, message: { role: 'assistant', content: assistantContent } };
}
