import { broadcastSchema } from '../../src/modules/notifications/notifications.validator';

describe('notifications feature — validation', () => {
  const valid = {
    targetGroup: 'all_parents' as const,
    subject: 'School closed tomorrow',
    message: 'Dear {{recipientName}}, school is closed.',
    channels: ['in_app' as const, 'sms' as const],
  };

  it('accepts a valid broadcast', () => {
    expect(broadcastSchema.safeParse(valid).success).toBe(true);
  });

  it('requires at least one channel', () => {
    expect(broadcastSchema.safeParse({ ...valid, channels: [] }).success).toBe(false);
  });

  it('rejects an unknown channel', () => {
    expect(broadcastSchema.safeParse({ ...valid, channels: ['whatsapp'] }).success).toBe(false);
  });

  it('requires a non-empty subject and message', () => {
    expect(broadcastSchema.safeParse({ ...valid, subject: '' }).success).toBe(false);
    expect(broadcastSchema.safeParse({ ...valid, message: '' }).success).toBe(false);
  });

  it('rejects an unknown target group', () => {
    expect(broadcastSchema.safeParse({ ...valid, targetGroup: 'everyone' }).success).toBe(false);
  });
});
