// Every query/mutation the UI uses. `pnpm codegen` scans this file and writes result and
// variable types to ./__generated__/graphql.ts (typescript-operations, Apollo's recommended setup).
import { gql, type TypedDocumentNode } from "@apollo/client";
import type {
  CreateWatchMutation,
  CreateWatchMutationVariables,
  DeletePortfolioSnapshotMutation,
  DeletePortfolioSnapshotMutationVariables,
  DeleteWatchMutation,
  DeleteWatchMutationVariables,
  FeedQuery,
  FeedQueryVariables,
  MarkAllSeenMutation,
  MarkAllSeenMutationVariables,
  MarkWatchSeenMutation,
  MarkWatchSeenMutationVariables,
  PortfolioQuery,
  PortfolioQueryVariables,
  ReorderWatchesMutation,
  ReorderWatchesMutationVariables,
  ResumeSchedulerMutation,
  ResumeSchedulerMutationVariables,
  RunAllMutation,
  RunAllMutationVariables,
  RunWatchMutation,
  RunWatchMutationVariables,
  SendTestNotificationMutation,
  SendTestNotificationMutationVariables,
  SetPortfolioSettingsMutation,
  SetPortfolioSettingsMutationVariables,
  SetValuationMutation,
  SetValuationMutationVariables,
  SetWatchEnabledMutation,
  SetWatchEnabledMutationVariables,
  SyncInventoryMutation,
  SyncInventoryMutationVariables,
  TakePortfolioSnapshotMutation,
  TakePortfolioSnapshotMutationVariables,
  UpdateWatchMutation,
  UpdateWatchMutationVariables,
  WatchDetailQuery,
  WatchDetailQueryVariables,
  WatchesQuery,
  WatchesQueryVariables,
} from "./__generated__/graphql";

const STICKER_FIELDS = gql`
  fragment StickerFields on Sticker {
    name
    iconUrl
    slot
    wear
    price
  }
`;

export const LISTING_FIELDS = gql`
  fragment ListingFields on Listing {
    id
    name
    price
    type
    seed
    float
    lowRank
    highRank
    stattrak
    stickers
    stickerDetails {
      ...StickerFields
    }
    stickerPercent
    charms {
      ...StickerFields
    }
    bluePercent
    fadePercent
    fadeRank
    screenshots {
      playside
      backside
    }
    createdAt
    csfloatUrl
    inspectLink
    iconUrl
  }
  ${STICKER_FIELDS}
`;

export const SYSTEM_FIELDS = gql`
  fragment SystemFields on SystemStatus {
    csfloatKeyConfigured
    discordConfigured
    schedulerSuspended
    suspendedReason
    queueSize
    timezone
  }
`;

export const RUN_FIELDS = gql`
  fragment RunFields on Run {
    id
    watchId
    trigger
    status
    queuedAt
    startedAt
    finishedAt
    requests
    baseline
    total
    error
    added {
      id
    }
    priceChanges {
      before
      after
    }
    goneIds
  }
`;

export const QUERY_FIELDS = gql`
  fragment QueryFields on CsfloatQuery {
    def_index
    paint_index
    market_hash_name
    min_float
    max_float
    min_blue
    max_blue
    min_fade
    max_fade
    category
    min_price
    max_price
    type
    stickers
    keychains
    collection
    rarity
    filter
    sort_by
  }
`;

export const WATCH_SUMMARY = gql`
  fragment WatchSummary on Watch {
    id
    name
    seeds
    schedule
    enabled
    notify
    unreadCount
    isRunning
    nextRunAt
    lastSeenAt
    itemName
    query {
      ...QueryFields
    }
    lastRun {
      ...RunFields
    }
  }
  ${QUERY_FIELDS}
  ${RUN_FIELDS}
`;

export const FEED: TypedDocumentNode<FeedQuery, FeedQueryVariables> = gql`
  query Feed($limit: Int) {
    feed(limit: $limit) {
      id
      kind
      at
      priceBefore
      runId
      unread
      listing {
        ...ListingFields
      }
      watch {
        id
        name
      }
    }
    system {
      ...SystemFields
    }
  }
  ${LISTING_FIELDS}
  ${SYSTEM_FIELDS}
`;

export const WATCHES: TypedDocumentNode<WatchesQuery, WatchesQueryVariables> = gql`
  query Watches {
    watches {
      ...WatchSummary
    }
    system {
      ...SystemFields
    }
  }
  ${WATCH_SUMMARY}
  ${SYSTEM_FIELDS}
`;

export const WATCH_DETAIL: TypedDocumentNode<WatchDetailQuery, WatchDetailQueryVariables> = gql`
  query WatchDetail($id: ID!) {
    watch(id: $id) {
      ...WatchSummary
      maxPages
      createdAt
      updatedAt
      csfloatSearchUrl
      currentListings {
        ...ListingFields
      }
      runs(limit: 30) {
        ...RunFields
      }
    }
  }
  ${WATCH_SUMMARY}
  ${LISTING_FIELDS}
  ${RUN_FIELDS}
`;

export const CREATE_WATCH: TypedDocumentNode<CreateWatchMutation, CreateWatchMutationVariables> = gql`
  mutation CreateWatch($input: WatchInput!) {
    createWatch(input: $input) {
      ...WatchSummary
    }
  }
  ${WATCH_SUMMARY}
`;

export const UPDATE_WATCH: TypedDocumentNode<UpdateWatchMutation, UpdateWatchMutationVariables> = gql`
  mutation UpdateWatch($id: ID!, $input: WatchInput!) {
    updateWatch(id: $id, input: $input) {
      ...WatchSummary
      maxPages
    }
  }
  ${WATCH_SUMMARY}
`;

