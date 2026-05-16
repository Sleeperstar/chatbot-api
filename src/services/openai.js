import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateTitle(firstMessage) {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content:
          'Genera un título corto y descriptivo (máximo 8 palabras) para una conversación que comienza con este mensaje. Devuelve únicamente el título, sin comillas ni puntuación al final.',
      },
      { role: 'user', content: firstMessage },
    ],
    max_tokens: 25,
  });
  return completion.choices[0].message.content.trim();
}

export default openai;
