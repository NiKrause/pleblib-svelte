import { writable, derived, get } from 'svelte/store';
import type {
  Account,
  AccountComment,
  AccountComments,
  AccountsState,
  AccountCommentsReplies,
  AccountsCommentsReplies,
  AccountsComments,
  Accounts,
  AccountsVotes,
  AccountsEdits,
  UseAccountOptions,
  UseAccountResult,
  UseAccountsResult,
  UseAccountCommentsOptions,
  UseAccountCommentsResult,
  UseAccountCommentOptions,
  UseAccountCommentResult,
  UseAccountVotesOptions,
  UseAccountVotesResult,
  UseAccountVoteOptions,
  UseAccountVoteResult,
  UseAccountEditsOptions,
  UseAccountEditsResult,
  UseEditedCommentOptions,
  UseEditedCommentResult,
  UsePubsubSubscribeOptions,
  UsePubsubSubscribeResult
} from '../../types/index.js';
import { getPlebbit } from '../../utils/plebbit.js';

// Store für Accounts
export const accountsStore = writable<AccountsState>({
  accounts: {},
  accountIds: [],
  activeAccountId: null,
  accountNamesToAccountIds: {},
  accountsComments: {},
  accountsCommentsReplies: {},
  accountsVotes: {},
  accountsEdits: {}
});

// Hilfsfunktionen für berechnete Eigenschaften
function getAccountCalculatedProperties(accountComments?: AccountComments, notifications?: { markedAsRead?: boolean }[]) {
  const accountCalculatedProperties: Record<string, unknown> = {};

  // Karma berechnen
  const karma = {
    replyUpvoteCount: 0,
    replyDownvoteCount: 0,
    replyScore: 0,
    postUpvoteCount: 0,
    postDownvoteCount: 0,
    postScore: 0,
    upvoteCount: 0,
    downvoteCount: 0,
    score: 0
  };

  for (const comment of accountComments || []) {
    if (comment.parentCid && comment.upvoteCount) {
      karma.replyUpvoteCount += comment.upvoteCount;
    }
    if (comment.parentCid && comment.downvoteCount) {
      karma.replyDownvoteCount += comment.downvoteCount;
    }
    if (!comment.parentCid && comment.upvoteCount) {
      karma.postUpvoteCount += comment.upvoteCount;
    }
    if (!comment.parentCid && comment.downvoteCount) {
      karma.postDownvoteCount += comment.downvoteCount;
    }
  }

  karma.replyScore = karma.replyUpvoteCount - karma.replyDownvoteCount;
  karma.postScore = karma.postUpvoteCount - karma.postDownvoteCount;
  karma.upvoteCount = karma.replyUpvoteCount + karma.postUpvoteCount;
  karma.downvoteCount = karma.replyDownvoteCount + karma.postDownvoteCount;
  karma.score = karma.upvoteCount - karma.downvoteCount;
  accountCalculatedProperties.karma = karma;

  // Ungelesene Benachrichtigungen zählen
  let unreadNotificationCount = 0;
  for (const notification of notifications || []) {
    if (!notification.markedAsRead) {
      unreadNotificationCount++;
    }
  }
  accountCalculatedProperties.unreadNotificationCount = unreadNotificationCount;

  return accountCalculatedProperties;
}

// Abgeleitete Stores
export const accounts = derived(
  accountsStore,
  ($accountsStore) => {
    const accountsArray: Account[] = [];
    if ($accountsStore.accountIds?.length && $accountsStore.accounts) {
      for (const accountId of $accountsStore.accountIds) {
        accountsArray.push($accountsStore.accounts[accountId]);
      }
    }
    return accountsArray;
  }
);

export const activeAccount = derived(
  accountsStore,
  ($accountsStore) => {
    return $accountsStore.activeAccountId ? $accountsStore.accounts[$accountsStore.activeAccountId] : undefined;
  }
);

