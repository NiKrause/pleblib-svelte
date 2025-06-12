import { get } from 'svelte/store';
import type {
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
  UseCreateSubplebbitResult,
  Challenge,
  ChallengeVerification
} from '../../types/index.js';
import { getPlebbit } from '../../utils/plebbit.js';
import { accountsStore, useAccountId } from '../accounts/accounts.js';
import { writable } from 'svelte/store';

// Hilfsfunktion für Challenge-Antworten
type PublishChallengeAnswers = (challengeAnswers: string[]) => Promise<void>;
const publishChallengeAnswersNotReady: PublishChallengeAnswers = async () => {
  throw Error(`Kann publishChallengeAnswers() nicht aufrufen, bevor result.challenge definiert ist (bevor die Challenge-Nachricht empfangen wurde)`);
};

/**
 * Hook zum Abonnieren einer Subplebbit
 * @param options - Optionen für das Abonnement
 */
export function useSubscribe(options?: UseSubscribeOptions): UseSubscribeResult {
  const { subplebbitAddress, accountName, onError } = options || {};
  const accountId = useAccountId(accountName);
  const currentStore = get(accountsStore);
  const account = currentStore.accounts[accountId || ''];
  const errors: Error[] = [];
  
  let state = 'initializing';
  let subscribed: boolean | undefined;

  // Bevor das Konto und die Subplebbit-Adresse definiert sind, kann nichts passieren
  if (account && subplebbitAddress) {
    state = 'ready';
    subscribed = Boolean(account.subscriptions?.includes(subplebbitAddress));
  }

  const subscribe = async () => {
    try {
      // Subplebbit abonnieren
      accountsStore.update(state => {
        const account = state.accounts[accountId || ''];
        
        if (!account) {
          throw new Error(`Konto ${accountName || 'aktiv'} nicht gefunden`);
        }
        
        // Subplebbit zur Liste der Abonnements hinzufügen
        const subscriptions = account.subscriptions || [];
        if (!subscriptions.includes(subplebbitAddress || '')) {
          const newSubscriptions = [...subscriptions, subplebbitAddress || ''];
          
          // Konto aktualisieren
          const newAccount = {
            ...account,
            subscriptions: newSubscriptions
          };
          
          // Konten aktualisieren
          const newAccounts = {
            ...state.accounts,
            [accountId || '']: newAccount
          };
          
          return {
            ...state,
            accounts: newAccounts
          };
        }
        
        return state;
      });
    } catch (e: any) {
      errors.push(e);
      onError?.(e);
    }
  };

  const unsubscribe = async () => {
    try {
      // Abonnement aufheben
      accountsStore.update(state => {
        const account = state.accounts[accountId || ''];
        
        if (!account) {
          throw new Error(`Konto ${accountName || 'aktiv'} nicht gefunden`);
        }
        
        // Subplebbit aus der Liste der Abonnements entfernen
        const subscriptions = account.subscriptions || [];
        const index = subscriptions.indexOf(subplebbitAddress || '');
        
        if (index !== -1) {
          const newSubscriptions = [...subscriptions];
          newSubscriptions.splice(index, 1);
          
          // Konto aktualisieren
          const newAccount = {
            ...account,
            subscriptions: newSubscriptions
          };
          
          // Konten aktualisieren
          const newAccounts = {
            ...state.accounts,
            [accountId || '']: newAccount
          };
          
          return {
            ...state,
            accounts: newAccounts
          };
        }
        
        return state;
      });
    } catch (e: any) {
      errors.push(e);
      onError?.(e);
    }
  };

  return {
    subscribed,
    subscribe,
    unsubscribe,
    state,
    error: errors[errors.length - 1],
    errors
  };
}

/**
 * Hook zum Blockieren einer Adresse oder CID
 * @param options - Optionen für die Blockierung
 */
