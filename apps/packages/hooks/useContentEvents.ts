import { useMutation } from "@tanstack/react-query";
import { env } from "@dome/config/env";

type ContentEventPayload = {
  event: "content.viewed" | "content.bookmarked";
  contentId: string;
  sort: string;
  metadata?: Record<string, unknown>;
};

async function sendEvent(payload: ContentEventPayload) {
  const response = await fetch(`${env.bffBaseUrl}/api/v1/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, occurredAt: new Date().toISOString() }),
  });

  if (!response.ok) {
    throw new Error(`Event API failed (${response.status})`);
  }
}

export function useContentEvent() {
  return useMutation({ mutationFn: sendEvent });
}