export const DELETE_WATCH: TypedDocumentNode<DeleteWatchMutation, DeleteWatchMutationVariables> = gql`
  mutation DeleteWatch($id: ID!) {
    deleteWatch(id: $id)
  }
`;

export const REORDER_WATCHES: TypedDocumentNode<ReorderWatchesMutation, ReorderWatchesMutationVariables> = gql`
  mutation ReorderWatches($ids: [ID!]!) {
    reorderWatches(ids: $ids) {
      id
    }
  }
`;

export const RUN_WATCH: TypedDocumentNode<RunWatchMutation, RunWatchMutationVariables> = gql`
  mutation RunWatch($id: ID!) {
    runWatch(id: $id) {
      ...RunFields
    }
  }
  ${RUN_FIELDS}
`;

export const RUN_ALL: TypedDocumentNode<RunAllMutation, RunAllMutationVariables> = gql`
  mutation RunAll {
    runAll {
      id
      watchId
      status
    }
  }
`;

export const SET_WATCH_ENABLED: TypedDocumentNode<SetWatchEnabledMutation, SetWatchEnabledMutationVariables> = gql`
  mutation SetWatchEnabled($id: ID!, $enabled: Boolean!) {
    setWatchEnabled(id: $id, enabled: $enabled) {
      id
      enabled
      nextRunAt
      updatedAt
    }
  }
`;

export const MARK_WATCH_SEEN: TypedDocumentNode<MarkWatchSeenMutation, MarkWatchSeenMutationVariables> = gql`
  mutation MarkWatchSeen($id: ID!) {
    markWatchSeen(id: $id) {
      id
      lastSeenAt
      unreadCount
    }
  }
`;

export const MARK_ALL_SEEN: TypedDocumentNode<MarkAllSeenMutation, MarkAllSeenMutationVariables> = gql`
  mutation MarkAllSeen {
    markAllSeen
  }
`;

export const SEND_TEST_NOTIFICATION: TypedDocumentNode<SendTestNotificationMutation, SendTestNotificationMutationVariables> = gql`
  mutation SendTestNotification {
    sendTestNotification
  }
`;

export const RESUME_SCHEDULER: TypedDocumentNode<ResumeSchedulerMutation, ResumeSchedulerMutationVariables> = gql`
  mutation ResumeScheduler {
    resumeScheduler {
      ...SystemFields
    }
  }
  ${SYSTEM_FIELDS}
`;


const SNAPSHOT_FIELDS = gql`
  fragment SnapshotFields on PortfolioSnapshot {
    id
    label
    takenAt
    totals {
      items
      value
      market
      stickers
    }
  }
`;

const PORTFOLIO_FIELDS = gql`
  fragment PortfolioFields on Portfolio {
    id
    snapshot {
      ...SnapshotFields
    }
    syncedAt
    syncing
    syncError
    settings {
      defaultCraftPercent
    }
    items {
      id
      key
      name
      type
      iconUrl
      float
      seed
      lowRank
      highRank
      stattrak
      souvenir
      tradable
      csfloatUrl
      inspectLink
      stickers {
        ...StickerFields
      }
      charms {
        ...StickerFields
      }
      valuation {
        craftPercent
        multiplier
        skinPrice
        note
      }
      value {
        market
        skin
        stickers
        craftPercent
        craft
        charms
        total
        marketTotal
      }
    }
  }
  ${STICKER_FIELDS}
  ${SNAPSHOT_FIELDS}
`;

export const PORTFOLIO: TypedDocumentNode<PortfolioQuery, PortfolioQueryVariables> = gql`
  query Portfolio($snapshotId: ID!, $history: Boolean!) {
    portfolio {
      ...PortfolioFields
    }
    portfolioSnapshot(id: $snapshotId) @include(if: $history) {
      ...PortfolioFields
    }
    portfolioSnapshots {
      ...SnapshotFields
    }
    system {
      ...SystemFields
    }
  }
  ${PORTFOLIO_FIELDS}
  ${SNAPSHOT_FIELDS}
  ${SYSTEM_FIELDS}
`;

export const SYNC_INVENTORY: TypedDocumentNode<SyncInventoryMutation, SyncInventoryMutationVariables> = gql`
  mutation SyncInventory {
    syncInventory {
      ...PortfolioFields
    }
  }
  ${PORTFOLIO_FIELDS}
`;

export const SET_VALUATION: TypedDocumentNode<SetValuationMutation, SetValuationMutationVariables> = gql`
  mutation SetValuation($key: ID!, $input: ValuationInput!) {
    setValuation(key: $key, input: $input) {
      ...PortfolioFields
    }
  }
  ${PORTFOLIO_FIELDS}
`;

export const SET_PORTFOLIO_SETTINGS: TypedDocumentNode<SetPortfolioSettingsMutation, SetPortfolioSettingsMutationVariables> = gql`
  mutation SetPortfolioSettings($input: PortfolioSettingsInput!) {
    setPortfolioSettings(input: $input) {
      ...PortfolioFields
    }
  }
  ${PORTFOLIO_FIELDS}
`;

export const TAKE_PORTFOLIO_SNAPSHOT: TypedDocumentNode<TakePortfolioSnapshotMutation, TakePortfolioSnapshotMutationVariables> = gql`
  mutation TakePortfolioSnapshot($label: String) {
    takePortfolioSnapshot(label: $label) {
      ...SnapshotFields
    }
  }
  ${SNAPSHOT_FIELDS}
`;

export const DELETE_PORTFOLIO_SNAPSHOT: TypedDocumentNode<DeletePortfolioSnapshotMutation, DeletePortfolioSnapshotMutationVariables> = gql`
  mutation DeletePortfolioSnapshot($id: ID!) {
    deletePortfolioSnapshot(id: $id)
  }
`;
