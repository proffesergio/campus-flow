import { registerSchoolSchema, loginSchema } from '../../src/modules/auth/auth.validator';

describe('auth feature — validation', () => {
  const validRegister = {
    schoolName: 'Dhaka Grammar School',
    schoolSlug: 'dhaka-grammar',
    adminFirstName: 'Karim',
    adminLastName: 'Rahman',
    adminEmail: 'admin@dhakagrammar.edu',
    adminPassword: 'secret123',
  };

  it('accepts a well-formed school registration', () => {
    expect(registerSchoolSchema.safeParse(validRegister).success).toBe(true);
  });

  it('rejects slugs with uppercase or spaces', () => {
    expect(
      registerSchoolSchema.safeParse({ ...validRegister, schoolSlug: 'Dhaka Grammar' }).success,
    ).toBe(false);
  });

  it('rejects passwords shorter than 8 chars', () => {
    expect(
      registerSchoolSchema.safeParse({ ...validRegister, adminPassword: 'short' }).success,
    ).toBe(false);
  });

  it('rejects an invalid admin email', () => {
    expect(
      registerSchoolSchema.safeParse({ ...validRegister, adminEmail: 'not-an-email' }).success,
    ).toBe(false);
  });

  it('accepts valid login credentials', () => {
    expect(loginSchema.safeParse({ email: 'a@b.com', password: 'x' }).success).toBe(true);
  });

  it('rejects login with an empty password', () => {
    expect(loginSchema.safeParse({ email: 'a@b.com', password: '' }).success).toBe(false);
  });
});
