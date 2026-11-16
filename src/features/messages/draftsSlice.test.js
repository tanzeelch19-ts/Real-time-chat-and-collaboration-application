import { describe, expect, it } from 'vitest';
import reducer, { clearDraft, setDraft } from '@/features/messages/draftsSlice';

describe('drafts slice', () => {
  it('keeps a separate draft for each room', () => {
    let state = reducer(undefined, setDraft({ roomId: 'channel:a', text: 'hello' }));
    state = reducer(state, setDraft({ roomId: 'conversation:b', text: 'hi there' }));
    expect(state.byRoom).toEqual({ 'channel:a': 'hello', 'conversation:b': 'hi there' });
  });

  it('removes the draft when the text becomes empty', () => {
    let state = reducer(undefined, setDraft({ roomId: 'channel:a', text: 'hello' }));
    state = reducer(state, setDraft({ roomId: 'channel:a', text: '' }));
    expect(state.byRoom['channel:a']).toBeUndefined();
  });

  it('clears one draft explicitly', () => {
    let state = reducer(undefined, setDraft({ roomId: 'channel:a', text: 'hello' }));
    state = reducer(state, clearDraft('channel:a'));
    expect(state.byRoom).toEqual({});
  });
});
