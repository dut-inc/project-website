import PageHeader from "@/components/PageHeader";
import ModeSelect from "@/components/fish-id/ModeSelect";
import QuizSession from "@/components/fish-id/QuizSession";
import { parseCode, randomCode } from "@/lib/fishId/codes";
import { QUIZ_HREF, getMode, quizHref } from "@/lib/fishId/modes";
import { DEFAULT_SET, getSet } from "@/lib/fishId/sets";
import { speciesIn } from "@/lib/fishId/species";
import { pageMetadata } from "@/lib/metadata";

const DESCRIPTION = "Identify fish by photograph, common name and scientific name.";

export const metadata = pageMetadata(QUIZ_HREF, { description: DESCRIPTION });

type Params = { set?: string | string[]; mode?: string | string[]; code?: string | string[] };
const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

// /fish-stuff/identify?set=<set> shows that set's modes; &mode=<id> plays a
// run with a fresh code. ?code=<code> plays a shared run; the code names its
// own set and mode. The code is chosen here so the server renders the same
// first question the client hydrates. Only the run's species are sent to the
// browser.
export default async function FishIdPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const codeParam = first(params.code);
  const shared = codeParam ? parseCode(codeParam) : null;
  const set = shared?.set ?? getSet(first(params.set)) ?? DEFAULT_SET;
  const mode = shared?.mode ?? getMode(first(params.mode));
  const pool = speciesIn(set);

  return (
    <>
      {/* In a run, the back link returns to this set's modes; on the modes, to Fish Lab. */}
      <PageHeader compact href={QUIZ_HREF} back={mode ? { href: quizHref(set), label: "All Quizzes" } : undefined} />
      {mode ? (
        <QuizSession
          key={`${set.id}:${mode.id}:${shared?.code ?? ""}`}
          set={set}
          mode={mode}
          pool={pool}
          code={(shared ?? randomCode(set, mode)).code}
          shared={shared !== null}
        />
      ) : (
        <ModeSelect set={set} badCode={codeParam && !shared ? codeParam : undefined} />
      )}
    </>
  );
}
