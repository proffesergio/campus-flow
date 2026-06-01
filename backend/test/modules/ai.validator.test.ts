import {
  adminQuerySchema,
  studyChatSchema,
  practiceQuestionsSchema,
} from '../../src/modules/ai/ai.validator';

describe('ai feature — validation', () => {
  it('requires an admin question of at least 3 chars', () => {
    expect(adminQuerySchema.safeParse({ question: 'Hi' }).success).toBe(false);
    expect(adminQuerySchema.safeParse({ question: 'How many students?' }).success).toBe(true);
  });

  it('requires between 1 and 20 chat messages', () => {
    expect(studyChatSchema.safeParse({ messages: [] }).success).toBe(false);
    expect(
      studyChatSchema.safeParse({ messages: [{ role: 'user', content: 'Explain photosynthesis' }] })
        .success,
    ).toBe(true);
  });

  it('rejects an unknown chat role', () => {
    expect(
      studyChatSchema.safeParse({ messages: [{ role: 'system', content: 'x' }] }).success,
    ).toBe(false);
  });

  it('defaults difficulty to medium and count to 5', () => {
    const parsed = practiceQuestionsSchema.parse({
      subject: 'Physics',
      topic: 'Newton laws',
      studentClass: 'Class 9',
    });
    expect(parsed.difficulty).toBe('medium');
    expect(parsed.count).toBe(5);
  });

  it('caps practice question count at 20', () => {
    expect(
      practiceQuestionsSchema.safeParse({
        subject: 'Physics',
        topic: 'Newton laws',
        studentClass: 'Class 9',
        count: '50',
      }).success,
    ).toBe(false);
  });
});
