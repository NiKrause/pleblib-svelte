// Definiere Typen basierend auf der plebbit-js-Bibliothek
// Da die Typen nicht direkt importiert werden können, definieren wir sie hier selbst

// Importiere alle Typen aus accounts.js
export * from './accounts.js';

// Importiere spezifische Typen aus actions.js, um Konflikte zu vermeiden
export type {
  ChallengeVerification,
  UseSubscribeOptions,
  UseSubscribeResult,
  UseBlockOptions,
  UseBlockResult,
  UsePublishCommentOptions,
  UsePublishCommentResult,
  UsePublishVoteOptions,
  UsePublishVoteResult,
  UsePublishCommentEditOptions,
  UsePublishCommentEditResult,
  UsePublishCommentModerationOptions,
  UsePublishCommentModerationResult,
  UsePublishSubplebbitEditOptions,
  UsePublishSubplebbitEditResult,
  UseCreateSubplebbitOptions,
  UseCreateSubplebbitResult
} from './actions.js';

// Importiere spezifische Typen aus authors.js
export type {
  Nft,
  ChainProvider,
  ChainProviders,
  CommentsFilter,
  UseAuthorOptions,
  UseAuthorResult,
  UseAuthorCommentsOptions,
  UseAuthorCommentsResult,
  UseAuthorAvatarOptions,
  UseAuthorAvatarResult,
  UseAuthorAddressOptions,
  UseAuthorAddressResult,
  UseResolvedAuthorAddressOptions,
  UseResolvedAuthorAddressResult,
  AuthorsCommentsState
} from './authors.js';

// Zusätzliche Typen für Svelte-Stores
export interface PlebbitOptions {
  ipfsHttpClientOptions?: Record<string, unknown>;
  pubsubHttpClientOptions?: Record<string, unknown>;
  dataPath?: string;
  // WebSocket-URL für die Plebbit-Instanz
  plebbitWsEndpoint?: string;
  // Gateway-URLs für IPFS und Pubsub
  ipfsGatewayUrls?: string[];
  pubsubHttpGatewayUrls?: string[];
  [key: string]: unknown;
}

export interface Comment {
  cid?: string;
  author?: Author;
  title?: string;
  content?: string;
  parentCid?: string;
  subplebbitAddress?: string;
  timestamp?: number;
  upvoteCount?: number;
  downvoteCount?: number;
  replyCount?: number;
  replies?: Comment[];
  [key: string]: unknown;
}

// Erweiterter Typ für einen Kommentar mit Methoden für die Veröffentlichung
export interface PublishableComment extends Comment {
  on(event: 'challenge', callback: (challenge: Challenge) => void): void;
  on(event: 'challengeverification', callback: (verification: Record<string, unknown>) => void): void;
  on(event: 'error', callback: (error: Error) => void): void;
  on(event: string, callback: (data: unknown) => void): void;
  publish(): Promise<void>;
  publishChallengeAnswer(answer: string): void;
}

export interface Author {
  address?: string;
  displayName?: string;
  [key: string]: unknown;
}

export interface Subplebbit {
  address?: string;
  title?: string;
  description?: string;
  posts?: Comment[];
  [key: string]: unknown;
}

export interface Vote {
  commentCid?: string;
  vote?: number; // 1 for upvote, -1 for downvote
  [key: string]: unknown;
}

export interface Challenge {
  type?: string;
  challenge?: string;
  [key: string]: unknown;
}

export interface ChallengeRequestMessage {
  type: string;
  challengeRequestId: string;
  [key: string]: unknown;
}

export interface ChallengeAnswerMessage {
  type: string;
  challengeRequestId: string;
  challengeAnswer: string;
  [key: string]: unknown;
}

// Erweiterte Typen für Svelte-Stores
export interface FeedOptions {
  subplebbitAddresses: string[];
  sortType?: string;
  limit?: number;
}

export interface CommentOptions {
  commentCid: string;
  onlyIfCached?: boolean;
}

export interface RepliesOptions {
  comment: Comment;
  sortType?: string;
  limit?: number;
  flat?: boolean;
}

export interface PublishCommentOptions {
  subplebbitAddress: string;
  title?: string;
  content?: string;
  parentCid?: string;
  signer?: {
    address?: string;
    privateKey?: string;
    [key: string]: unknown;
  };
}

export interface PublishCommentState {
  publishing: boolean;
  publishingError: Error | null;
  challenge: Challenge | null;
  challengeVerification: {
    challengeSuccess?: boolean;
    challengeErrors?: string[];
    [key: string]: unknown;
  } | null;
  comment: Comment | null;
}

export interface CaptchaState {
  challenge: Challenge | null;
  answer: string;
  verifying: boolean;
  verified: boolean;
  error: Error | null;
}

// Plebbit-Client-Typ
export interface Plebbit {
  createComment: (options: Record<string, unknown>) => Promise<Comment>;
  createSubplebbit: (options: Record<string, unknown>) => Promise<Subplebbit>;
  createVote: (options: Record<string, unknown>) => Promise<Vote>;
  getComment: (cid: string) => Promise<Comment>;
  getSubplebbit: (address: string) => Promise<Subplebbit>;
  // Optional, da es möglicherweise nicht in der tatsächlichen Implementierung vorhanden ist
  listSubplebbits?: () => Promise<string[]>;
  [key: string]: unknown;
}