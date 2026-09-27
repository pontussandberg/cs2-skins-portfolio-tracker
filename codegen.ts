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
          Watch: "../../core/types#Watch as WatchModel",
          Run: "../../core/types#RunRecord as RunRecordModel",
          Listing: "../../core/types#ListingSnap as ListingSnapModel",
          PriceChange: "../../core/types#PriceChange as PriceChangeModel",
          FeedItem: "../../core/types#FeedItem as FeedItemModel",
          CsfloatQuery: "../../core/types#CsfloatQuery as CsfloatQueryModel",
          SystemStatus: "../../core/types#SystemStatus as SystemStatusModel",
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
