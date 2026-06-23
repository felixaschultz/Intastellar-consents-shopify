type GraphqlErrorBody = {
  errors?: { message?: string }[];
};

export function getGraphqlErrors(json: GraphqlErrorBody): string | null {
  const errs = json.errors;
  if (!errs?.length) return null;
  return errs.map((e) => e.message ?? "Unknown GraphQL error").join("; ");
}

/** Surfaces Admin API failures instead of a blank Remix application error. */
export function throwGraphqlFailure(
  context: string,
  json: GraphqlErrorBody,
): never {
  const detail = getGraphqlErrors(json);
  console.error(`[${context}]`, json.errors ?? "no errors array");
  throw new Response(detail ? `${context}: ${detail}` : context, {
    status: 502,
  });
}
