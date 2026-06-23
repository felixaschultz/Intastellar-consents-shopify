import type { ActionFunctionArgs } from "@remix-run/node";
import { handleShopRedact } from "../lib/compliance-webhooks.server";

export const action = (args: ActionFunctionArgs) => handleShopRedact(args);
