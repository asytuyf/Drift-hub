// Wger Exercise API client (free, open source, no API key required)
// Docs: https://wger.de/en/software/api

const WGER_API_URL = "https://wger.de/api/v2";
const WGER_BASE_URL = "https://wger.de";

export interface WgerExercise {
  id: number;
  name: string;
  category: string;
  image: string | null;
  imageThumbnail: string | null;
}

// In-memory cache to avoid repeated API calls
const exerciseCache = new Map<string, WgerExercise | null>();

export async function searchExercise(name: string): Promise<WgerExercise | null> {
  const normalizedName = name.toLowerCase().trim();

  // Check cache first
  if (exerciseCache.has(normalizedName)) {
    return exerciseCache.get(normalizedName) || null;
  }

  try {
    const response = await fetch(
      `${WGER_API_URL}/exercise/search/?term=${encodeURIComponent(normalizedName)}&language=2`,
      {
        next: { revalidate: 86400 }, // Cache for 24 hours
      }
    );

    if (!response.ok) {
      console.error("Wger API error:", response.status);
      exerciseCache.set(normalizedName, null);
      return null;
    }

    const data = await response.json();

    if (!data.suggestions || data.suggestions.length === 0) {
      exerciseCache.set(normalizedName, null);
      return null;
    }

    // Find the best match (preferably one with an image)
    const withImage = data.suggestions.find((s: { data: { image: string | null } }) => s.data.image);
    const bestMatch = withImage || data.suggestions[0];

    const exercise: WgerExercise = {
      id: bestMatch.data.id,
      name: bestMatch.value,
      category: bestMatch.data.category || "",
      image: bestMatch.data.image ? `${WGER_BASE_URL}${bestMatch.data.image}` : null,
      imageThumbnail: bestMatch.data.image_thumbnail
        ? `${WGER_BASE_URL}${bestMatch.data.image_thumbnail}`
        : null,
    };

    exerciseCache.set(normalizedName, exercise);
    return exercise;
  } catch (error) {
    console.error("Failed to fetch exercise:", error);
    exerciseCache.set(normalizedName, null);
    return null;
  }
}

// Batch fetch multiple exercises
export async function searchExercises(
  names: string[]
): Promise<Map<string, WgerExercise | null>> {
  const results = new Map<string, WgerExercise | null>();

  // Filter out already cached exercises
  const uncachedNames = names.filter((name) => {
    const normalized = name.toLowerCase().trim();
    if (exerciseCache.has(normalized)) {
      results.set(normalized, exerciseCache.get(normalized) || null);
      return false;
    }
    return true;
  });

  // Fetch uncached exercises (with small delay to be nice to the API)
  for (const name of uncachedNames) {
    const exercise = await searchExercise(name);
    results.set(name.toLowerCase().trim(), exercise);
    // Small delay to avoid hammering the API
    if (uncachedNames.indexOf(name) < uncachedNames.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  return results;
}
