import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { pollPilotLead } from "../lib/pilot-lead.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const pollToken = url.searchParams.get("token")?.trim();
  if (!pollToken) {
    return json({ ok: false as const, message: "Missing token" }, { status: 400 });
  }

  const result = await pollPilotLead(pollToken);
  if (!result) {
    return json({ ok: false as const, message: "Not found" }, { status: 404 });
  }

  return json({ ok: true as const, ...result });
};
