import { beforeAll, describe, expect, it, jest } from '@jest/globals';
import request from 'supertest';

jest.unstable_mockModule('../services/chat.js', () => ({
  sendMessage: jest.fn(),
}));

let app;
let chatService;

beforeAll(async () => {
  chatService = await import('../services/chat.js');
  ({ default: app } = await import('../server.js'));
});

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

  it('incluye title en la respuesta cuando la conversación es nueva', async () => {
    chatService.sendMessage.mockResolvedValue({
      conversationId: 'new-conv-id',
      message: { role: 'assistant', content: 'Respuesta' },
      title: 'Título generado de prueba',
    });

    const res = await request(app)
      .post('/api/chat')
      .send({ message: 'Primer mensaje' });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Título generado de prueba');
  });

  it('responde 500 si el servicio lanza un error', async () => {
    chatService.sendMessage.mockRejectedValue(new Error('fallo'));

    const res = await request(app)
      .post('/api/chat')
      .send({ message: 'Hola' });

    expect(res.status).toBe(500);
  });
});
