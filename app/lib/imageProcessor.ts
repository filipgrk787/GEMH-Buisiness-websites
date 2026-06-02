/**
 * Client-side image processing for the website generator.
 * Resizes, compresses and converts images using Canvas.
 * All processing happens in-browser – no server upload.
 */

export interface ResizeOptions {
  maxWidth: number;
  maxHeight: number;
  quality?: number; // 0.6 - 0.95
  format?: "jpeg" | "png" | "webp";
  fit?: "cover" | "contain";
}

const DEFAULT_OPTS: ResizeOptions = {
  maxWidth: 1600,
  maxHeight: 1200,
  quality: 0.82,
  format: "jpeg",
  fit: "cover",
};

/**
 * Resize + optimize a user File into a compressed Blob.
 * Returns both the Blob and a data URL for immediate preview use.
 */
export async function processImage(
  file: File,
  options: Partial<ResizeOptions> = {}
): Promise<{ blob: Blob; dataUrl: string; filename: string }> {
  const opts = { ...DEFAULT_OPTS, ...options };

  // Read file
  const img = await loadImage(file);

  // Compute target dimensions (maintain aspect)
  let { width, height } = img;
  const ratio = width / height;

  if (width > opts.maxWidth || height > opts.maxHeight) {
    if (ratio > opts.maxWidth / opts.maxHeight) {
      width = opts.maxWidth;
      height = Math.round(width / ratio);
    } else {
      height = opts.maxHeight;
      width = Math.round(height * ratio);
    }
  }

  // Canvas
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { alpha: opts.format === "png" })!;

  // Fill for jpeg (no transparency)
  if (opts.format !== "png") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, width, height);

  // Convert
  const mime =
    opts.format === "png"
      ? "image/png"
      : opts.format === "webp"
        ? "image/webp"
        : "image/jpeg";

  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Canvas toBlob failed"))),
      mime,
      opts.quality
    );
  });

  // Create preview data URL (smaller for memory)
  const previewCanvas = document.createElement("canvas");
  const maxPreview = 720;
  let pw = width;
  let ph = height;
  if (pw > maxPreview || ph > maxPreview) {
    if (pw > ph) {
      ph = Math.round((maxPreview / pw) * ph);
      pw = maxPreview;
    } else {
      pw = Math.round((maxPreview / ph) * pw);
      ph = maxPreview;
    }
  }
  previewCanvas.width = pw;
  previewCanvas.height = ph;
  const pctx = previewCanvas.getContext("2d")!;
  pctx.drawImage(canvas, 0, 0, pw, ph);
  const dataUrl = previewCanvas.toDataURL(mime, 0.9);

  // Sensible filename
  const ext = mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg";
  const base = file.name.replace(/\.[^.]+$/, "").replace(/[^a-z0-9_-]/gi, "_").toLowerCase() || "image";
  const filename = `${base}.${ext}`;

  return { blob, dataUrl, filename };
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    img.src = url;
  });
}

/**
 * Special smaller processing for logo and favicon.
 */
export async function processLogo(file: File) {
  return processImage(file, {
    maxWidth: 640,
    maxHeight: 320,
    quality: 0.9,
    format: "png", // logos often need transparency
  });
}

export async function processFavicon(file: File) {
  const res = await processImage(file, {
    maxWidth: 256,
    maxHeight: 256,
    quality: 0.92,
    format: "png",
  });
  // Force square favicon name
  return {
    ...res,
    filename: "favicon.png",
  };
}

export async function processHero(file: File) {
  return processImage(file, {
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 0.78,
    format: "jpeg",
  });
}

export async function processServiceImage(file: File) {
  return processImage(file, {
    maxWidth: 800,
    maxHeight: 600,
    quality: 0.8,
    format: "jpeg",
  });
}

export async function processTeamPhoto(file: File) {
  return processImage(file, {
    maxWidth: 640,
    maxHeight: 640,
    quality: 0.82,
    format: "jpeg",
  });
}

/**
 * Create a nice placeholder image (used for demo data).
 */
export async function createPlaceholderImage(
  width: number,
  height: number,
  bgColor: string,
  text: string,
  textColor = "#ffffff"
): Promise<{ blob: Blob; dataUrl: string; filename: string }> {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { alpha: false })!;

  // Background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);

  // Subtle gradient overlay
  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, "rgba(255,255,255,0.08)");
  grad.addColorStop(1, "rgba(0,0,0,0.25)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Text
  ctx.fillStyle = textColor;
  ctx.font = `600 ${Math.min(28, Math.floor(width / 11))}px system-ui, -apple-system, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, width / 2, height / 2);

  // Small decorative line
  ctx.strokeStyle = textColor;
  ctx.globalAlpha = 0.35;
  ctx.lineWidth = 2;
  const lw = Math.min(width * 0.25, 120);
  ctx.beginPath();
  ctx.moveTo(width / 2 - lw, height / 2 + 32);
  ctx.lineTo(width / 2 + lw, height / 2 + 32);
  ctx.stroke();
  ctx.globalAlpha = 1;

  const blob: Blob = await new Promise((r) =>
    canvas.toBlob((b) => r(b!), "image/jpeg", 0.85)
  );
  const dataUrl = canvas.toDataURL("image/jpeg", 0.9);

  return {
    blob,
    dataUrl,
    filename: `placeholder-${text.toLowerCase().replace(/\s+/g, "-")}.jpg`,
  };
}
