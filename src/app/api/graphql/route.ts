import { HeaderMap } from "@apollo/server";
import { getApolloServer } from "@/graphql/server";
import { ensureRuntime } from "@/server/runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Minimal Apollo Server <-> Next.js route handler bridge (Web Request/Response). */
async function handle(req: Request): Promise<Response> {
  const [server, rt] = await Promise.all([getApolloServer(), ensureRuntime()]);

  const headers = new HeaderMap();
  req.headers.forEach((value, key) => headers.set(key, value));

  let body: unknown = undefined;
  if (req.method === "POST") {
    const text = await req.text();
    const type = req.headers.get("content-type") ?? "";
    body = type.includes("application/json") && text ? JSON.parse(text) : text;
  }

  const result = await server.executeHTTPGraphQLRequest({
    httpGraphQLRequest: {
      method: req.method.toUpperCase(),
      headers,
      search: new URL(req.url).search,
      body,
    },
    context: async () => ({ rt, listings: new Map() }),
  });

  const resHeaders = new Headers();
  for (const [key, value] of result.headers) resHeaders.set(key, value);

  if (result.body.kind === "complete") {
    return new Response(result.body.string, { status: result.status ?? 200, headers: resHeaders });
  }

  const iterator = result.body.asyncIterator;
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      const { value, done } = await iterator.next();
      if (done) controller.close();
      else controller.enqueue(encoder.encode(value));
    },
  });
  return new Response(stream, { status: result.status ?? 200, headers: resHeaders });
}

export { handle as GET, handle as POST };
