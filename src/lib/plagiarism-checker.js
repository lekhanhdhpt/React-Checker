// Sample sources for plagiarism detection
const SAMPLE_SOURCES = [
  {
    name: "Wikipedia - Artificial Intelligence",
    content:
      "Artificial intelligence is intelligence demonstrated by machines, in contrast to the natural intelligence displayed by humans and animals. Leading AI textbooks define the field as the study of intelligent agents.",
  },
  {
    name: "Academic Journal - Climate Change",
    content:
      "Climate change refers to long-term shifts in temperatures and weather patterns. These shifts may be natural, but since the 1800s, human activities have been the main driver of climate change.",
  },
  {
    name: "Research Paper - Machine Learning",
    content:
      "Machine learning is a method of data analysis that automates analytical model building. It is a branch of artificial intelligence based on the idea that systems can learn from data, identify patterns and make decisions.",
  },
  {
    name: "Encyclopedia - Quantum Computing",
    content:
      "Quantum computing is a type of computation that harnesses the collective properties of quantum states, such as superposition, interference, and entanglement, to perform calculations.",
  },
  {
    name: "Scientific Article - Renewable Energy",
    content:
      "Renewable energy is energy that is collected from renewable resources that are naturally replenished on a human timescale. It includes sources such as sunlight, wind, rain, tides, waves, and geothermal heat.",
  },
];

// Calculate similarity between two strings using a simple algorithm
function calculateSimilarity(str1, str2) {
  const words1 = str1.toLowerCase().split(/\s+/);
  const words2 = str2.toLowerCase().split(/\s+/);

  let matchCount = 0;
  const minLength = Math.min(words1.length, words2.length);

  for (let i = 0; i < minLength; i++) {
    if (words1[i] === words2[i]) {
      matchCount++;
    }
  }

  return (matchCount / Math.max(words1.length, words2.length)) * 100;
}

// Find matching phrases between text and source
function findMatches(text, source) {
  const matches = [];
  const textLower = text.toLowerCase();
  const sourceLower = source.content.toLowerCase();

  // Look for matching phrases (5+ consecutive words)
  const textWords = textLower.split(/\s+/);
  const sourceWords = sourceLower.split(/\s+/);

  for (let i = 0; i < textWords.length - 4; i++) {
    for (let j = 0; j < sourceWords.length - 4; j++) {
      let matchLength = 0;

      while (
        i + matchLength < textWords.length &&
        j + matchLength < sourceWords.length &&
        textWords[i + matchLength] === sourceWords[j + matchLength]
      ) {
        matchLength++;
      }

      // If we found a match of 5+ words
      if (matchLength >= 5) {
        const matchedWords = textWords.slice(i, i + matchLength);
        const matchText = matchedWords.join(" ");

        // Find the actual position in the original text
        const startIndex = text.toLowerCase().indexOf(matchText);
        const endIndex = startIndex + matchText.length;

        if (startIndex !== -1) {
          matches.push({
            text: text.substring(startIndex, endIndex),
            source: source.name,
            similarity: 100,
            startIndex,
            endIndex,
          });

          // Skip ahead to avoid overlapping matches
          i += matchLength - 1;
          break;
        }
      }
    }
  }

  return matches;
}

// Main plagiarism checking function
export async function checkPlagiarism(text) {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 2000));

  const allMatches = [];

  // Check against all sources
  for (const source of SAMPLE_SOURCES) {
    const matches = findMatches(text, source);
    allMatches.push(...matches);
  }

  // Sort matches by position in text
  allMatches.sort((a, b) => a.startIndex - b.startIndex);

  // Calculate overall statistics
  const totalWords = text.split(/\s+/).length;
  let plagiarizedWords = 0;

  // Count unique plagiarized words
  const plagiarizedRanges = allMatches.map((match) => ({
    start: match.startIndex,
    end: match.endIndex,
  }));

  // Merge overlapping ranges
  const mergedRanges = [];
  let currentRange = plagiarizedRanges[0];

  for (let i = 1; i < plagiarizedRanges.length; i++) {
    const range = plagiarizedRanges[i];
    if (range.start <= currentRange.end) {
      // Overlapping, merge
      currentRange.end = Math.max(currentRange.end, range.end);
    } else {
      // Not overlapping, save current and start new
      mergedRanges.push(currentRange);
      currentRange = range;
    }
  }

  if (currentRange) {
    mergedRanges.push(currentRange);
  }

  // Count words in merged ranges
  for (const range of mergedRanges) {
    const rangeText = text.substring(range.start, range.end);
    const words = rangeText.split(/\s+/).filter((w) => w.length > 0);
    plagiarizedWords += words.length;
  }

  const plagiarizedPercentage = totalWords > 0 ? (plagiarizedWords / totalWords) * 100 : 0;
  const originalPercentage = 100 - plagiarizedPercentage;

  return {
    overallSimilarity: plagiarizedPercentage,
    originalPercentage: Math.max(0, originalPercentage),
    plagiarizedPercentage: Math.min(100, plagiarizedPercentage),
    matches: allMatches,
    analyzedText: text,
  };
}
