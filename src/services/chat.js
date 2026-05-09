import supabase from './supabase.js';
import openai from './openai.js';

const SYSTEM_PROMPT = 'Eres un asistente útil y conciso.';

function buildTitlePrompt(firstMessage) {
  return `Genera un título de máximo 6 palabras para una conversación que comienza con: ${firstMessage}. Solo el título.`;
}

function normalizeGeneratedTitle(raw) {
  if (!raw) return '';
  let t = String(raw).trim();
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    t = t.slice(1, -1).trim();
  }
  return t;
}

export async function sendMessage(userContent, conversationId = null) {
  // Crear conversación si no existe
  if (!conversationId) {
    const { data, error } = await supabase
      .from('conversations')
      .insert({ title: null })
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

  const { data: convRow, error: convError } = await supabase
    .from('conversations')
    .select('title')
    .eq('id', conversationId)
    .single();
  if (convError) throw convError;

  let resolvedTitle = convRow?.title?.trim() || null;

  if (!resolvedTitle) {
    try {
      const titleCompletion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: buildTitlePrompt(userContent) }],
      });
      const generated = normalizeGeneratedTitle(titleCompletion.choices[0]?.message?.content);
      if (generated) {
        const { error: titleUpdateError } = await supabase
          .from('conversations')
          .update({ title: generated })
          .eq('id', conversationId);
        if (!titleUpdateError) {
          resolvedTitle = generated;
        }
      }
    } catch (err) {
      console.error('No se pudo generar el título de la conversación:', err);
    }
  }

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

  const result = {
    conversationId,
    message: { role: 'assistant', content: assistantContent },
  };
  if (resolvedTitle) {
    result.title = resolvedTitle;
  }
  return result;
}
