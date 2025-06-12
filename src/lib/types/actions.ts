// Typdefinitionen für Actions
import type { Comment, Challenge, Subplebbit } from './accounts.js';

// Typen für Edits und Moderationen
export interface CommentEdit {
  commentCid?: string;
  subplebbitAddress?: string;
  timestamp?: number;
  content?: string;
  title?: string;
  removed?: boolean;
  locked?: boolean;
  pinned?: boolean;
  reason?: string;
  commentModeration?: CommentModeration;
  [key: string]: unknown;
}

export interface CommentModeration {
  commentCid?: string;
  subplebbitAddress?: string;
  timestamp?: number;
  removed?: boolean;
  locked?: boolean;
  pinned?: boolean;
  reason?: string;
  [key: string]: unknown;
}

export interface SubplebbitEdit {
  subplebbitAddress?: string;
  timestamp?: number;
  title?: string;
  description?: string;
  [key: string]: unknown;
}

// Challenge-Verifikation
export interface ChallengeVerification {
  challengeSuccess?: boolean;
  challengeErrors?: string[];
  [key: string]: unknown;
}

// Optionen für Actions
export interface UseSubscribeOptions {
  subplebbitAddress?: string;
  accountName?: string;
  onError?: (error: Error) => void;
}

export interface UseSubscribeResult {
  subscribed?: boolean;
  subscribe: () => Promise<void>;
  unsubscribe: () => Promise<void>;
  state: string;
  error?: Error;
  errors: Error[];
}

export interface UseBlockOptions {
  address?: string;
  cid?: string;
  accountName?: string;
  onError?: (error: Error) => void;
}

export interface UseBlockResult {
  blocked?: boolean;
  block: () => Promise<void>;
  unblock: () => Promise<void>;
  state: string;
  error?: Error;
  errors: Error[];
}

export interface UsePublishCommentOptions {
  accountName?: string;
  subplebbitAddress?: string;
  title?: string;
  content?: string;
  parentCid?: string;
  signer?: {
    address?: string;
    privateKey?: string;
    [key: string]: unknown;
  };
  onChallenge?: (challenge: Challenge, comment: Comment) => void;
  onChallengeVerification?: (challengeVerification: ChallengeVerification, comment: Comment) => void;
  onError?: (error: Error) => void;
  onPublishingStateChange?: (publishingState: string) => void;
}

export interface UsePublishCommentResult {
  index?: number;
  challenge?: Challenge;
  challengeVerification?: ChallengeVerification;
  publishComment: () => Promise<void>;
  publishChallengeAnswers: (challengeAnswers: string[]) => Promise<void>;
  state: string;
  error?: Error;
  errors: Error[];
}

export interface UsePublishVoteOptions {
  accountName?: string;
  commentCid?: string;
  vote?: number;
  signer?: {
    address?: string;
    privateKey?: string;
    [key: string]: unknown;
  };
  onChallenge?: (challenge: Challenge, vote: Vote) => void;
  onChallengeVerification?: (challengeVerification: ChallengeVerification, vote: Vote) => void;
  onError?: (error: Error) => void;
  onPublishingStateChange?: (publishingState: string) => void;
}

export interface UsePublishVoteResult {
  challenge?: Challenge;
  challengeVerification?: ChallengeVerification;
  publishVote: () => Promise<void>;
  publishChallengeAnswers: (challengeAnswers: string[]) => Promise<void>;
  state: string;
  error?: Error;
  errors: Error[];
}

export interface UsePublishCommentEditOptions {
  accountName?: string;
  commentCid?: string;
  content?: string;
  title?: string;
  signer?: {
    address?: string;
    privateKey?: string;
    [key: string]: unknown;
  };
  onChallenge?: (challenge: Challenge, commentEdit: CommentEdit) => void;
  onChallengeVerification?: (challengeVerification: ChallengeVerification, commentEdit: CommentEdit) => void;
  onError?: (error: Error) => void;
  onPublishingStateChange?: (publishingState: string) => void;
}

export interface UsePublishCommentEditResult {
  challenge?: Challenge;
  challengeVerification?: ChallengeVerification;
  publishCommentEdit: () => Promise<void>;
  publishChallengeAnswers: (challengeAnswers: string[]) => Promise<void>;
  state: string;
  error?: Error;
  errors: Error[];
}

export interface UsePublishCommentModerationOptions {
  accountName?: string;
  commentCid?: string;
  removed?: boolean;
  locked?: boolean;
  pinned?: boolean;
  reason?: string;
  signer?: {
    address?: string;
    privateKey?: string;
    [key: string]: unknown;
  };
  onChallenge?: (challenge: Challenge, commentModeration: CommentModeration) => void;
  onChallengeVerification?: (challengeVerification: ChallengeVerification, commentModeration: CommentModeration) => void;
  onError?: (error: Error) => void;
  onPublishingStateChange?: (publishingState: string) => void;
}

export interface UsePublishCommentModerationResult {
  challenge?: Challenge;
  challengeVerification?: ChallengeVerification;
  publishCommentModeration: () => Promise<void>;
  publishChallengeAnswers: (challengeAnswers: string[]) => Promise<void>;
  state: string;
  error?: Error;
  errors: Error[];
}

export interface UsePublishSubplebbitEditOptions {
  accountName?: string;
  subplebbitAddress?: string;
  title?: string;
  description?: string;
  signer?: {
    address?: string;
    privateKey?: string;
    [key: string]: unknown;
  };
  onChallenge?: (challenge: Challenge, subplebbitEdit: SubplebbitEdit) => void;
  onChallengeVerification?: (challengeVerification: ChallengeVerification, subplebbitEdit: SubplebbitEdit) => void;
  onError?: (error: Error) => void;
  onPublishingStateChange?: (publishingState: string) => void;
}

export interface UsePublishSubplebbitEditResult {
  challenge?: Challenge;
  challengeVerification?: ChallengeVerification;
  publishSubplebbitEdit: () => Promise<void>;
  publishChallengeAnswers: (challengeAnswers: string[]) => Promise<void>;
  state: string;
  error?: Error;
  errors: Error[];
}

export interface UseCreateSubplebbitOptions {
  accountName?: string;
  title?: string;
  description?: string;
  address?: string;
  signer?: {
    address?: string;
    privateKey?: string;
    [key: string]: unknown;
  };
  onError?: (error: Error) => void;
}

export interface UseCreateSubplebbitResult {
  createdSubplebbit?: Subplebbit;
  createSubplebbit: () => Promise<void>;
  state: string;
  error?: Error;
  errors: Error[];
}

// Vote-Typ
export interface Vote {
  commentCid?: string;
  vote?: number; // 1 for upvote, -1 for downvote
  timestamp?: number;
  signature?: {
    signature?: string;
    publicKey?: string;
    type?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}