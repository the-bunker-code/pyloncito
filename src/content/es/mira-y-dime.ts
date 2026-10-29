import { common } from './common';

const buildLabel = 'Armemos';

function capitalize(text: string): string {
  return text ? text[0]!.toUpperCase() + text.slice(1) : text;
}

export const copy = {
  title: 'Mira y Dime',
  subtitle: 'Arma palabras y frases con lo que miras.',
  lead: 'Cuatro modos para mirar, escuchar y armar. Sin prisa y sin publicidad.',
  greeting: '¡Hola! ¿Jugamos?',
  adultNote: 'Juegos tranquilos para disfrutar con un adulto cerca.',
  modes: {
    letters: {
      name: 'Letras',
      subtitle: 'Arma la palabra',
      tips: [
        'Cada casilla muestra la letra tenue: ella busca la misma forma. No necesita saber leer.',
        'Di el sonido de la letra junto con la voz.',
        'En Avanzado no hay letra guía: úsalo cuando el nivel anterior le resulte fácil.',
      ],
    },
    syllables: {
      name: 'Sílabas',
      subtitle: 'pe · lo · ta',
      tips: [
        'Ella toca la sílaba que sigue y la pieza va a su lugar. La voz dice cada sílaba.',
        'Aplaudan juntos cada sílaba: “pe-lo-ta” son tres palmadas.',
        'Al final la voz dice “Ahora dilo tú”. Si lo dice (o lo intenta), toca “Lo dijo”.',
      ],
    },
    shortPhrase: {
      name: 'Frase corta',
      subtitle: 'Dos palabras',
      tips: [
        'La voz dice la frase completa primero: es el modelo que ella puede repetir.',
        'Cada pieza es una palabra. Señala el dibujo mientras la voz la nombra.',
      ],
    },
    longPhrase: {
      name: 'Frase larga',
      subtitle: 'Tres o cuatro palabras',
      tips: [
        'Frases de tres o cuatro palabras, como “el gato duerme”.',
        'Si se cansa, vuelve a Frase corta: lo importante es que termine contenta.',
      ],
    },
  },
  levels: {
    easy: { name: 'Principiante', hint: 'Para empezar' },
    medium: { name: 'Intermedio', hint: 'Un poco más' },
    hard: { name: 'Avanzado', hint: 'Reto' },
  },
  actions: {
    backHome: 'Volver al inicio',
    settings: 'Ajustes para adultos',
    repeat: 'Repetir la consigna',
    said: 'Lo dijo',
    next: 'Seguir',
    home: 'Inicio',
    again: 'Otra vez',
    save: 'Guardar y empezar',
    cancel: 'Cancelar',
  },
  settings: {
    title: 'Ajustes para adultos',
    mode: 'Modo',
    level: 'Nivel',
    rounds: 'Rondas por sesión',
    voice: 'Voz',
    sound: 'Sonidos',
    yes: 'Sí',
    no: 'No',
    note: 'Los cambios se guardan solo en este dispositivo.',
  },
  session: common.session,
  question: (mode: string, target: string): string =>
    mode === 'shortPhrase' || mode === 'longPhrase'
      ? `${capitalize(target)}.`
      : `${buildLabel} ${target}.`,
  result: (target: string): string => `¡${capitalize(target)}!`,
  voice: {
    hello: '¡Hola! ¿Jugamos?',
    build: buildLabel,
    almost: '¡Casi! Otra vez.',
    next: 'Esta sigue.',
    great: '¡Muy bien!',
    sayIt: 'Ahora dilo tú.',
    saidIt: '¡Muy bien dicho!',
    end: '¡Lo hicimos juntos!',
  },
  status: {
    look: 'Mira.',
    helping: 'Esta sigue.',
    saying: 'Ahora dilo tú.',
    answering: (placed: number, total: number) => `Van ${placed} de ${total}.`,
    slot: (position: number, value: string | null) =>
      value ? `Casilla ${position}, ${value}` : `Casilla ${position}, vacía`,
  },
  end: {
    title: '¡Lo hicimos juntos!',
    said: (said: number, total: number) => `Lo dijo en ${said} de ${total} rondas.`,
  },
  adult: {
    summary: 'Para el adulto',
    generalTips: [
      'Si elige mal, no digas “no”: tras dos intentos la voz muestra la pieza que sigue.',
      'Espera 5 segundos antes de ayudar.',
      'Celebra el intento: lo importante es que termine contenta.',
    ],
  },
  progressLabel: 'Rondas',
  roundCounter: (round: number, total: number) => `Ronda ${round} de ${total}`,
  starsLabel: (count: number) => `${count} estrellas`,
} as const;
