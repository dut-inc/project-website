import PageHeader from "@/components/PageHeader";
import FishQuiz from "@/components/fish-stuff/FishQuiz";
import { pageMetadata } from "@/lib/metadata";

const DESCRIPTION = "find out what fish you are!1!1!1!!!!";

export const metadata = pageMetadata("/fish-stuff/personality", { description: DESCRIPTION, title: "Which Pacific Northwest fish are you?" });

export default function FishPersonalityPage() {
  return (
    <div>
      <PageHeader
        href="/fish-stuff/personality"
        title="Which Pacific Northwest fish are you?"
        description={DESCRIPTION}
      />
      <FishQuiz />
    </div>
  );
}
