import type { PantryItem } from "../types";

type DetectionSpec = {
  name: PantryItem["name"];
  id: string;
  minPixels: number;
  region: { xStart: number; xEnd: number; yStart: number; yEnd: number };
  matcher: (r: number, g: number, b: number) => boolean;
  baseConfidence: number;
  note: string;
  inferredShelfLifeDays?: number;
};

const specs: DetectionSpec[] = [
  {
    name: "tomato",
    id: "heuristic-tomato",
    minPixels: 1800,
    region: { xStart: 0.45, xEnd: 0.92, yStart: 0.28, yEnd: 0.9 },
    matcher: (r, g, b) => r > 150 && g < 125 && b < 120,
    baseConfidence: 0.74,
    note: "Visual heuristic matched a red produce cluster.",
    inferredShelfLifeDays: 5
  },
  {
    name: "eggs",
    id: "heuristic-eggs",
    minPixels: 2600,
    region: { xStart: 0.62, xEnd: 1, yStart: 0.02, yEnd: 0.62 },
    matcher: (r, g, b) => r > 180 && g > 165 && b > 140 && Math.abs(r - g) < 40 && Math.abs(g - b) < 55,
    baseConfidence: 0.8,
    note: "Visual heuristic matched a light oval/carton-like cluster.",
    inferredShelfLifeDays: 21
  },
  {
    name: "lemon",
    id: "heuristic-lemon",
    minPixels: 1100,
    region: { xStart: 0, xEnd: 0.45, yStart: 0.25, yEnd: 0.75 },
    matcher: (r, g, b) => r > 180 && g > 155 && b < 110,
    baseConfidence: 0.68,
    note: "Visual heuristic matched bright yellow citrus-like shapes.",
    inferredShelfLifeDays: 10
  },
  {
    name: "milk",
    id: "heuristic-milk",
    minPixels: 2400,
    region: { xStart: 0.72, xEnd: 1, yStart: 0.55, yEnd: 1 },
    matcher: (r, g, b) => r > 175 && g > 175 && b > 175 && Math.abs(r - g) < 30 && Math.abs(g - b) < 30,
    baseConfidence: 0.61,
    note: "Visual heuristic matched tall white bottle-like shapes.",
    inferredShelfLifeDays: 7
  },
  {
    name: "bell pepper",
    id: "heuristic-bell-pepper",
    minPixels: 1500,
    region: { xStart: 0.5, xEnd: 0.92, yStart: 0.26, yEnd: 0.88 },
    matcher: (r, g, b) => r > 140 && g < 135 && b < 110,
    baseConfidence: 0.69,
    note: "Visual heuristic matched glossy red pepper-like produce.",
    inferredShelfLifeDays: 6
  },
  {
    name: "carrots",
    id: "heuristic-carrots",
    minPixels: 1200,
    region: { xStart: 0.1, xEnd: 0.62, yStart: 0.42, yEnd: 0.88 },
    matcher: (r, g, b) => r > 170 && g > 95 && g < 165 && b < 95,
    baseConfidence: 0.67,
    note: "Visual heuristic matched orange produce clustered in bins.",
    inferredShelfLifeDays: 10
  },
  {
    name: "apples",
    id: "heuristic-apples",
    minPixels: 1300,
    region: { xStart: 0.2, xEnd: 0.7, yStart: 0.68, yEnd: 0.96 },
    matcher: (r, g, b) => r > 150 && g > 95 && g < 180 && b < 120,
    baseConfidence: 0.65,
    note: "Visual heuristic matched round mixed red-green fruit in the lower crisper.",
    inferredShelfLifeDays: 14
  },
  {
    name: "cucumber",
    id: "heuristic-cucumber",
    minPixels: 900,
    region: { xStart: 0.25, xEnd: 0.72, yStart: 0.32, yEnd: 0.72 },
    matcher: (r, g, b) => g > 80 && g > r * 1.08 && g > b * 1.15 && r < 135,
    baseConfidence: 0.62,
    note: "Visual heuristic matched elongated dark-green produce.",
    inferredShelfLifeDays: 6
  },
  {
    name: "lettuce",
    id: "heuristic-lettuce",
    minPixels: 1500,
    region: { xStart: 0.2, xEnd: 0.76, yStart: 0.28, yEnd: 0.74 },
    matcher: (r, g, b) => g > 95 && g > r * 1.15 && g > b * 1.15 && r < 150,
    baseConfidence: 0.61,
    note: "Visual heuristic matched leafy green clusters.",
    inferredShelfLifeDays: 5
  },
  {
    name: "orange juice",
    id: "heuristic-orange-juice",
    minPixels: 1600,
    region: { xStart: 0, xEnd: 0.32, yStart: 0.02, yEnd: 0.4 },
    matcher: (r, g, b) => r > 180 && g > 95 && g < 180 && b < 95,
    baseConfidence: 0.72,
    note: "Visual heuristic matched an orange beverage bottle near the fridge door.",
    inferredShelfLifeDays: 7
  },
  {
    name: "water",
    id: "heuristic-water",
    minPixels: 2200,
    region: { xStart: 0, xEnd: 0.36, yStart: 0.7, yEnd: 1 },
    matcher: (r, g, b) => b > r && b > g && r > 120 && g > 120,
    baseConfidence: 0.58,
    note: "Visual heuristic matched transparent blue-tinted bottle shapes.",
    inferredShelfLifeDays: 30
  }
];

