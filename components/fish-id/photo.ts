import type { FishImage } from "@/lib/fishId/types";

// iNaturalist already serves each photo at fixed sizes, so remote photos are
// shown as-is instead of going through Next's image optimiser.
export function isRemote(src: string): boolean {
  return /^https?:\/\//.test(src);
}

export function thumbSrc(image: FishImage): string {
  return image.thumb ?? image.src;
}
