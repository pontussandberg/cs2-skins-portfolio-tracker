import { readFile } from "node:fs/promises";
import path from "node:path";
import { ApolloServer } from "@apollo/server";
import type { GqlContext } from "./context";
import { resolvers } from "./resolvers";

const KEY = Symbol.for("csfloat-watcher.apollo");

interface Cached {
  typeDefs: string;
  resolvers: typeof resolvers;
  server: Promise<ApolloServer<GqlContext>>;
}
type G = typeof globalThis & { [KEY]?: Cached };

async function readSchema(): Promise<string> {
  return readFile(path.join(/*turbopackIgnore: true*/ process.cwd(), "schema.graphql"), "utf8");
}

async function startServer(typeDefs: string): Promise<ApolloServer<GqlContext>> {
  const server = new ApolloServer<GqlContext>({ typeDefs, resolvers, introspection: true });
  await server.start();
  return server;
}

/**
 * One started ApolloServer per process. The cache lives on globalThis so it survives hot reload;
 * in development it is rebuilt when schema.graphql or the resolvers change.
 */
export async function getApolloServer(): Promise<ApolloServer<GqlContext>> {
  const g = globalThis as G;
  const current = g[KEY];
  if (current && process.env.NODE_ENV === "production") return current.server;

  const typeDefs = await readSchema();
  if (current && current.typeDefs === typeDefs && current.resolvers === resolvers) return current.server;

  const server = startServer(typeDefs);
  g[KEY] = { typeDefs, resolvers, server };
  if (current) void current.server.then((old) => old.stop()).catch(() => {});
  return server;
}