// Hooks
/**
 * Gibt die Account-ID basierend auf dem Namen zurück
 * @param accountName - Der Name des Kontos
 */
export function useAccountId(accountName?: string): string | undefined {
  const currentStore = get(accountsStore);
  const accountId = currentStore.accountNamesToAccountIds[accountName || ''];
  const activeAccountId = !accountName ? currentStore.activeAccountId : null;
  return accountName ? accountId : (activeAccountId || undefined);
}

/**
 * Gibt ein Konto basierend auf dem Namen zurück
 * @param options - Optionen für das Konto
 */
export function useAccount(options?: UseAccountOptions): UseAccountResult {
  const { accountName } = options || {};
  
  // Account-ID abrufen
  const accountId = useAccountId(accountName);
  
  // Account aus dem Store abrufen
  const currentStore = get(accountsStore);
  const accountStore = currentStore.accounts[accountId || ''];
  const accountComments = currentStore.accountsComments[accountId || ''];
  const accountCommentsReplies = currentStore.accountsCommentsReplies[accountId || ''];
  
  // Berechnete Eigenschaften hinzufügen
  const calculatedProperties = getAccountCalculatedProperties(accountComments, []);
  const account = { ...accountStore, ...calculatedProperties };
  
  const state = accountId ? 'succeeded' : 'initializing';
  
  return {
    ...account,
    state,
    error: undefined,
    errors: []
  };
}

/**
 * Gibt alle Konten zurück
 */
export function useAccounts(): UseAccountsResult {
  const currentStore = get(accountsStore);
  const accountIds = currentStore.accountIds;
  const accountsStore_ = currentStore.accounts;
  const accountsComments = currentStore.accountsComments;
  
  const accountsArray: Account[] = [];
  if (accountIds?.length && accountsStore_) {
    for (const accountId of accountIds) {
      const account = accountsStore_[accountId];
      const comments = accountsComments[accountId];
      const calculatedProperties = getAccountCalculatedProperties(comments, []);
      accountsArray.push({ ...account, ...calculatedProperties });
    }
  }
  
  const state = accountsArray?.length ? 'succeeded' : 'initializing';
  
  return {
    accounts: accountsArray,
    state,
    error: undefined,
    errors: []
  };
}

/**
 * Gibt die Kommentare eines Kontos zurück
 * @param options - Optionen für die Kommentare
 */
export function useAccountComments(options?: UseAccountCommentsOptions): UseAccountCommentsResult {
  const { accountName, filter } = options || {};
  const accountId = useAccountId(accountName);
  const currentStore = get(accountsStore);
  const accountComments = currentStore.accountsComments[accountId || ''];
  
  // Kommentare filtern, wenn ein Filter angegeben ist
  const filteredAccountComments = accountComments ? 
    (filter ? accountComments.filter(filter) : accountComments) : 
    [];
  
  // Status für jeden Kommentar berechnen
  const filteredAccountCommentsWithStates = filteredAccountComments.map(comment => ({
    ...comment,
    state: 'succeeded'
  }));
  
  const state = accountId ? 'succeeded' : 'initializing';
  
  return {
    accountComments: filteredAccountCommentsWithStates,
    state,
    error: undefined,
    errors: []
  };
}

/**
 * Gibt einen einzelnen Kommentar eines Kontos zurück
 * @param options - Optionen für den Kommentar
 */
export function useAccountComment(options?: UseAccountCommentOptions): UseAccountCommentResult {
  const { commentIndex, accountName } = options || {};
  const { accountComments } = useAccountComments({ accountName });
  const accountComment = accountComments[Number(commentIndex)] || {};
  const state = accountComment ? 'succeeded' : 'initializing';
  
  return {
    ...accountComment,
    state,
    error: accountComment?.error,
    errors: accountComment?.errors || []
  };
}

// Export der Hauptfunktionen
export default {
  accountsStore,
  accounts,
  activeAccount,
  useAccountId,
  useAccount,
  useAccounts,
  useAccountComments,
  useAccountComment
};