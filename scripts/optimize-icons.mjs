import path from "node:path";
import { fileURLToPath } from "node:url";
import { stat } from "node:fs/promises";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, "..", "public");

const assets = [
  { name: "Adventure.png", max: 96, quality: 86 },
  { name: "Animal_Welfare.png", max: 96, quality: 86 },
  { name: "Cultural.png", max: 96, quality: 86 },
  { name: "Edu.png", max: 96, quality: 86 },
  { name: "Environmental_.png", max: 96, quality: 86 },
  { name: "Exploration.png", max: 96, quality: 86 },
  { name: "Marine_Adventure.png", max: 96, quality: 86 },
  { name: "Social_.png", max: 96, quality: 86 },
  { name: "Sports_&_Recreational_.png", max: 96, quality: 86 },
  { name: "Wildlife_Adventure.png", max: 96, quality: 86 },
  { name: "nav-needle.png", max: 512, quality: 90 },
];

const formatSize = (bytes) => `${(bytes / 1024).toFixed(1)} KB`;

for (const asset of assets) {
  const input = path.join(publicDir, asset.name);
  const output = path.join(publicDir, asset.name.replace(/\.png$/i, ".webp"));

  const src = sharp(input, { failOn: "none" });
  const metadata = await src.metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error(`Could not read image dimensions for ${asset.name}`);
  }

  const needsResize = metadata.width > asset.max || metadata.height > asset.max;

  let pipeline = src;
  if (needsResize) {
    pipeline = pipeline.resize({
      width: asset.max,
      height: asset.max,
      fit: "inside",
      withoutEnlargement: true,
      kernel: "lanczos3",
    });
  }

  await pipeline
    .webp({
      quality: asset.quality,
      alphaQuality: 100,
      effort: 5,
      nearLossless: false,
    })
    .toFile(output);

  const [before, after] = await Promise.all([
    sharp(input).metadata(),
    sharp(output).metadata(),
  ]);

  const [{ size: inSize }, { size: outSize }] = await Promise.all([stat(input), stat(output)]);

  const inBytes = Number(inSize);
  const outBytes = Number(outSize);
  const saved = inBytes > 0 ? (((inBytes - outBytes) / inBytes) * 100).toFixed(1) : "0.0";

  console.log(
    `${asset.name} (${before.width}x${before.height}) -> ${path.basename(output)} (${after.width}x${after.height}) | ${formatSize(inBytes)} -> ${formatSize(outBytes)} | -${saved}%`
  );
}
