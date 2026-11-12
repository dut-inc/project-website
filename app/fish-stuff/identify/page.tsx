import PageHeader from "@/components/PageHeader";
import ModeSelect from "@/components/fish-id/ModeSelect";
import QuizSession from "@/components/fish-id/QuizSession";
import { newSeed } from "@/lib/fishId/engine";
import { QUIZ_HREF, getMode } from "@/lib/fishId/modes";
import { DEFAULT_SET, getSet } from "@/lib/fishId/sets";
import { speciesIn } from "@/lib/fishId/species";
import { pageMetadata } from "@/lib/metadata";

const DESCRIPTION = "Identify fish by photograph, common name and scientific name.";

export const metadata = pageMetadata(QUIZ_HREF, { description: DESCRIPTION });

type Params = { set?: string | string[]; mode?: string | string[] };
const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

// /fish-stuff/identify?set=<set> shows that set's modes; &mode=<id> plays a
// run. The run's seed is chosen here so the server renders the same first
// question the client hydrates. Only the chosen set's species are sent to
// the browser.
export default async function FishIdPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const set = getSet(first(params.set)) ?? DEFAULT_SET;
  const mode = getMode(first(params.mode));
  const pool = speciesIn(set);

  return (
    <>
      <PageHeader compact href={QUIZ_HREF} />
      {mode ? (
        <QuizSession key={`${set.id}:${mode.id}`} set={set} mode={mode} pool={pool} seed={newSeed()} />
      ) : (
        <ModeSelect set={set} pool={pool} />
      )}
    </>
  );
}
