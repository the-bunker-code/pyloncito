const STRONG_VOWELS = new Set(['a', 'e', 'o', 'á', 'é', 'ó', 'í', 'ú']);
const WEAK_VOWELS = new Set(['i', 'u', 'ü']);
const VOWELS = new Set([...STRONG_VOWELS, ...WEAK_VOWELS]);

const INSEPARABLE = new Set([
  'pr',
  'br',
  'tr',
  'dr',
  'cr',
  'gr',
  'fr',
  'pl',
  'bl',
  'cl',
  'gl',
  'fl',
  'kr',
  'kl',
]);

interface Token {
  text: string;
  vowel: boolean;
  strong: boolean;
}

export function capitalize(text: string): string {
  return text ? text[0]!.toUpperCase() + text.slice(1) : text;
}

export function isSpanishWord(text: string): boolean {
  return /^[a-záéíóúüñ]+$/.test(text);
}

export function normalizeWord(text: string): string {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/^[^a-záéíóúüñ]+|[^a-záéíóúüñ]+$/g, '');
}

function tokenize(word: string): Token[] {
  const tokens: Token[] = [];
  for (let i = 0; i < word.length; i++) {
    const char = word[i]!;
    const next = word[i + 1] ?? '';
    const afterNext = word[i + 2] ?? '';
    const pair = char + next;
    if (pair === 'ch' || pair === 'll' || pair === 'rr' || pair === 'qu') {
      tokens.push({ text: pair, vowel: false, strong: false });
      i++;
    } else if (pair === 'gu' && 'eiéí'.includes(afterNext)) {
      tokens.push({ text: pair, vowel: false, strong: false });
      i++;
    } else if (char === 'y') {
      const isVowel = i > 0 && (!next || !VOWELS.has(next));
      tokens.push({ text: char, vowel: isVowel, strong: false });
    } else {
      tokens.push({ text: char, vowel: VOWELS.has(char), strong: STRONG_VOWELS.has(char) });
    }
  }
  return tokens;
}

export function syllabify(rawWord: string): string[] {
  const word = normalizeWord(rawWord);
  const tokens = tokenize(word);
  const nuclei: Array<{ start: number; end: number }> = [];

  for (let i = 0; i < tokens.length; i++) {
    if (!tokens[i]!.vowel) continue;
    const last = nuclei[nuclei.length - 1];
    const previous = tokens[i - 1];
    if (last && last.end === i - 1 && previous?.vowel && !(previous.strong && tokens[i]!.strong)) {
      last.end = i;
    } else {
      nuclei.push({ start: i, end: i });
    }
  }
  if (nuclei.length === 0) return word ? [word] : [];

  const starts = [0];
  for (let n = 1; n < nuclei.length; n++) {
    const from = nuclei[n - 1]!.end + 1;
    const to = nuclei[n]!.start;
    const consonants = tokens.slice(from, to).map((token) => token.text);
    const count = consonants.length;
    const lastTwo = consonants.slice(-2).join('');
    let split: number;
    if (count <= 1) split = from;
    else if (count === 2) split = INSEPARABLE.has(lastTwo) ? from : from + 1;
    else split = INSEPARABLE.has(lastTwo) ? to - 2 : to - 1;
    starts.push(split);
  }

  return starts.map((start, i) => {
    const end = starts[i + 1] ?? tokens.length;
    return tokens
      .slice(start, end)
      .map((token) => token.text)
      .join('');
  });
}

/**
 * Splits into individual letters, including both letters of ll, rr and ch.
 * ñ and accented vowels stay as one unit. The rule is documented by tests in
 * `tests/unit/mira-y-dime.spanish.test.ts`.
 */
export function splitLetters(rawWord: string): string[] {
  return [...normalizeWord(rawWord)];
}

export function splitWords(phrase: string): string[] {
  return String(phrase).toLowerCase().split(/\s+/).map(normalizeWord).filter(Boolean);
}
