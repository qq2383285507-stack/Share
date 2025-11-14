import { env } from "@dome/config/env";

type ContentEvent = {
  event: "content.viewed" | "content.bookmarked";
  contentId: string;
  occurredAt: string;
  sort: string;
  metadata?: Record<string, unknown>;
};

export async function postContentEvent(event: ContentEvent) {
  const response = await fetch(`${env.bffBaseUrl}${env.eventsEndpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(event),
  });

  if (!response.ok) {
    throw new Error(`Event API failed (${response.status})`);
  }
}
