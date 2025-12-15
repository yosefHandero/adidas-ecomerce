import { OutfitVariation } from './types';

/**
 * Image search result from Unsplash/Pexels
 */
export interface OutfitImage {
  id: string;
  url: string;
  thumbnail: string;
  photographer?: string;
  photographerUrl?: string;
  description?: string;
}

/**
 * Build search query from outfit variation
 */
function buildSearchQuery(variation: OutfitVariation): string {
  // Combine item descriptions and search terms
  const searchTerms = variation.items
    .map(item => item.shopping_search_terms || item.description)
    .join(' ');
  
  // Add occasion and style context
  const context = `${variation.name} style ${searchTerms} outfit fashion`;
  
  return context.trim();
}

/**
 * Search for outfit images using Unsplash API
 */
export async function searchOutfitImages(
  variation: OutfitVariation,
  count: number = 3
): Promise<OutfitImage[]> {
  const query = buildSearchQuery(variation);
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  
  if (!accessKey) {
    // Fallback: Use Unsplash Source API (no key required, but limited)
    return searchUnsplashSource(query, count);
  }

  try {
    // Create abort controller for timeout (10 seconds)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${count}&orientation=portrait`,
        {
          headers: {
            'Authorization': `Client-ID ${accessKey}`,
          },
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Unsplash API error: ${response.status}`);
      }

      const data = await response.json() as {
        results: Array<{
          id: string;
          urls: { regular: string; thumb: string };
          user: { name: string; links: { html: string } };
          description?: string;
          alt_description?: string;
        }>;
      };
      
      return data.results.map((photo) => ({
        id: photo.id,
        url: photo.urls.regular,
        thumbnail: photo.urls.thumb,
        photographer: photo.user.name,
        photographerUrl: photo.user.links.html,
        description: photo.description || photo.alt_description,
      }));
    } catch (fetchError: unknown) {
      clearTimeout(timeoutId);
      const err = fetchError as Error & { name?: string };
      if (err.name === 'AbortError') {
        console.warn('Unsplash API request timed out after 10s');
      } else {
        throw fetchError;
      }
      // Fallback to Unsplash Source on timeout/error
      return searchUnsplashSource(query, count);
    }
  } catch (error) {
    console.error('Unsplash API error:', error);
    // Fallback to Unsplash Source
    return searchUnsplashSource(query, count);
  }
}

/**
 * Fallback: Use Unsplash Source API (no authentication required)
 * Note: This is a basic fallback. For production, use proper API keys.
 */
async function searchUnsplashSource(query: string, count: number): Promise<OutfitImage[]> {
  const images: OutfitImage[] = [];
  
  // Extract key terms from query for better image matching
  const keyTerms = query
    .toLowerCase()
    .split(' ')
    .filter(term => 
      !['style', 'outfit', 'fashion', 'wear', 'wearing'].includes(term)
    )
    .slice(0, 3)
    .join(',');
  
  // Use Unsplash Source with fashion/outfit context
  const searchTerms = keyTerms || 'fashion outfit';
  
  for (let i = 0; i < count; i++) {
    images.push({
      id: `unsplash-source-${i}-${Date.now()}`,
      url: `https://source.unsplash.com/600x800/?${encodeURIComponent(searchTerms)},fashion&sig=${i}`,
      thumbnail: `https://source.unsplash.com/300x400/?${encodeURIComponent(searchTerms)},fashion&sig=${i}`,
      description: `Outfit inspiration: ${searchTerms}`,
    });
  }
  
  return images;
}

/**
 * Alternative: Use Pexels API (if available)
 */
export async function searchPexelsImages(
  variation: OutfitVariation,
  count: number = 3
): Promise<OutfitImage[]> {
  const query = buildSearchQuery(variation);
  const apiKey = process.env.PEXELS_API_KEY;
  
  if (!apiKey) {
    return searchOutfitImages(variation, count); // Fallback to Unsplash
  }

  try {
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${count}&orientation=portrait`,
      {
        headers: {
          'Authorization': apiKey,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Pexels API error: ${response.status}`);
    }

    const data = await response.json() as {
      photos: Array<{
        id: number;
        src: { large: string; medium: string };
        photographer: string;
        photographer_url: string;
        alt?: string;
      }>;
    };
    
    return data.photos.map((photo) => ({
      id: photo.id.toString(),
      url: photo.src.large,
      thumbnail: photo.src.medium,
      photographer: photo.photographer,
      photographerUrl: photo.photographer_url,
      description: photo.alt,
    }));
  } catch (error) {
    console.error('Pexels API error:', error);
    return searchOutfitImages(variation, count); // Fallback to Unsplash
  }
}

