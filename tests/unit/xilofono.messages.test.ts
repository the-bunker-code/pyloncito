import { describe, expect, it } from 'vitest';
import type { Status } from '../../src/games/xilofono/engine';
import { noteLabel, songTitle, statusMessage } from '../../src/games/xilofono/messages';
import type { NoteEvent } from '../../src/games/xilofono/song';

const note = { degree: 4, sharp: true, octave: 2 } as NoteEvent;

describe('xilofono messages', () => {
  it('labels notes and falls back to an untitled song', () => {
    expect(noteLabel(0, false)).toBe('Do');
    expect(noteLabel(4, true)).toBe('Sol♯');
    expect(songTitle('')).toBe('Sin título');
    expect(songTitle('Estrellita')).toBe('Estrellita');
  });

  it('maps every non-error status to plain text', () => {
    const statuses: Status[] = [
      { kind: 'ready' },
      { kind: 'loading' },
      { kind: 'loaded', title: 'Estrellita', shared: false },
      { kind: 'loaded', title: '', shared: true },
      { kind: 'playing' },
      { kind: 'stopped' },
      { kind: 'finished' },
      { kind: 'guide', note },
      { kind: 'guide-done' },
      { kind: 'guide-exit' },
      { kind: 'copied' },
      { kind: 'share-fallback' },
    ];
    for (const status of statuses) {
      const message = statusMessage(status);
      expect(message.error).toBe(false);
      expect(message.text).not.toBe('');
    }
    expect(statusMessage(statuses[2]).text).toContain('Estrellita');
    expect(statusMessage(statuses[3]).text).toContain('Sin título');
    expect(statusMessage({ kind: 'guide', note }).text).toContain('Sol♯');
  });

  it('explains load errors', () => {
    expect(statusMessage({ kind: 'error', code: 'empty-url' })).toEqual({
      text: 'Escribe la dirección del JSON.',
      error: true,
    });
    expect(statusMessage({ kind: 'error', code: 'http', detail: '404' }).text).toBe(
      'No se pudo cargar: El servidor respondió 404.',
    );
    expect(statusMessage({ kind: 'error', code: 'bad-json' }).text).toBe(
      'No se pudo cargar: no es un JSON válido.',
    );
    expect(statusMessage({ kind: 'error', code: 'unknown-note', index: 2 }).text).toBe(
      'No se pudo cargar: Nota 3: no conozco esa nota. Usa Do, Re, Mi, Fa, Sol, La o Si.',
    );
  });
});
