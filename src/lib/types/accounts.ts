// Typdefinitionen für Accounts

// Importiere grundlegende Typen direkt
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

export interface Author {
  address?: string;
  displayName?: string;
  [key: string]: unknown;
}

export interface Plebbit {
  createComment: (options: Record<string, unknown>) => Promise<Comment>;
  createSubplebbit: (options: Record<string, unknown>) => Promise<Subplebbit>;
  createVote: (options: Record<string, unknown>) => Promise<Vote>;
  getComment: (cid: string) => Promise<Comment>;
  getSubplebbit: (address: string) => Promise<Subplebbit>;
  listAccounts?: () => Promise<Account[]>;
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

export interface Account {
  id?: string;
  name?: string;
  author?: {
    address?: string;
    displayName?: string;
    shortAddress?: string;
    [key: string]: unknown;
  };
  signer?: {
    address?: string;
    privateKey?: string;
    [key: string]: unknown;
  };
  plebbit?: Plebbit; // Plebbit-Instanz
  plebbitOptions?: Record<string, unknown>;
  subscriptions?: string[];
  blockedAddresses?: {[address: string]: boolean};
  blockedCids?: {[cid: string]: boolean};
  karma?: {
    replyUpvoteCount: number;
    replyDownvoteCount: number;
    replyScore: number;
    postUpvoteCount: number;
    postDownvoteCount: number;
    postScore: number;
    upvoteCount: number;
    downvoteCount: number;
    score: number;
  };
  unreadNotificationCount?: number;
  [key: string]: unknown;
}

export interface AccountComment extends Comment {
  state?: string;
  error?: Error;
  errors?: Error[];
}

export type AccountComments = AccountComment[];

export interface AccountVote {
  commentCid?: string;
  vote?: number; // 1 for upvote, -1 for downvote
  timestamp?: number;
  [key: string]: unknown;
}

export interface AccountCommentReply {
  cid?: string;
  author?: Author;
  content?: string;
  parentCid?: string;
  postCid?: string;
  subplebbitAddress?: string;
  timestamp?: number;
  markedAsRead?: boolean;
  [key: string]: unknown;
}

export interface AccountCommentsReplies {
  [replyCid: string]: AccountCommentReply;
}

export interface AccountsCommentsReplies {
  [accountId: string]: AccountCommentsReplies;
}

export interface AccountsComments {
  [accountId: string]: AccountComments;
}

export interface Accounts {
  [accountId: string]: Account;
}

export interface AccountsVotes {
  [accountId: string]: {
    [commentCid: string]: AccountVote;
  };
}

export interface AccountsEdits {
  [accountId: string]: {
    [commentCid: string]: CommentEdit[];
  };
}

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

export interface Notification extends AccountCommentReply {
  markedAsRead?: boolean;
}

export interface AccountsNotifications {
  [accountId: string]: Notification[];
}

// Store-Typen
export interface AccountsState {
  accounts: Accounts;
  accountIds: string[];
  activeAccountId: string | null;
  accountNamesToAccountIds: {[accountName: string]: string};
  accountsComments: AccountsComments;
  accountsCommentsReplies: AccountsCommentsReplies;
  accountsVotes: AccountsVotes;
  accountsEdits: AccountsEdits;
}

// Hook-Optionen und Ergebnisse
export interface UseAccountOptions {
  accountName?: string;
}

export interface UseAccountResult extends Account {
  state: string;
  error?: Error;
  errors: Error[];
}

export interface UseAccountsResult {
  accounts: Account[];
  state: string;
  error?: Error;
  errors: Error[];
}

export interface UseAccountCommentsOptions {
  accountName?: string;
  filter?: (comment: AccountComment) => boolean;
}

export interface UseAccountCommentsResult {
  accountComments: AccountComment[];
  state: string;
  error?: Error;
  errors: Error[];
}

export interface UseAccountCommentOptions {
  commentIndex?: number;
  accountName?: string;
}

export interface UseAccountCommentResult extends AccountComment {
  state: string;
  error?: Error;
  errors: Error[];
}

export interface UseAccountVotesOptions {
  accountName?: string;
  filter?: (vote: AccountVote) => boolean;
}

export interface UseAccountVotesResult {
  accountVotes: AccountVote[];
  state: string;
  error?: Error;
  errors: Error[];
}

export interface UseAccountVoteOptions {
  commentCid?: string;
  accountName?: string;
}

export interface UseAccountVoteResult extends AccountVote {
  state: string;
  error?: Error;
  errors: Error[];
}

export interface UseAccountEditsOptions {
  accountName?: string;
  filter?: (edit: CommentEdit) => boolean;
}

export interface UseAccountEditsResult {
  accountEdits: CommentEdit[];
  state: string;
  error?: Error;
  errors: Error[];
}

export interface UseEditedCommentOptions {
  comment?: Comment;
  accountName?: string;
}

export interface UseEditedCommentResult {
  editedComment?: Comment;
  succeededEdits: Record<string, unknown>;
  pendingEdits: Record<string, unknown>;
  failedEdits: Record<string, unknown>;
  state: string;
  error?: Error;
  errors: Error[];
}

export interface UseNotificationsOptions {
  accountName?: string;
}

export interface UseNotificationsResult {
  notifications: Notification[];
  unreadNotificationCount: number;
  markAsRead: (notification: Notification) => Promise<void>;
  state: string;
  error?: Error;
  errors: Error[];
}

export interface UsePubsubSubscribeOptions {
  accountName?: string;
  subplebbitAddress?: string;
}

export interface UsePubsubSubscribeResult {
  state: string;
  error?: Error;
  errors: Error[];
}