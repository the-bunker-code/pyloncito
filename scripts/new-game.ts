import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

interface GeneratedFile {
  path: string;
  content: string;
}

function fail(message: string): never {
  throw new Error(message);
}

function titleCase(slug: string): string {
  return slug
    .split('-')
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ');
}

function file(path: string, content: string): GeneratedFile {
  return { path, content: `${content.trim()}\n` };
}

function scaffold(slug: string, name: string): GeneratedFile[] {
  const gameDir = `src/games/${slug}`;
  const componentDir = `src/components/games/${slug}`;
  const page = `src/pages/juegos/${slug}.astro`;
  const content = `src/content/es/${slug}.ts`;

  return [
    file(
      `${gameDir}/rules.ts`,
      `
export interface Round {
  index: number;
  answer: number;
}

export function createRound(index: number): Round {
  if (!Number.isInteger(index) || index < 1) {
    throw new Error('Round index starts at 1');
  }
  return { index, answer: index % 3 };
}
      `,
    ),
    file(
      `${gameDir}/engine.ts`,
      `
import { createRound, type Round } from './rules';

export interface GameState {
  round: number;
  current: Round | null;
}

export function createState(): GameState {
  return { round: 0, current: null };
}

export function startRound(state: GameState): GameState {
  const round = state.round + 1;
  return { round, current: createRound(round) };
}
      `,
    ),
    file(
      `${gameDir}/config.ts`,
      `
export const config = {
  slug: '${slug}',
  rounds: 5,
} as const;
      `,
    ),
    file(
      `${gameDir}/copy.ts`,
      `
export { copy } from '../../content/es/${slug}';
      `,
    ),
    file(
      `${gameDir}/storage.ts`,
      `
import { createStorage } from '../../lib/storage';

export const storage = createStorage('${slug}');
      `,
    ),
    file(
      content,
      `
export const copy = {
  title: '${name}',
  placeholder: 'Este juego está en preparación.',
} as const;
      `,
    ),
    file(
      `${componentDir}/Game.vue`,
      `
<script setup lang="ts">
import type { GameEntry } from '../../../config/games';
import { copy } from '../../../games/${slug}/copy';

defineProps<{ game: GameEntry }>();
</script>

<template>
  <div class="page">
    <a class="page__back" href="/">Volver al inicio</a>
    <h1>{{ game.name }}</h1>
    <p class="page__lead">{{ copy.placeholder }}</p>
  </div>
</template>
      `,
    ),
    file(
      page,
      `
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import Game from '../../components/games/${slug}/Game.vue';
import { findGame } from '../../config/games';

const game = findGame('${slug}');
if (!game) throw new Error('Juego no encontrado: ${slug}');
---

<BaseLayout title={game.name} description={game.description} noindex>
  <Game client:load game={game} />
</BaseLayout>
      `,
    ),
    file(
      `tests/unit/${slug}.rules.test.ts`,
      `
import { describe, expect, it } from 'vitest';
import { createRound } from '../../src/games/${slug}/rules';

describe('${slug} rules', () => {
  it('creates a deterministic round', () => {
    expect(createRound(1)).toEqual({ index: 1, answer: 1 });
    expect(createRound(3)).toEqual({ index: 3, answer: 0 });
  });

  it('rejects invalid round indexes', () => {
    expect(() => createRound(0)).toThrow('Round index starts at 1');
  });
});
      `,
    ),
    file(
      `tests/e2e/${slug}.smoke.spec.ts`,
      `
import { expect, test } from '@playwright/test';

test('${name} carga sin errores', async ({ page }) => {
  const problems: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') problems.push(message.text());
  });
  page.on('pageerror', (error) => problems.push(error.message));

  await page.goto('/juegos/${slug}/');
  await expect(page.getByRole('heading', { name: '${name}', level: 1 })).toBeVisible();
  await expect(page.getByText('Este juego está en preparación.')).toBeVisible();

  const hasHorizontalScroll = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(hasHorizontalScroll).toBe(false);
  expect(problems).toEqual([]);
});
      `,
    ),
  ];
}

function addToRegistry(slug: string, name: string): void {
  const path = 'src/config/games.ts';
  const source = readFileSync(path, 'utf8');
  const marker = '\n];\n\nexport const visibleGames';

  if (source.includes(`slug: '${slug}'`)) {
    fail(`The game "${slug}" is already registered in ${path}`);
  }
  if (!source.includes(marker)) {
    fail(`Could not find the games registry marker in ${path}`);
  }

  const entry = `
  {
    slug: '${slug}',
    name: '${name}',
    icon: 'sparkles',
    theme: 'dados',
    age: '3–7 años',
    skill: 'Por definir',
    minutes: [5, 10],
    status: 'hidden',
    description: '${name} es un juego nuevo de Pyloncito.',
  },
`;
  writeFileSync(path, source.replace(marker, `\n${entry}];\n\nexport const visibleGames`));
}

function main(): void {
  const slug = process.argv[2];
  if (!slug) {
    fail('Usage: pnpm new-game <slug>');
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    fail('The slug must use lowercase kebab-case, for example: mi-juego');
  }

  const name = titleCase(slug);
  const gameDir = join('src', 'games', slug);
  const componentDir = join('src', 'components', 'games', slug);
  const page = join('src', 'pages', 'juegos', `${slug}.astro`);
  const content = join('src', 'content', 'es', `${slug}.ts`);

  for (const path of [gameDir, componentDir, page, content]) {
    if (existsSync(path)) {
      fail(`Already exists: ${path}`);
    }
  }

  for (const generated of scaffold(slug, name)) {
    mkdirSync(join(generated.path, '..'), { recursive: true });
    writeFileSync(generated.path, generated.content, { flag: 'wx' });
  }

  addToRegistry(slug, name);

  process.stdout.write(`Created ${name} in src/games/${slug}.\n`);
  process.stdout.write('Next: edit its entry in src/config/games.ts and implement the game.\n');
  process.stdout.write('Then run pnpm check.\n');
}

try {
  main();
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
}
