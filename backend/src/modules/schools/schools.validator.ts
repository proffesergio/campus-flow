import { z } from 'zod';

const hexColor = z
  .string()
  .regex(/^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/, 'Must be a valid hex color (e.g. #3B82F6)');

export const updateSchoolSchema = z
  .object({
    name: z.string().min(1).max(120),
    primaryColor: hexColor,
    secondaryColor: hexColor,
    // Accepts both http(s) URLs and base64 `data:` URLs (logos are stored inline as data URLs).
    // Nullable so the logo can be cleared. Capped well under the 10mb express json limit.
    logoUrl: z.string().max(1_500_000).nullable(),
    address: z.string().max(500),
    phone: z.string().max(30),
    email: z.string().email(),
    website: z.string().url(),
    timezone: z.string().max(60),
    locale: z.enum(['en', 'bn']),
  })
  .partial();

export type UpdateSchoolInput = z.infer<typeof updateSchoolSchema>;