export function useBlock(options?: UseBlockOptions): UseBlockResult {
  const { address, cid, accountName, onError } = options || {};
  
  if (address && cid) {
    throw Error(`Kann nicht useBlock mit sowohl einer Adresse '${address}' als auch einer CID '${cid}' gleichzeitig verwenden`);
  }
  
  const accountId = useAccountId(accountName);
  const currentStore = get(accountsStore);
  const account = currentStore.accounts[accountId || ''];
  const errors: Error[] = [];
  
  let state = 'initializing';
  let blocked: boolean | undefined;

  // Bevor das Konto und die Adresse oder CID definiert sind, kann nichts passieren
  if (account && (address || cid)) {
    state = 'ready';
    if (address) {
      blocked = Boolean(account.blockedAddresses?.[address]);
    } else if (cid) {
      blocked = Boolean(account.blockedCids?.[cid]);
    }
  }

  const block = async () => {
    try {
      // Adresse oder CID blockieren
      accountsStore.update(state => {
        const account = state.accounts[accountId || ''];
        
        if (!account) {
          throw new Error(`Konto ${accountName || 'aktiv'} nicht gefunden`);
        }
        
        // Adresse oder CID blockieren
        let newAccount = { ...account };
        
        if (address) {
          const blockedAddresses = account.blockedAddresses || {};
          newAccount = {
            ...newAccount,
            blockedAddresses: {
              ...blockedAddresses,
              [address]: true
            }
          };
        }
        
        if (cid) {
          const blockedCids = account.blockedCids || {};
          newAccount = {
            ...newAccount,
            blockedCids: {
              ...blockedCids,
              [cid]: true
            }
          };
        }
        
        // Konten aktualisieren
        const newAccounts = {
          ...state.accounts,
          [accountId || '']: newAccount
        };
        
        return {
          ...state,
          accounts: newAccounts
        };
      });
    } catch (e: any) {
      errors.push(e);
      onError?.(e);
    }
  };

  const unblock = async () => {
    try {
      // Blockierung aufheben
      accountsStore.update(state => {
        const account = state.accounts[accountId || ''];
        
        if (!account) {
          throw new Error(`Konto ${accountName || 'aktiv'} nicht gefunden`);
        }
        
        // Blockierung aufheben
        let newAccount = { ...account };
        
        if (address && account.blockedAddresses) {
          const blockedAddresses = { ...account.blockedAddresses };
          delete blockedAddresses[address];
          
          newAccount = {
            ...newAccount,
            blockedAddresses
          };
        }
        
        if (cid && account.blockedCids) {
          const blockedCids = { ...account.blockedCids };
          delete blockedCids[cid];
          
          newAccount = {
            ...newAccount,
            blockedCids
          };
        }
        
        // Konten aktualisieren
        const newAccounts = {
          ...state.accounts,
          [accountId || '']: newAccount
        };
        
        return {
          ...state,
          accounts: newAccounts
        };
      });
    } catch (e: any) {
      errors.push(e);
      onError?.(e);
    }
  };

  return {
    blocked,
    block,
    unblock,
    state,
    error: errors[errors.length - 1],
    errors
  };
}

/**
 * Hook zum Veröffentlichen eines Kommentars
 * @param options - Optionen für den Kommentar
 */
export function usePublishComment(options?: UsePublishCommentOptions): UsePublishCommentResult {
  const { accountName, ...publishCommentOptions } = options || {};
  const accountId = useAccountId(accountName);
  
  const errors = writable<Error[]>([]);
  const publishingState = writable<string>('initializing');
  const index = writable<number | undefined>(undefined);
  const challenge = writable<Challenge | undefined>(undefined);
  const challengeVerification = writable<ChallengeVerification | undefined>(undefined);
  const publishChallengeAnswers = writable<PublishChallengeAnswers | undefined>(undefined);

  let initialState = 'initializing';
  // Bevor die accountId und die Optionen definiert sind, kann nichts passieren
  if (accountId && options) {
    initialState = 'ready';
    publishingState.set(initialState);
  }

  // onError definieren, wenn nicht definiert
  const originalOnError = publishCommentOptions.onError;
  const onError = async (error: Error) => {
    errors.update(errors => [...errors, error]);
    originalOnError?.(error);
  };
  publishCommentOptions.onError = onError;

  // onChallenge definieren, wenn nicht definiert
  const originalOnChallenge = publishCommentOptions.onChallenge;
  const onChallenge = async (challengeData: Challenge, comment: any) => {
    // Kann eine Funktion nicht direkt mit setState setzen
    publishChallengeAnswers.set(() => comment?.publishChallengeAnswers.bind(comment));
    challenge.set(challengeData);
    originalOnChallenge?.(challengeData, comment);
  };
  publishCommentOptions.onChallenge = onChallenge;

  // onChallengeVerification definieren, wenn nicht definiert
  const originalOnChallengeVerification = publishCommentOptions.onChallengeVerification;
  const onChallengeVerification = async (challengeVerificationData: ChallengeVerification, comment: any) => {
    challengeVerification.set(challengeVerificationData);
    originalOnChallengeVerification?.(challengeVerificationData, comment);
  };
  publishCommentOptions.onChallengeVerification = onChallengeVerification;

  // Status bei Änderung des Veröffentlichungsstatus ändern
  publishCommentOptions.onPublishingStateChange = (state: string) => {
    publishingState.set(state);
  };

  const publishComment = async () => {
    try {
      // Kommentar erstellen und veröffentlichen
      const plebbit = await getPlebbit();
      const comment = await plebbit.createComment(publishCommentOptions);
      
      // Kommentar veröffentlichen
      await comment.publish();
      
      // Kommentar zum Store hinzufügen
      accountsStore.update(state => {
        const accountComments = state.accountsComments[accountId || ''] || [];
        const newIndex = accountComments.length;
        index.set(newIndex);
        
        // Neuen Kommentar hinzufügen
        const newAccountComments = [...accountComments, comment];
        
        // AccountsComments aktualisieren
        const newAccountsComments = {
          ...state.accountsComments,
          [accountId || '']: newAccountComments
        };
        
        return {
          ...state,
          accountsComments: newAccountsComments
        };
      });
    } catch (e: any) {
      errors.update(errors => [...errors, e]);
      publishCommentOptions.onError?.(e);
    }
  };

  // Aktuelle Werte aus den Stores abrufen
  const currentErrors = get(errors);
  const currentPublishingState = get(publishingState);
  const currentIndex = get(index);
  const currentChallenge = get(challenge);
  const currentChallengeVerification = get(challengeVerification);
  const currentPublishChallengeAnswers = get(publishChallengeAnswers);

  return {
    index: currentIndex,
    challenge: currentChallenge,
    challengeVerification: currentChallengeVerification,
    publishComment,
    publishChallengeAnswers: currentPublishChallengeAnswers || publishChallengeAnswersNotReady,
    state: currentPublishingState || initialState,
    error: currentErrors[currentErrors.length - 1],
    errors: currentErrors
  };
}

