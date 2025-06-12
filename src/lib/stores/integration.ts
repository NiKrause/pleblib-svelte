/**
 * Diese Datei integriert die bestehenden Stores mit den neuen Hooks
 * und bietet eine einheitliche Schnittstelle für die Anwendung.
 */

// Importiere bestehende Stores
import {
  feedOptionsStore,
  feedStore,
  posts,
  loading as feedLoading,
  error as feedError,
  loadFeed,
  setFeedOptions,
  refreshFeed
} from './feed.js';

import {
  commentOptionsStore,
  commentStore,
  comment,
  loading as commentLoading,
  error as commentError,
  loadComment,
  setCommentOptions,
  refreshComment
} from './comment.js';

import {
  repliesOptionsStore,
  repliesStore,
  replies,
  loading as repliesLoading,
  error as repliesError,
  loadReplies,
  setRepliesOptions,
  refreshReplies
} from './replies.js';

import {
  publishOptionsStore,
  publishStore,
  publishing,
  publishingError,
  challenge,
  challengeVerification,
  comment as publishedComment,
  publishComment,
  answerChallenge,
  setPublishOptions,
  resetPublish
} from './publish.js';

// Importiere neue Hooks
import {
  accountsStore,
  accounts,
  activeAccount,
  useAccountId,
  useAccount,
  useAccounts,
  useAccountComments,
  useAccountComment
} from './accounts/accounts.js';

import {
  useSubscribe,
  useBlock,
  usePublishComment as usePublishCommentAction,
  usePublishSubplebbitEdit
} from './actions/actions.js';

import {
  authorsCommentsStore,
  useAuthorCommentsName,
  usePlebbitAddress,
  useAuthorComments,
  useAuthor,
  useAuthorAvatar,
  useAuthorAddress,
  useResolvedAuthorAddress
} from './authors/authors.js';

// Exportiere alles für eine einheitliche Schnittstelle
export {
  // Feed
  feedOptionsStore,
  feedStore,
  posts,
  feedLoading,
  feedError,
  loadFeed,
  setFeedOptions,
  refreshFeed,
  
  // Comment
  commentOptionsStore,
  commentStore,
  comment,
  commentLoading,
  commentError,
  loadComment,
  setCommentOptions,
  refreshComment,
  
  // Replies
  repliesOptionsStore,
  repliesStore,
  replies,
  repliesLoading,
  repliesError,
  loadReplies,
  setRepliesOptions,
  refreshReplies,
  
  // Publish
  publishOptionsStore,
  publishStore,
  publishing,
  publishingError,
  challenge,
  challengeVerification,
  publishedComment,
  publishComment,
  answerChallenge,
  setPublishOptions,
  resetPublish,
  
  // Accounts
  accountsStore,
  accounts,
  activeAccount,
  useAccountId,
  useAccount,
  useAccounts,
  useAccountComments,
  useAccountComment,
  
  // Actions
  useSubscribe,
  useBlock,
  usePublishCommentAction,
  usePublishSubplebbitEdit,
  
  // Authors
  authorsCommentsStore,
  useAuthorCommentsName,
  usePlebbitAddress,
  useAuthorComments,
  useAuthor,
  useAuthorAvatar,
  useAuthorAddress,
  useResolvedAuthorAddress
};