/**
 * Reactions the server accepts. Each entry has a name for screen readers.
 * Escapes keep this file plain ASCII. The list must match ALLOWED_EMOJI in mock-server/lib/messageActions.js.
 */
export const REACTION_CHOICES = [
  { emoji: '\u{1F44D}', name: 'Thumbs up' },
  { emoji: '\u{1F44E}', name: 'Thumbs down' },
  { emoji: '\u2764\uFE0F', name: 'Red heart' },
  { emoji: '\u{1F602}', name: 'Laughing' },
  { emoji: '\u{1F600}', name: 'Grinning' },
  { emoji: '\u{1F60D}', name: 'Heart eyes' },
  { emoji: '\u{1F642}', name: 'Slightly smiling' },
  { emoji: '\u{1F62E}', name: 'Surprised' },
  { emoji: '\u{1F622}', name: 'Crying' },
  { emoji: '\u{1F914}', name: 'Thinking' },
  { emoji: '\u{1F44F}', name: 'Clapping' },
  { emoji: '\u{1F64F}', name: 'Folded hands' },
  { emoji: '\u{1F389}', name: 'Party' },
  { emoji: '\u{1F525}', name: 'Fire' },
  { emoji: '\u{1F680}', name: 'Rocket' },
  { emoji: '\u{1F4AF}', name: 'Hundred' },
  { emoji: '\u2705', name: 'Check mark' },
  { emoji: '\u{1F440}', name: 'Eyes' },
];

export const ALLOWED_REACTIONS = REACTION_CHOICES.map((choice) => choice.emoji);