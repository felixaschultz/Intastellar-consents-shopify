import type { ActionFunctionArgs } from "@remix-run/node";
import { handleCustomersDataRequest } from "../lib/compliance-webhooks.server";

export const action = (args: ActionFunctionArgs) =>
  handleCustomersDataRequest(args);
