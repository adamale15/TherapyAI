// Not a substitute for professional triage; just a simple content flag.
const CRISIS_WORDS = [
  "kill myself",
  "suicide",
  "end my life",
  "want to die",
  "self harm",
  "hurt myself",
  "can't go on",
];

export function detectCrisis(text: string): boolean {
  const t = text.toLowerCase();
  return CRISIS_WORDS.some((w) => t.includes(w));
}

export function crisisResponse(): string {
  return `I’m really sorry you’re feeling this way. Your safety matters.
If you’re in immediate danger, please contact local emergency services right now, or reach out to a trusted person nearby.
If you want, we can talk through what you’re feeling in this moment and what might help you feel just a little safer.`;
}
