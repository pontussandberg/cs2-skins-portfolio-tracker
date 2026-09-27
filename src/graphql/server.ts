import { readFile } from "node:fs/promises";
import path from "node:path";
import { ApolloServer } from "@apollo/server";
import type { GqlContext } from "./context";
import { resolvers } from "./resolvers";

const KEY = Symbol.for("csfloat-watcher.apollo");
type G = typeof globalThis & { [KEY]?: Promise<ApolloServer<GqlContext>> };

/** One started ApolloServer per process. */
export function getApolloServer(): Promise<ApolloServer<GqlContext>> {
  const g = globalThis as G;
  g[KEY] ??= (async () => {
    const typeDefs = await readFile(path.join(process.cwd(), "schema.graphql"), "utf8");
    const server = new ApolloServer<GqlContext>({
      typeDefs,
      resolvers,
      introspection: true,
    });
    await server.start();
    return server;
  })();
  return g[KEY]!;
}
