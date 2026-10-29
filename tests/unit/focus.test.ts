import { describe, expect, it } from 'vitest';
import { focusHeading } from '../../src/games/shared/focus';

describe('focusHeading', () => {
  it('focuses the first heading and adds tabindex when missing', () => {
    document.body.innerHTML = '<h1>Hola</h1>';
    focusHeading(document);
    const heading = document.querySelector('h1');
    expect(heading?.getAttribute('tabindex')).toBe('-1');
    expect(document.activeElement).toBe(heading);
  });

  it('does nothing when there is no heading', () => {
    document.body.innerHTML = '<p>Sin título</p>';
    expect(() => focusHeading(document)).not.toThrow();
  });
});
