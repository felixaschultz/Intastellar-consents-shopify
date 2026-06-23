import type { ActionFunctionArgs } from "@remix-run/node";
import { handleCustomersRedact } from "../lib/compliance-webhooks.server";

export const action = (args: ActionFunctionArgs) => handleCustomersRedact(args);
