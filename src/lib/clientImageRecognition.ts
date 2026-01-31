/**
 * Client-side image recognition using TensorFlow.js + MobileNet.
 * Used as a fallback when the server /api/recognize-image fails or returns no useful description.
 * Runs entirely in the browser - no API key required.
 */

/** Keywords that indicate the ImageNet class is clothing/footwear (we only accept these) */
const CLOTHING_KEYWORDS = [
  "shoe",
  "sneaker",
  "boot",
  "sandal",
  "heel",
  "loafer",
  "cleat",
  "trainer",
  "footwear",
  "slipper",
  "pant",
  "jean",
  "trouser",
  "short",
  "skirt",
  "dress",
  "shirt",
  "top",
  "jacket",
  "coat",
  "blazer",
  "hoodie",
  "sweater",
  "cardigan",
  "jersey",
  "hat",
  "cap",
  "beanie",
  "bag",
  "backpack",
  "belt",
  "watch",
  "jewelry",
  "necklace",
  "bracelet",
  "scarf",
  "glasses",
  "sunglasses",
  "vest",
  "jumpsuit",
  "sweatshirt",
] as const;

const MIN_PROBABILITY = 0.15;
const TOP_K = 5;

function isClothingClass(className: string): boolean {
  const lower = className.toLowerCase();
  return CLOTHING_KEYWORDS.some((kw) => lower.includes(kw));
}

function toDisplayDescription(className: string): string {
  // Use the first part before a comma (e.g. "running shoe, sneaker" -> "Running shoe")
  const main = className.split(",")[0].trim();
  return main.charAt(0).toUpperCase() + main.slice(1).toLowerCase();
}

export interface ClientRecognitionResult {
  description: string;
}

/**
 * Recognize clothing/footwear in an image using the browser's TensorFlow.js + MobileNet.
 * Only returns a result when the model predicts a clothing-related class with sufficient confidence.
 * Use when /api/recognize-image fails or returns "clothing item".
 *
 * @param imageDataUrl - Data URL of the image (e.g. from paste or file input)
 * @returns Recognized description, or null if no clothing detected
 */
export async function recognizeImageClient(
  imageDataUrl: string
): Promise<ClientRecognitionResult | null> {
  if (typeof window === "undefined") return null;

  try {
    // Load tfjs first so WebGL/CPU backend is registered for mobilenet
    await import("@tensorflow/tfjs");
    const mobilenet = await import("@tensorflow-models/mobilenet");
    const model = await mobilenet.load();
    const img = await loadImage(imageDataUrl);
    const predictions = await model.classify(img, TOP_K);

    for (const p of predictions) {
      if (p.probability < MIN_PROBABILITY) continue;
      if (!isClothingClass(p.className)) continue;

      const description = toDisplayDescription(p.className);
      return { description };
    }
    return null;
  } catch (e) {
    console.warn("[ClientImageRecognition] Failed:", e);
    return null;
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = document.createElement("img");
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });
}
