const MAX_CHARS = 200;

export function splitTextTightly(text) {
  const normalized = text.trim().replace(/\s+/g, " ");

  if (normalized.length <= MAX_CHARS) return [normalized];

  let guess = Math.ceil(normalized.length / MAX_CHARS);
  let parts = [];

  while (true) {
    parts = splitIntoParts(normalized, guess);
    if (parts.length === guess) break;
    guess = parts.length;
  }

  return parts.map(
    (p, i) => `[Part ${i + 1} of ${parts.length}] ${p}`
  );
}

function splitIntoParts(text, totalGuess) {
  const words = text.split(" ");
  const parts = [];
  let i = 0;

  while (i < words.length) {
    const partNum = parts.length + 1;
    const prefix = `[Part ${partNum} of ${totalGuess}] `;
    const max = MAX_CHARS - prefix.length;

    let part = "";

    while (i < words.length) {
      const word = words[i];
      const next = part ? part + " " + word : word;

      if (next.length <= max) {
        part = next;
        i++;
      } else {
        break;
      }
    }

    parts.push(part);
  }

  return parts;
}