"use client";

import PageHeader from "@/components/PageHeader";
import CreateOrJoinRoom from "@/components/the-pack/CreateOrJoinRoom";
import { getProject } from "@/lib/projects";

export default function ThePackPage() {
  return (
    <div>
      <PageHeader href="/board-games/the-pack" description={getProject("the-pack").summary} />
      <CreateOrJoinRoom />
    </div>
  );
}