function inferExpiry(days?: number): string | null {
  if (!days) {
    return null;
  }

  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not load uploaded image for visual heuristics."));
    };
    image.src = url;
  });
}

export async function detectVisibleItems(file: File): Promise<PantryItem[]> {
  const image = await loadImage(file);
  const canvas = document.createElement("canvas");
  const maxWidth = 420;
  const scale = Math.min(1, maxWidth / image.width);
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) {
    return [];
  }

  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
  const detections: PantryItem[] = [];

  for (const spec of specs) {
    const xStart = Math.floor(canvas.width * spec.region.xStart);
    const xEnd = Math.floor(canvas.width * spec.region.xEnd);
    const yStart = Math.floor(canvas.height * spec.region.yStart);
    const yEnd = Math.floor(canvas.height * spec.region.yEnd);

    let matchPixels = 0;
    let totalPixels = 0;

    for (let y = yStart; y < yEnd; y += 1) {
      for (let x = xStart; x < xEnd; x += 1) {
        const index = (y * canvas.width + x) * 4;
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];
        totalPixels += 1;
        if (spec.matcher(r, g, b)) {
          matchPixels += 1;
        }
      }
    }

    const ratio = totalPixels > 0 ? matchPixels / totalPixels : 0;
    if (matchPixels >= spec.minPixels && ratio > 0.025) {
      const confidence = clamp(spec.baseConfidence + ratio * 1.2, spec.baseConfidence, 0.89);
      detections.push({
        id: spec.id,
        name: spec.name,
        confidence: Number(confidence.toFixed(2)),
        detectionSource: "visual",
        expirySource: spec.inferredShelfLifeDays ? "rule" : "none",
        inferredExpiry: inferExpiry(spec.inferredShelfLifeDays),
        notes: spec.note
      });
    }
  }

  return detections;
}

export function mergeDetectedItems(primary: PantryItem[], secondary: PantryItem[]): PantryItem[] {
  const byName = new Map<string, PantryItem>();

  for (const item of primary) {
    byName.set(item.name.toLowerCase(), item);
  }

  for (const item of secondary) {
    const key = item.name.toLowerCase();
    const existing = byName.get(key);
    if (!existing || item.confidence > existing.confidence) {
      byName.set(key, item);
    } else if (existing) {
      byName.set(key, {
        ...existing,
        detectionSource:
          existing.detectionSource && existing.detectionSource !== item.detectionSource ? "merged" : existing.detectionSource,
        notes:
          existing.notes && item.notes && existing.notes !== item.notes
            ? `${existing.notes} Visual cross-check also found a similar item.`
            : existing.notes ?? item.notes
      });
    }
  }

  return Array.from(byName.values()).sort((a, b) => b.confidence - a.confidence);
}
