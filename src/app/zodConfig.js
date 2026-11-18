import { z } from 'zod';

// Zod checks at startup whether it may call new Function() to build faster validators.
// A strict Content Security Policy blocks that call. Jitless mode skips it, and validation
// behaves the same (only slightly slower). This file must load before any schema is created.
z.config({ jitless: true });
