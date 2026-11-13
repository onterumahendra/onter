const forbiddenCharacters = new Set(['\\', '/', '?', '*', '[', ']', ':']);

function truncateSheetName(name: string, limit: number): string {
  let result = '';
  let length = 0;

  for (const character of name) {
    if (length + character.length > limit) break;
    result += character;
    length += character.length;
  }

  return result.trim();
}

export function sanitizeSheetName(name: string, usedNames: Set<string> = new Set()): string {
  const cleaned = Array.from(name)
    .filter((character) => !forbiddenCharacters.has(character) && character.charCodeAt(0) >= 32)
    .join('')
    .replace(/\s+/g, ' ')
    .replace(/^'+|'+$/g, '')
    .trim();
  const baseName = truncateSheetName(cleaned || 'Sheet', 31);

  let finalName = baseName;
  let counter = 1;
  while (Array.from(usedNames).some((usedName) => usedName.toLowerCase() === finalName.toLowerCase())) {
    const suffix = `_${counter}`;
    finalName = `${truncateSheetName(baseName, 31 - suffix.length)}${suffix}`;
    counter++;
  }

  usedNames.add(finalName);
  return finalName;
}
