import path from "node:path";
import { fileURLToPath } from "node:url";
import { mkdir, readdir, stat } from "node:fs/promises";
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

const landingInputDir = path.join(publicDir, "landing-icons");
const landingOutputDir = path.join(publicDir, "landing-icons-opt");
await mkdir(landingOutputDir, { recursive: true });

const landingIcons = (await readdir(landingInputDir)).filter((name) => name.endsWith(".webp"));
for (const iconName of landingIcons) {
  const input = path.join(landingInputDir, iconName);
  const output = path.join(landingOutputDir, iconName);

  const src = sharp(input, { failOn: "none" });
  const metadata = await src.metadata();
  if (!metadata.width || !metadata.height) {
    throw new Error(`Could not read image dimensions for ${iconName}`);
  }

  await src
    .resize({
      width: 256,
      height: 256,
      fit: "inside",
      withoutEnlargement: true,
      kernel: "lanczos3",
    })
    .webp({
      quality: 72,
      alphaQuality: 100,
      effort: 6,
      nearLossless: false,
    })
    .toFile(output);

  const [{ size: inSize }, { size: outSize }] = await Promise.all([stat(input), stat(output)]);
  const saved = inSize > 0 ? (((inSize - outSize) / inSize) * 100).toFixed(1) : "0.0";
  console.log(
    `landing-icons/${iconName} -> landing-icons-opt/${iconName} | ${formatSize(inSize)} -> ${formatSize(outSize)} | -${saved}%`
  );
}
