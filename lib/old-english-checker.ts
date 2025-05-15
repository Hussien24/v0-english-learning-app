// Database of Old English/archaic words
// This is a simplified list - in a production app, this would be much more extensive
// or potentially fetched from an external API
export const oldEnglishWords: Record<string, string> = {
  anon: "soon, shortly",
  apothecary: "pharmacist, druggist",
  aught: "anything at all",
  beseech: "to beg, implore",
  betwixt: "between",
  bodkin: "a small dagger",
  boon: "a favor, request",
  bough: "a tree branch",
  bourn: "a boundary, limit",
  breeches: "trousers",
  brethren: "brothers",
  chide: "to scold, rebuke",
  comely: "attractive, pleasing",
  doth: "does",
  ere: "before",
  fain: "gladly, willingly",
  forsooth: "in truth, indeed",
  forthwith: "immediately",
  fro: "from",
  gadzooks: "an exclamation of surprise",
  hark: "listen",
  hath: "has",
  hearken: "to listen",
  henceforth: "from now on",
  hither: "to this place",
  mayhap: "perhaps, maybe",
  methinks: "it seems to me",
  nary: "not one",
  nigh: "near",
  oft: "often",
  perchance: "perhaps",
  prithee: "please",
  quoth: "said",
  saith: "says",
  thence: "from there",
  thither: "to that place",
  thou: "you (singular)",
  thy: "your",
  verily: "truly",
  wherefore: "why",
  whither: "to where",
  woe: "great sorrow",
  wrought: "worked, created",
  ye: "you (plural)",
  yea: "yes",
  yon: "that (over there)",
  yonder: "over there",
}

// Additional words that are not strictly Old English but are considered archaic or dated
export const archaicWords: Record<string, string> = {
  alas: "expression of grief or pity",
  alack: "expression of sorrow",
  anent: "concerning, about",
  behest: "command, order",
  behoove: "to be necessary or proper",
  belabor: "to explain excessively",
  besmirch: "to soil, stain",
  bygone: "past, former",
  erstwhile: "former, previous",
  fain: "gladly, willingly",
  forsake: "to abandon, renounce",
  fortnight: "two weeks",
  gramercy: "many thanks",
  haply: "by chance, perhaps",
  heretofore: "up to now",
  howbeit: "nevertheless",
  lest: "for fear that",
  lo: "look, see",
  morrow: "the next day",
  naught: "nothing",
  peradventure: "perhaps",
  perforce: "necessarily",
  sans: "without",
  sooth: "truth",
  spake: "spoke",
  surcease: "to stop",
  thrice: "three times",
  twain: "two",
  whence: "from where",
  whereat: "at which",
  whilst: "while",
  withal: "in addition",
  wont: "accustomed",
  yesteryear: "last year",
}

// Combined list for easier checking
export const allOldWords = { ...oldEnglishWords, ...archaicWords }

/**
 * Check if a word is considered Old English or archaic
 * @param word The word to check
 * @returns An object with information about the word's status
 */
export function checkOldEnglishWord(word: string): {
  isOldEnglish: boolean
  isArchaic: boolean
  meaning?: string
  category?: string
} {
  // Normalize the word (lowercase, trim)
  const normalizedWord = word.toLowerCase().trim()

  // Check if it's in the Old English list
  if (normalizedWord in oldEnglishWords) {
    return {
      isOldEnglish: true,
      isArchaic: true,
      meaning: oldEnglishWords[normalizedWord],
      category: "Old English",
    }
  }

  // Check if it's in the archaic list
  if (normalizedWord in archaicWords) {
    return {
      isOldEnglish: false,
      isArchaic: true,
      meaning: archaicWords[normalizedWord],
      category: "Archaic",
    }
  }

  // Check for compound words or phrases
  const words = normalizedWord.split(/\s+/)
  if (words.length > 1) {
    for (const singleWord of words) {
      if (singleWord in allOldWords) {
        return {
          isOldEnglish: singleWord in oldEnglishWords,
          isArchaic: true,
          meaning: allOldWords[singleWord],
          category: singleWord in oldEnglishWords ? "Old English" : "Archaic",
        }
      }
    }
  }

  // Not found in any list
  return {
    isOldEnglish: false,
    isArchaic: false,
  }
}

/**
 * Check if a text contains any Old English or archaic words
 * @param text The text to check
 * @returns An array of found old/archaic words with their information
 */
export function findOldEnglishWords(text: string): Array<{
  word: string
  isOldEnglish: boolean
  isArchaic: boolean
  meaning?: string
  category?: string
}> {
  // Split the text into words
  const words = text.toLowerCase().match(/\b\w+\b/g) || []
  const results = []

  // Check each word
  for (const word of words) {
    const result = checkOldEnglishWord(word)
    if (result.isArchaic) {
      results.push({
        word,
        ...result,
      })
    }
  }

  return results
}
