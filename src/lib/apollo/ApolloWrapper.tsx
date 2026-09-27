"use client";

import { HttpLink } from "@apollo/client";
import { ApolloClient, ApolloNextAppProvider, InMemoryCache } from "@apollo/client-integration-nextjs";
import type { ReactNode } from "react";

function makeClient() {
  // During SSR there is no relative base URL, so talk to our own server on localhost.
  const uri = typeof window === "undefined" ? `http://127.0.0.1:${process.env.PORT ?? 3000}/api/graphql` : "/api/graphql";
  return new ApolloClient({
    cache: new InMemoryCache(),
    link: new HttpLink({ uri }),
  });
}

export function ApolloWrapper({ children }: { children: ReactNode }) {
  return <ApolloNextAppProvider makeClient={makeClient}>{children}</ApolloNextAppProvider>;
}
