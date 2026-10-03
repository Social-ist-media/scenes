import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/sensory/shell";
import { StudioRoom } from "@/components/sensory/studio-room";

export const Route = createFileRoute("/studio/$id")({ component: StudioPage });

function StudioPage() {
  const { id } = Route.useParams();
  return (
    <Shell>
      <StudioRoom sessionId={id} />
    </Shell>
  );
}
