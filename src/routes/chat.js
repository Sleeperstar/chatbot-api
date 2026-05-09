import { Router } from 'express';
import { sendMessage } from '../services/chat.js';

const router = Router();

router.post('/', async (req, res) => {
  const { message, conversationId } = req.body;

  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'El campo "message" es requerido.' });
  }

  try {
    const result = await sendMessage(message.trim(), conversationId ?? null);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al procesar el mensaje.' });
  }
});

export default router;
