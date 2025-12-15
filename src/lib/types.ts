export type Occasion = 'Street' | 'Work' | 'Gym' | 'Date' | 'Travel';

export type Fit = 'Slim' | 'Regular' | 'Oversized';

export type Weather = 'Warm' | 'Cold' | 'Rain';

export type Budget = '$' | '$$' | '$$$';

export interface UserItem {
  id: string;
  description: string;
  imageUrl?: string;
}

export interface OutfitItem {
  item_type: string;
  description: string;
  color: string;
  material?: string;
  style_tags: string[];
  why_it_matches: string;
  shopping_search_terms: string;
  body_zone: 'head' | 'torso' | 'legs' | 'feet' | 'accessories';
}

export interface OutfitVariation {
  name: 'Minimal' | 'Street' | 'Elevated';
  items: OutfitItem[];
  color_palette: string[];
  styling_notes: {
    do: string[];
    dont: string[];
  };
}

export interface OutfitResponse {
  variations: OutfitVariation[];
}

export interface OutfitPreferences {
  occasion: Occasion;
  vibe: number; // 0-100 (Minimal ↔ Bold)
  fit: Fit;
  weather: Weather;
  budget: Budget;
}

// API Response types
export interface ImageSearchResponse {
  images: Array<{
    id: string;
    url: string;
    thumbnail: string;
    photographer?: string;
    photographerUrl?: string;
    description?: string;
  }>;
}

// UI State types
export type UIState = 'empty' | 'loading' | 'hasItems' | 'error';

