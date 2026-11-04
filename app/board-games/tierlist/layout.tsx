import type { ReactNode } from "react";
import { pageMetadata } from "@/lib/metadata";
import { TIERLIST_DESCRIPTION } from "./description";

// Only here for the link preview: the page itself is a client component.
export const metadata = pageMetadata("/board-games/tierlist", { description: TIERLIST_DESCRIPTION });

export default function TierListLayout({ children }: { children: ReactNode }) {
  return children;
}
