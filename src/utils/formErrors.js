/**
 * Maps a serializable API error onto React Hook Form.
 * Field-level details go to their inputs; anything else goes to the form root.
 */
export function applyServerErrors(setError, error) {
  const details = Array.isArray(error?.details) ? error.details : [];
  if (details.length === 0) {
    setError('root', {
      type: 'server',
      message: error?.message ?? 'Something went wrong. Please try again.',
    });
    return;
  }
  details.forEach(({ field, message }) => setError(field, { type: 'server', message }));
}