/**
 * Hook zum Bearbeiten einer Subplebbit
 * @param options - Optionen für die Bearbeitung
 */
export function usePublishSubplebbitEdit(options?: UsePublishSubplebbitEditOptions): UsePublishSubplebbitEditResult {
  const { accountName, subplebbitAddress, ...publishSubplebbitEditOptions } = options || {};
  const accountId = useAccountId(accountName);
  
  const errors = writable<Error[]>([]);
  const publishingState = writable<string>('initializing');
  const challenge = writable<Challenge | undefined>(undefined);
  const challengeVerification = writable<ChallengeVerification | undefined>(undefined);
  const publishChallengeAnswers = writable<PublishChallengeAnswers | undefined>(undefined);

  let initialState = 'initializing';
  // Bevor die accountId und die Subplebbit-Adresse definiert sind, kann nichts passieren
  if (accountId && subplebbitAddress) {
    initialState = 'ready';
    publishingState.set(initialState);
  }

  // onError definieren, wenn nicht definiert
  const originalOnError = publishSubplebbitEditOptions.onError;
  const onError = async (error: Error) => {
    errors.update(errors => [...errors, error]);
    originalOnError?.(error);
  };
  publishSubplebbitEditOptions.onError = onError;

  // onChallenge definieren, wenn nicht definiert
  const originalOnChallenge = publishSubplebbitEditOptions.onChallenge;
  const onChallenge = async (challengeData: Challenge, subplebbitEdit: any) => {
    // Kann eine Funktion nicht direkt mit setState setzen
    publishChallengeAnswers.set(() => subplebbitEdit?.publishChallengeAnswers.bind(subplebbitEdit));
    challenge.set(challengeData);
    originalOnChallenge?.(challengeData, subplebbitEdit);
  };
  publishSubplebbitEditOptions.onChallenge = onChallenge;

  // onChallengeVerification definieren, wenn nicht definiert
  const originalOnChallengeVerification = publishSubplebbitEditOptions.onChallengeVerification;
  const onChallengeVerification = async (challengeVerificationData: ChallengeVerification, subplebbitEdit: any) => {
    challengeVerification.set(challengeVerificationData);
    originalOnChallengeVerification?.(challengeVerificationData, subplebbitEdit);
  };
  publishSubplebbitEditOptions.onChallengeVerification = onChallengeVerification;

  // Status bei Änderung des Veröffentlichungsstatus ändern
  publishSubplebbitEditOptions.onPublishingStateChange = (state: string) => {
    publishingState.set(state);
  };

  const publishSubplebbitEdit = async () => {
    try {
      // Überprüfen, ob eine Subplebbit-Adresse angegeben ist
      if (!subplebbitAddress) {
        throw new Error('Keine Subplebbit-Adresse angegeben');
      }
      
      // Plebbit-Instanz abrufen
      const plebbit = await getPlebbit();
      
      // Get the subplebbit instance first
      const subplebbit = await plebbit.createSubplebbit({ address: subplebbitAddress });
      
      // Edit the subplebbit with the updates
      await subplebbit.edit({
        title: publishSubplebbitEditOptions.title,
        description: publishSubplebbitEditOptions.description
      });
      
      console.log('Subplebbit erfolgreich bearbeitet:', {
        subplebbitAddress,
        title: publishSubplebbitEditOptions.title,
        description: publishSubplebbitEditOptions.description
      });
      
    } catch (error) {
      const typedError = error instanceof Error ? error : new Error(String(error));
      errors.update(errors => [...errors, typedError]);
      publishSubplebbitEditOptions.onError?.(typedError);
    }
  };

  // Aktuelle Werte aus den Stores abrufen
  const currentErrors = get(errors);
  const currentPublishingState = get(publishingState);
  const currentChallenge = get(challenge);
  const currentChallengeVerification = get(challengeVerification);
  const currentPublishChallengeAnswers = get(publishChallengeAnswers);

  return {
    challenge: currentChallenge,
    challengeVerification: currentChallengeVerification,
    publishSubplebbitEdit,
    publishChallengeAnswers: currentPublishChallengeAnswers || publishChallengeAnswersNotReady,
    state: currentPublishingState || initialState,
    error: currentErrors[currentErrors.length - 1],
    errors: currentErrors
  };
}

// Export der Hauptfunktionen
export default {
  useSubscribe,
  useBlock,
  usePublishComment,
  usePublishSubplebbitEdit
};