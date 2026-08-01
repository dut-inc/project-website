import Link from "next/link";
import PlayerSearchModern from "@/components/PlayerSearchModern";
import { archetypeData } from "@/lib/archetypes";

export default function OffensiveProfilesPage() {
  return (
    <div className="-mx-4 -mt-6 min-h-[80vh] bg-[#0B0B0D] px-4 pb-20 pt-10 sm:-mx-8 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/sports"
          className="mb-8 inline-block font-mono text-xs uppercase tracking-widest text-white/40 hover:text-[#FF9552]"
        >
          &larr; Back to Sports Lab
        </Link>

        <div className="mb-10 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-[#FF9552]/80">
            Season {archetypeData.season} &middot; {archetypeData.players.length} players
          </p>
          <h1 className="mt-2 font-body text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Offensive Profiles
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-white/50">
            Shot-based archetypes from K-Means clustering — search a player to see
            their profile and shot-zone efficiency.
          </p>
          {archetypeData.sample && (
            <p className="mx-auto mt-4 max-w-md rounded-full border border-[#FF9552]/30 bg-[#FF9552]/10 px-4 py-1.5 font-mono text-[11px] uppercase tracking-widest text-[#FF9552]">
              Sample data — run the notebook against a real season to replace this
            </p>
          )}
        </div>

        <PlayerSearchModern players={archetypeData.players} />
      </div>
    </div>
  );
}
