import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function sortWeights(weightKeys) {
  if (!weightKeys || !Array.isArray(weightKeys)) return [];
  const parseWeight = (w) => {
    const match = String(w).match(/^(\d+(?:\.\d+)?)\s*(gr|g|kg)$/i);
    if (!match) return { value: 999999, isKg: false };
    const num = parseFloat(match[1]);
    const unit = match[2].toLowerCase();
    const isKg = unit === 'kg';
    return { value: num, isKg };
  };

  return [...weightKeys].sort((a, b) => {
    const wa = parseWeight(a);
    const wb = parseWeight(b);
    if (wa.isKg !== wb.isKg) {
      return wa.isKg ? 1 : -1;
    }
    return wa.value - wb.value;
  });
}

export function getProductSizeImage(product, weight) {
  if (!product) return '';
  let imgs = product.images;
  if (typeof imgs === 'string') {
    try { imgs = JSON.parse(imgs); } catch { imgs = null; }
  }
  if (imgs && typeof imgs === 'object' && weight && imgs[weight]) {
    return imgs[weight];
  }
  return product.image || '';
}
