import type { HeadersFunction, LoaderFunctionArgs } from "@remix-run/node";
import { isRouteErrorResponse, Link, Outlet, useLoaderData, useRouteError } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";

import { authenticate } from "../shopify.server";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  return { apiKey: process.env.SHOPIFY_API_KEY || "" };
};

export default function App() {
  const { apiKey } = useLoaderData<typeof loader>();

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey}>
      <NavMenu>
        <Link to="/app" rel="home">
          Banner settings
        </Link>
      </NavMenu>
      <Outlet />
    </AppProvider>
  );
}

// Shopify needs Remix to catch some thrown responses, so that their headers are included in the response.
export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <div style={{ padding: 16, fontFamily: "system-ui, sans-serif" }}>
        <h1>Something went wrong</h1>
        <p>
          {error.status} {error.statusText}
        </p>
        {typeof error.data === "string" ? <p>{error.data}</p> : null}
      </div>
    );
  }

  if (error instanceof Error) {
    console.error("[app] ErrorBoundary", error);
    return (
      <div style={{ padding: 16, fontFamily: "system-ui, sans-serif" }}>
        <h1>Something went wrong</h1>
        <p>{error.message}</p>
        <p style={{ color: "#666" }}>
                If this mentions Prisma or the database, set shopify_DATABASE_URL on
                Vercel to a PostgreSQL connection string and redeploy.
        </p>
      </div>
    );
  }

  return boundary.error(error);
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
