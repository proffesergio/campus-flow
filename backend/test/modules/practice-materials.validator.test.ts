import {
  createMaterialSchema,
  materialQuerySchema,
} from '../../src/modules/practice-materials/practice-materials.validator';

describe('practice-materials feature — validation', () => {
  it('accepts a published note with no URLs', () => {
    const parsed = createMaterialSchema.parse({ title: 'Algebra notes', type: 'note' });
    expect(parsed.isPublished).toBe(true);
  });

  it('requires a title', () => {
    expect(createMaterialSchema.safeParse({ title: '', type: 'pdf' }).success).toBe(false);
  });

  it('rejects an unknown material type', () => {
    expect(createMaterialSchema.safeParse({ title: 'X', type: 'audio' }).success).toBe(false);
  });

  it('accepts an empty-string fileUrl (optional-or-empty)', () => {
    expect(createMaterialSchema.safeParse({ title: 'X', type: 'pdf', fileUrl: '' }).success).toBe(true);
  });

  it('rejects a malformed externalUrl', () => {
    expect(
      createMaterialSchema.safeParse({ title: 'X', type: 'link', externalUrl: 'nope' }).success,
    ).toBe(false);
  });

  it('coerces publishedOnly and pagination in the query', () => {
    const parsed = materialQuerySchema.parse({ publishedOnly: 'true', page: '3' });
    expect(parsed.publishedOnly).toBe(true);
    expect(parsed.page).toBe(3);
  });
});
