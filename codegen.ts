import type { CodegenConfig } from "@graphql-codegen/cli";

/**
 * Two outputs from one schema:
 *  - resolvers-types.ts: typed resolvers for the server (typescript + typescript-resolvers)
 *  - graphql.ts: operation result/variable types for the client, following
 *    Apollo's recommended setup (typescript-operations v6, no client preset).
 */
const config: CodegenConfig = {
  overwrite: true,
  schema: "schema.graphql",
  generates: {
    "src/graphql/__generated__/resolvers-types.ts": {
      plugins: ["typescript", "typescript-resolvers"],
      config: {
        useIndexSignature: true,
        enumsAsTypes: true,
        contextType: "../context#GqlContext",
        scalars: { DateTime: "string" },
        mappers: {
          Watch: "../../core/types#Watch",
          Run: "../../core/types#RunRecord",
          Listing: "../../core/types#ListingSnap",
          PriceChange: "../../core/types#PriceChange",
          FeedItem: "../../core/types#FeedItem",
          CsfloatQuery: "../../core/types#CsfloatQuery",
          SystemStatus: "../../core/types#SystemStatus",
        },
      },
    },
    "src/graphql/__generated__/graphql.ts": {
      documents: ["src/graphql/operations.ts"],
      plugins: ["typescript-operations"],
      config: {
        nonOptionalTypename: true,
        skipTypeNameForRoot: true,
        scalars: { DateTime: "string" },
      },
    },
  },
};

export default config;
