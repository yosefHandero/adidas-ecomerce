/**
 * Generates AI inpainting masks for mannequin base images.
 *
 * White = regions the AI may modify (clothing placement).
 * Black = regions that must remain unchanged (face, neck, hands, legs, background).
 *
 * Regions (white only):
 * - Head: top of head + slight halo (hats/caps/beanies)
 * - Torso: torso + upper arms (shirts/tops)
 * - Feet: feet + small ankle (shoes/sneakers/boots)
 *
 * Output: Grayscale PNG, same size as base image, 2–6px feathered edges.
 *
 * Run: npm run generate-masks
 */

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const FEATHER_SIGMA = 3; // ~3px Gaussian blur for soft 2–6px feather

function inEllipse(x, y, cx, cy, rx, ry) {
  return (x - cx) ** 2 / rx ** 2 + (y - cy) ** 2 / ry ** 2 <= 1;
}

/**
 * Create mask buffer for given dimensions.
 * Only clothing areas are white; face, neck, hands, legs, background stay black.
 */
function createMaskBuffer(width, height) {
  const buf = Buffer.alloc(width * height, 0);
  const cx = width / 2;

  // --- Head (hats/caps/beanies): top of head + slight halo only ---
  const headCenterY = Math.round(height * 0.10);
  const headRx = Math.round(width * 0.14);
  const headRy = Math.round(height * 0.09);

  // --- Torso (shirts/tops): torso + upper arms only ---
  const torsoCenterY = Math.round(height * 0.37);
  const torsoRx = Math.round(width * 0.28);
  const torsoRy = Math.round(height * 0.165);

  // --- Feet (shoes): feet + small ankle only ---
  const feetCenterY = Math.round(height * 0.92);
  const feetRx = Math.round(width * 0.26);
  const feetRy = Math.round(height * 0.08);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const inHead = inEllipse(x, y, cx, headCenterY, headRx, headRy);
      const inTorso = inEllipse(x, y, cx, torsoCenterY, torsoRx, torsoRy);
      const inFeet = inEllipse(x, y, cx, feetCenterY, feetRx, feetRy);
      if (inHead || inTorso || inFeet) buf[i] = 255;
    }
  }

  return buf;
}

/**
 * Generate and write a single mask from a base image path.
 * Mask dimensions match the base image exactly.
 */
async function generateMaskForBase(basePath, maskPath) {
  const meta = await sharp(basePath).metadata();
  const width = meta.width;
  const height = meta.height;
  if (!width || !height) {
    throw new Error(`Could not read dimensions from ${basePath}`);
  }

  const rawMask = createMaskBuffer(width, height);
  const feathered = await sharp(rawMask, {
    raw: { width, height, channels: 1 },
  })
    .blur(FEATHER_SIGMA)
    .png()
    .toBuffer();

  fs.writeFileSync(maskPath, feathered);
  return { width, height };
}

async function run() {
  const publicDir = path.join(__dirname, "..", "public");
  const bases = [
    { base: "man_base.png", mask: "man_base_mask.png", label: "man_base" },
    { base: "woman_base.png", mask: "woman_base_mask.png", label: "woman_base" },
  ];

  console.log("Inpainting masks generated:");
  for (const { base, mask, label } of bases) {
    const basePath = path.join(publicDir, base);
    const maskPath = path.join(publicDir, mask);
    if (!fs.existsSync(basePath)) {
      throw new Error(`Base image not found: ${basePath}`);
    }
    const { width, height } = await generateMaskForBase(basePath, maskPath);
    console.log("  - public/%s (%d x %d)", mask, width, height);
  }
  console.log("  Feathered edges: sigma = %d px", FEATHER_SIGMA);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
