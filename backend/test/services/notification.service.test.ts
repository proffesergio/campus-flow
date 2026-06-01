import { substituteVariables } from '../../src/services/notification.service';

describe('notification template substitution', () => {
  it('replaces known {{variables}}', () => {
    expect(
      substituteVariables('Dear {{name}}, your balance is {{amount}}', {
        name: 'Karim',
        amount: '3000',
      }),
    ).toBe('Dear Karim, your balance is 3000');
  });

  it('leaves unknown placeholders intact', () => {
    expect(substituteVariables('Hi {{missing}}', {})).toBe('Hi {{missing}}');
  });

  it('returns the template unchanged when there are no placeholders', () => {
    expect(substituteVariables('No variables here', { x: '1' })).toBe('No variables here');
  });

  it('substitutes repeated placeholders', () => {
    expect(substituteVariables('{{a}}-{{a}}', { a: 'x' })).toBe('x-x');
  });
});
