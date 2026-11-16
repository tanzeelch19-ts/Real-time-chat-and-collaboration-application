import { z } from 'zod';

/** Server lowercases the name, so the client only checks the allowed characters. */
export const channelSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Use at least 2 characters')
    .max(32, 'Use 32 characters or fewer')
    .regex(/^[A-Za-z0-9][A-Za-z0-9-]*$/, 'Use letters, numbers, and hyphens. Start with a letter or number.'),
  visibility: z.enum(['public', 'private'], { message: 'Choose public or private' }),
});
