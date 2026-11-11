import { NOTE_NAMES, type Degree } from './config';
import { copy } from './copy';
import type { Status } from './engine';

export interface StatusMessage {
  text: string;
  error: boolean;
}

/** Visible name of a note, e.g. "Sol♯". */
export function noteLabel(degree: Degree, sharp: boolean): string {
  return NOTE_NAMES[degree] + (sharp ? '♯' : '');
}

export function songTitle(title: string): string {
  return title === '' ? copy.untitled : title;
}

function errorText(status: Extract<Status, { kind: 'error' }>): string {
  const { code, index, detail } = status;
  if (code === 'empty-url' || code === 'bad-url' || code === 'bad-share') return copy.errors[code];
  if (code === 'http') return copy.errors.load(copy.errors.httpStatus(detail ?? ''));
  const message = copy.errors[code];
  return copy.errors.load(index === undefined ? message : copy.errors.note(index, message));
}

/** Maps an engine status to the text shown next to the controls. */
export function statusMessage(status: Status): StatusMessage {
  const ok = (text: string): StatusMessage => ({ text, error: false });
  switch (status.kind) {
    case 'ready':
      return ok(copy.status.ready);
    case 'loading':
      return ok(copy.status.loading);
    case 'loaded': {
      const title = songTitle(status.title);
      return ok(status.shared ? copy.status.loadedShared(title) : copy.status.loaded(title));
    }
    case 'playing':
      return ok(copy.status.playing);
    case 'stopped':
      return ok(copy.status.stopped);
    case 'finished':
      return ok(copy.status.finished);
    case 'guide':
      return ok(
        copy.status.guide(noteLabel(status.note.degree, status.note.sharp), status.note.octave),
      );
    case 'guide-done':
      return ok(copy.status.guideDone);
    case 'guide-exit':
      return ok(copy.status.guideExit);
    case 'copied':
      return ok(copy.status.copied);
    case 'share-fallback':
      return ok(copy.status.shareFallback);
    case 'error':
      return { text: errorText(status), error: true };
  }
}
