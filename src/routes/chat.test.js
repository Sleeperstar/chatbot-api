import request from 'supertest';
import app from '../server.js';
import * as chatService from '../services/chat.js';

jest.mock('../services/chat.js');

// Esta función describe un test para la ruta POST /api/chat que verifica que el endpoint responde con estado 400 si no se incluye el campo "message" en el cuerpo de la solicitud.
describe('POST /api/chat', () => {
  it('responde 400 si falta el campo message', async () => {
    const res = await request(app).post('/api/chat').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('retorna conversationId y message cuando el servicio responde OK', async () => {
    chatService.sendMessage.mockResolvedValue({
      conversationId: 'abc-123',
      message: { role: 'assistant', content: 'Hola' },
    });

    const res = await request(app)
      .post('/api/chat')
      .send({ message: 'Hola' });

    expect(res.status).toBe(200);
    expect(res.body.conversationId).toBe('abc-123');
    expect(res.body.message.role).toBe('assistant');
  });

  it('responde 500 si el servicio lanza un error', async () => {
    chatService.sendMessage.mockRejectedValue(new Error('fallo'));

    const res = await request(app)
      .post('/api/chat')
      .send({ message: 'Hola' });

    expect(res.status).toBe(500);
  });
});
