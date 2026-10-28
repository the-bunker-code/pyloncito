import type { IconName } from '../components/ui/icons';

export type GameStatus = 'ready' | 'beta' | 'coming' | 'hidden';
export type GameTheme = 'dados' | 'memoria' | 'miradas' | 'mira-y-dime';

export interface GameEntry {
  slug: string;
  name: string;
  icon: IconName;
  theme: GameTheme;
  age: string;
  skill: string;
  minutes: readonly [number, number];
  status: GameStatus;
  description: string;
}

export const games: readonly GameEntry[] = [
  {
    slug: 'dados',
    name: 'Dados y Tapitas',
    icon: 'dice',
    theme: 'dados',
    age: '4–7 años',
    skill: 'Contar y operar',
    minutes: [5, 10],
    status: 'coming',
    description: 'Dados, tapitas y cuentas para resolver.',
  },
  {
    slug: 'memoria',
    name: 'Memo Colores',
    icon: 'palette',
    theme: 'memoria',
    age: '3–7 años',
    skill: 'Memoria visual',
    minutes: [5, 10],
    status: 'coming',
    description: 'Mira, recuerda y encuentra la secuencia.',
  },
  {
    slug: 'miradas',
    name: 'Miradas',
    icon: 'eye',
    theme: 'miradas',
    age: '3–5 años',
    skill: 'Atención compartida',
    minutes: [5, 5],
    status: 'coming',
    description: 'Un juego tranquilo para mirar y compartir.',
  },
  {
    slug: 'mira-y-dime',
    name: 'Mira y Dime',
    icon: 'bubbles',
    theme: 'mira-y-dime',
    age: '3–7 años',
    skill: 'Lenguaje y sílabas',
    minutes: [5, 10],
    status: 'coming',
    description: 'Arma sílabas, palabras y frases con lo que ves.',
  },
];

export const visibleGames = games.filter((game) => game.status !== 'hidden');

export function findGame(slug: string): GameEntry | undefined {
  return games.find((game) => game.slug === slug);
}
