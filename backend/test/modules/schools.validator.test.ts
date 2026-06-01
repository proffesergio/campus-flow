import { updateSchoolSchema } from '../../src/modules/schools/schools.validator';

describe('schools feature — appearance validation', () => {
  it('accepts valid 6-digit and 3-digit hex colors', () => {
    expect(updateSchoolSchema.safeParse({ primaryColor: '#3B82F6' }).success).toBe(true);
    expect(updateSchoolSchema.safeParse({ secondaryColor: '#abc' }).success).toBe(true);
  });

  it('rejects malformed hex colors', () => {
    expect(updateSchoolSchema.safeParse({ primaryColor: '3B82F6' }).success).toBe(false);
    expect(updateSchoolSchema.safeParse({ primaryColor: '#GG0000' }).success).toBe(false);
  });

  it('allows logoUrl to be cleared with null', () => {
    expect(updateSchoolSchema.safeParse({ logoUrl: null }).success).toBe(true);
  });

  it('accepts a base64 data-URL logo under the size cap', () => {
    const dataUrl = 'data:image/png;base64,' + 'A'.repeat(1000);
    expect(updateSchoolSchema.safeParse({ logoUrl: dataUrl }).success).toBe(true);
  });

  it('rejects a logo over the ~1.5MB cap', () => {
    const huge = 'data:image/png;base64,' + 'A'.repeat(1_600_000);
    expect(updateSchoolSchema.safeParse({ logoUrl: huge }).success).toBe(false);
  });

  it('validates email, website and locale when present', () => {
    expect(updateSchoolSchema.safeParse({ email: 'bad' }).success).toBe(false);
    expect(updateSchoolSchema.safeParse({ website: 'not-a-url' }).success).toBe(false);
    expect(updateSchoolSchema.safeParse({ locale: 'fr' }).success).toBe(false);
    expect(updateSchoolSchema.safeParse({ locale: 'bn' }).success).toBe(true);
  });

  it('accepts an empty partial update', () => {
    expect(updateSchoolSchema.safeParse({}).success).toBe(true);
  });
});
