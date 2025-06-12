// Typdefinitionen für Authors
import type { Comment, Author, Plebbit } from './accounts.js';

// NFT-Typen für Autor-Avatare
export interface Nft {
  address?: string;
  id?: string;
  chainTicker?: string;
  timestamp?: number;
  signature?: {
    signature?: string;
    type?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

// Chain-Provider-Typen
export interface ChainProvider {
  urls?: string[];
  chainId?: number;
  [key: string]: unknown;
}

export interface ChainProviders {
  [chainTicker: string]: ChainProvider;
}

// Filter für Autor-Kommentare
export type CommentsFilter = {
  key: string;
  (comment: Comment): boolean;
};

// Hook-Optionen und Ergebnisse
export interface UseAuthorOptions {
  authorAddress?: string;
  commentCid?: string;
  accountName?: string;
}

export interface UseAuthorResult {
  author?: Author;
  state: string;
  error?: Error;
  errors: Error[];
}

export interface UseAuthorCommentsOptions {
  authorAddress?: string;
  commentCid?: string;
  accountName?: string;
  filter?: CommentsFilter;
}

export interface UseAuthorCommentsResult {
  authorComments: Comment[];
  lastCommentCid?: string;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  state: string;
  error?: Error;
  errors: Error[];
}

export interface UseAuthorAvatarOptions {
  author?: Author;
  accountName?: string;
}

export interface UseAuthorAvatarResult {
  imageUrl?: string;
  metadataUrl?: string;
  chainProvider?: ChainProvider;
  state: string;
  error?: Error;
  errors: Error[];
}

export interface UseAuthorAddressOptions {
  comment?: Comment;
  accountName?: string;
}

export interface UseAuthorAddressResult {
  authorAddress?: string;
  shortAuthorAddress?: string;
  authorAddressChanged: boolean;
  state: string;
  error?: Error;
  errors: Error[];
}

export interface UseResolvedAuthorAddressOptions {
  author?: Author;
  accountName?: string;
  cache?: boolean;
}

export interface UseResolvedAuthorAddressResult {
  resolvedAddress?: string;
  chainProvider?: ChainProvider;
  state: string;
  error?: Error;
  errors: Error[];
}

// Store-Typen für Authors-Comments
export interface AuthorsCommentsState {
  loadedComments: {
    [authorCommentsName: string]: Comment[];
  };
  lastCommentCids: {
    [authorAddress: string]: string;
  };
  nextCommentCidsToFetch: {
    [authorAddress: string]: string;
  };
  hasMoreBufferedComments: {
    [authorCommentsName: string]: boolean;
  };
  pageNumbers: {
    [authorCommentsName: string]: number;
  };
  incrementPageNumber: (authorCommentsName: string) => void;
  addAuthorCommentsToStore: (
    authorCommentsName: string,
    authorAddress: string,
    commentCid: string,
    filter?: CommentsFilter,
    account?: { plebbit?: Plebbit; id?: string; [key: string]: unknown }
  ) => void;
}