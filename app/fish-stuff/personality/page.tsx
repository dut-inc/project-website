import PageHeader from "@/components/PageHeader";
import FishQuiz from "@/components/fish-stuff/FishQuiz";

export default function FishPersonalityPage() {
  return (
    <div>
      <PageHeader
        href="/fish-stuff/personality"
        title="Which Pacific Northwest fish are you?"
        description="find out what fish you are!1!1!1!!!!"
      />
      <FishQuiz />
    </div>
  );
}
