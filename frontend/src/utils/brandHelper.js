const brandNormalizedMap = {
  'bayer': { name: 'Bayer', emoji: '🔬' },
  'syngenta': { name: 'Syngenta', emoji: '🌸' },
  'basf': { name: 'BASF', emoji: '⚗️' },
  'coromandel': { name: 'Coromandel', emoji: '🌾' },
  'upl': { name: 'UPL', emoji: '🧫' },
  'rallis': { name: 'Rallis', emoji: '🪴' },
  'dhanuka': { name: 'Dhanuka', emoji: '🚁' },
  'parijat': { name: 'Parijat', emoji: '🌺' },
  'godrej': { name: 'Godrej', emoji: '🏡' },
  'pi': { name: 'PI', emoji: '🔭' },
  'fmc': { name: 'FMC', emoji: '🛡️' },
  'dupont': { name: 'Dupont', emoji: '💎' },
  'iffco': { name: 'IFFCO', emoji: '⚖️' },
  'multiplex': { name: 'Multiplex', emoji: '🌿' },
  'sumitomo': { name: 'Sumitomo', emoji: '🌊' },
  'sumitomo chemical': { name: 'Sumitomo', emoji: '🌊' },
  'dow': { name: 'Dow', emoji: '🧬' }
};

export function getNormalizedBrand(rawBrand) {
  if (!rawBrand) return null;
  const clean = rawBrand.trim();
  const lower = clean.toLowerCase();
  if (brandNormalizedMap[lower]) {
    return brandNormalizedMap[lower];
  }
  // Fallback formatting: Title Case
  const formattedName = clean
    .split(/\s+/)
    .map(word => {
      if (word.length <= 4 && word === word.toUpperCase()) return word;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
  return {
    name: formattedName,
    emoji: '🏷️'
  };
}
