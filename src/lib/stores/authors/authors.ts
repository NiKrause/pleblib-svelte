import { writable, derived, get } from 'svelte/store';
import type {
  Author,
  Comment,
  Plebbit,
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
  Nft,
  ChainProvider,
  CommentsFilter
} from '../../types/index.js';
import { getPlebbit } from '../../utils/plebbit.js';
import { useAccount, useAccountId } from '../accounts/accounts.js';

// Store für Authors-Comments
export const authorsCommentsStore = writable<{
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
}>({
  loadedComments: {},
  lastCommentCids: {},
  nextCommentCidsToFetch: {},
  hasMoreBufferedComments: {},
  pageNumbers: {}
});

// Cache für aufgelöste Autor-Adressen
const resolvedAuthorAddressCache = new Map<string, string>();
const resolveAuthorAddressPromises: Record<string, Promise<string>> = {};

/**
 * Generiert einen eindeutigen Namen für Autor-Kommentare
 * @param accountId - Die ID des Kontos
 * @param authorAddress - Die Adresse des Autors
 * @param filter - Der Filter für die Kommentare
 */
export function useAuthorCommentsName(accountId?: string, authorAddress?: string, filter?: CommentsFilter): string {
  return `${accountId || ''}-${authorAddress || ''}-${filter?.key || ''}`;
}

/**
 * Gibt die Plebbit-Adresse aus einem öffentlichen Schlüssel zurück
 * @param publicKeyBase64 - Der öffentliche Schlüssel in Base64
 */
export function usePlebbitAddress(publicKeyBase64?: string): string | undefined {
  if (!publicKeyBase64) {
    return undefined;
  }
  
  // In einer vollständigen Implementierung würde hier die Plebbit-Adresse aus dem öffentlichen Schlüssel abgeleitet werden
  // Dies ist eine vereinfachte Version
  return `plebbit-${publicKeyBase64.substring(0, 8)}`;
}

/**
 * Gibt die Kommentare eines Autors zurück
 * @param options - Optionen für die Autor-Kommentare
 */
export function useAuthorComments(options?: UseAuthorCommentsOptions): UseAuthorCommentsResult {
  const { authorAddress, commentCid, accountName, filter } = options || {};
  const account = useAccount({ accountName });
  const authorCommentsName = useAuthorCommentsName(account?.id, authorAddress, filter);
  
  // Store-Werte abrufen
  const currentStore = get(authorsCommentsStore);
  const authorComments = currentStore.loadedComments[authorCommentsName || ''] || [];
  const lastCommentCid = currentStore.lastCommentCids[authorAddress || ''];
  const hasMoreBufferedComments = currentStore.hasMoreBufferedComments[authorCommentsName || ''] || false;
  const hasNextCommentCidToFetch = Boolean(currentStore.nextCommentCidsToFetch[authorAddress || '']);
  
  // Autor-Kommentare zum Store hinzufügen
  if (authorAddress && commentCid && account) {
    addAuthorCommentsToStore(authorCommentsName, authorAddress, commentCid, filter, account);
  }
  
  const loadMore = async () => {
    try {
      if (!authorAddress || !account) {
        throw Error('useAuthorComments kann keine weiteren Kommentare laden, da noch nicht initialisiert');
      }
      
      // Seitenzahl erhöhen
      authorsCommentsStore.update(state => ({
        ...state,
        pageNumbers: {
          ...state.pageNumbers,
          [authorCommentsName || '']: (state.pageNumbers[authorCommentsName || ''] || 0) + 1
        }
      }));
    } catch (error) {
      // Warte 50 ms, damit Infinite Scroll diese Funktion nicht spammt
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  };
  
  const hasMore = hasMoreBufferedComments || hasNextCommentCidToFetch;
  
  // Autor-Ergebnis abrufen
  const authorResult = useAuthor({ commentCid, authorAddress, accountName });
  const state = authorResult.state;
  const errors = authorResult.errors;
  
  return {
    authorComments,
    lastCommentCid,
    hasMore,
    loadMore,
    state,
    error: errors[errors.length - 1],
    errors
  };
}

/**
 * Fügt Autor-Kommentare zum Store hinzu
 * @param authorCommentsName - Der Name der Autor-Kommentare
 * @param authorAddress - Die Adresse des Autors
 * @param commentCid - Die CID des Kommentars
 * @param filter - Der Filter für die Kommentare
 * @param account - Das Konto
 */
function addAuthorCommentsToStore(
  authorCommentsName: string,
  authorAddress: string,
  commentCid: string,
  filter?: CommentsFilter,
  account?: { plebbit?: Plebbit; id?: string; [key: string]: unknown }
) {
  try {
    // In einer vollständigen Implementierung würden hier die Kommentare des Autors abgerufen und zum Store hinzugefügt werden
    // Dies ist eine vereinfachte Version
    
    // Kommentar abrufen
    if (account?.plebbit) {
      account.plebbit.getComment(commentCid)
        .then(comment => {
          // Kommentar zum Store hinzufügen
          authorsCommentsStore.update(state => {
            const currentComments = state.loadedComments[authorCommentsName] || [];
            const filteredComment = filter ? (filter(comment) ? [comment] : []) : [comment];
            
            return {
              ...state,
              loadedComments: {
                ...state.loadedComments,
                [authorCommentsName]: [...currentComments, ...filteredComment]
              },
              lastCommentCids: {
                ...state.lastCommentCids,
                [authorAddress]: commentCid
              }
            };
          });
        })
        .catch(error => {
          console.error('Fehler beim Abrufen des Kommentars:', error);
        });
    }
  } catch (error) {
    console.error('Fehler beim Hinzufügen von Autor-Kommentaren zum Store:', error);
  }
}

/**
 * Gibt einen Autor zurück
 * @param options - Optionen für den Autor
 */
export function useAuthor(options?: UseAuthorOptions): UseAuthorResult {
  const { authorAddress, commentCid, accountName } = options || {};
  const errors: Error[] = [];
  let author: Author | undefined;
  let state = 'initializing';
  
  // Kommentar abrufen
  if (commentCid) {
    try {
      const plebbit = getPlebbit();
      
      // In einer vollständigen Implementierung würde hier der Kommentar abgerufen werden
      // Dies ist eine vereinfachte Version
      author = {
        address: authorAddress,
        displayName: `Author-${authorAddress?.substring(0, 5)}`
      };
      
      state = 'succeeded';
    } catch (error) {
      if (error instanceof Error) {
        errors.push(error);
      } else {
        errors.push(new Error(String(error)));
      }
      state = 'failed';
    }
  } else if (authorAddress) {
    // Wenn nur die Autor-Adresse angegeben ist
    author = {
      address: authorAddress,
      displayName: `Author-${authorAddress.substring(0, 5)}`
    };
    state = 'succeeded';
  } else {
    // Wenn weder Kommentar-CID noch Autor-Adresse angegeben ist
    errors.push(new Error('Es muss entweder eine Kommentar-CID oder eine Autor-Adresse angegeben werden'));
    state = 'failed';
  }
  
  return {
    author,
    state,
    error: errors[errors.length - 1],
    errors
  };
}

/**
 * Gibt den Avatar eines Autors zurück
 * @param options - Optionen für den Avatar
 */
export function useAuthorAvatar(options?: UseAuthorAvatarOptions): UseAuthorAvatarResult {
  const { author, accountName } = options || {};
  const account = useAccount({ accountName });
  const errors: Error[] = [];
  let state = 'initializing';
  let imageUrl: string | undefined;
  let metadataUrl: string | undefined;
  let chainProvider: ChainProvider | undefined;
  
  // Wenn kein Avatar vorhanden ist
  if (!author?.avatar) {
    state = 'initializing';
  } else {
    // In einer vollständigen Implementierung würde hier der Avatar abgerufen werden
    // Dies ist eine vereinfachte Version
    imageUrl = `https://example.com/avatar/${author.address}`;
    metadataUrl = `https://example.com/metadata/${author.address}`;
    chainProvider = account?.plebbitOptions?.chainProviders?.[author.avatar?.chainTicker || ''];
    state = 'succeeded';
  }
  
  return {
    imageUrl,
    metadataUrl,
    chainProvider,
    state,
    error: errors[errors.length - 1],
    errors
  };
}

/**
 * Gibt die Adresse eines Autors zurück
 * @param options - Optionen für die Autor-Adresse
 */
export function useAuthorAddress(options?: UseAuthorAddressOptions): UseAuthorAddressResult {
  const { comment, accountName } = options || {};
  const account = useAccount({ accountName });
  const errors: Error[] = [];
  
  // Prüfen, ob es sich um einen Krypto-Namen handelt
  const isCryptoName = !!comment?.author?.address?.includes?.('.');
  
  // Aufgelöste Adresse aus dem Cache abrufen
  const resolvedAddress = isCryptoName ? resolvedAuthorAddressCache.get(comment?.author?.address || '') : undefined;
  
  // Signer-Adresse abrufen
  const signerAddress = usePlebbitAddress(isCryptoName ? comment?.signature?.publicKey : undefined);
  
  // Autor-Adresse bestimmen
  let authorAddress = signerAddress;
  
  // Wenn die Autor-Adresse erfolgreich aufgelöst wurde, verwende die Autor-Adresse
  if (resolvedAddress && signerAddress === resolvedAddress) {
    authorAddress = comment?.author?.address;
  }
  
  // Wenn es sich nicht um einen Krypto-Namen handelt, verwende immer die Autor-Adresse
  if (!isCryptoName) {
    authorAddress = comment?.author?.address;
  }
  
  // Wenn der Kommentar keine Signatur hat, ist es ein ausstehender Konto-Kommentar, keine Überprüfung erforderlich
  if (comment && !comment?.signature) {
    authorAddress = comment?.author?.address;
  }
  
  // Kurze Autor-Adresse erstellen
  let shortAuthorAddress = authorAddress && authorAddress.substring(0, 8);
  
  // Wenn die kurze Adresse kleiner als der Krypto-Name ist, gib eine längere kurze Adresse zurück
  if (isCryptoName && authorAddress && shortAuthorAddress && shortAuthorAddress.length < (comment?.author?.address?.length || 0) - 4) {
    const restOfAuthorAddress = authorAddress.split(shortAuthorAddress).pop();
    shortAuthorAddress = (shortAuthorAddress + restOfAuthorAddress).substring(0, (comment?.author?.address?.length || 0) - 4);
  }
  
  return {
    authorAddress,
    shortAuthorAddress,
    authorAddressChanged: false,
    state: 'initializing',
    error: errors[errors.length - 1],
    errors
  };
}

/**
 * Löst die Adresse eines Autors auf
 * @param options - Optionen für die aufgelöste Autor-Adresse
 */
export function useResolvedAuthorAddress(options?: UseResolvedAuthorAddressOptions): UseResolvedAuthorAddressResult {
  const { author, accountName, cache = true } = options || {};
  const account = useAccount({ accountName });
  const errors: Error[] = [];
  let state = 'initializing';
  let resolvedAddress: string | undefined;
  let chainProvider: ChainProvider | undefined;
  
  // Wenn keine Optionen, kein Konto oder keine Autor-Adresse vorhanden sind
  if (!options || !account || !author?.address) {
    state = 'initializing';
  } else {
    // Prüfen, ob es sich um einen Krypto-Namen handelt
    const isCryptoName = author.address.includes('.');
    const tld = isCryptoName ? author.address.split('.').pop() : undefined;
    
    // Wenn es sich nicht um einen Krypto-Namen handelt, kann er nicht aufgelöst werden
    if (!isCryptoName) {
      errors.push(new Error('Keine Krypto-Domain'));
      state = 'failed';
    } else if (tld !== 'eth' && tld !== 'sol') {
      // Nur '.eth/.sol' werden derzeit unterstützt
      errors.push(new Error('Krypto-Domain-Typ nicht unterstützt'));
      state = 'failed';
    } else {
      // In einer vollständigen Implementierung würde hier die Autor-Adresse aufgelöst werden
      // Dies ist eine vereinfachte Version
      resolvedAddress = `resolved-${author.address}`;
      chainProvider = account.plebbitOptions?.chainProviders?.[tld];
      state = 'succeeded';
    }
  }
  
  return {
    resolvedAddress,
    chainProvider,
    state,
    error: errors[errors.length - 1],
    errors
  };
}

// Export der Hauptfunktionen
export default {
  authorsCommentsStore,
  useAuthorCommentsName,
  usePlebbitAddress,
  useAuthorComments,
  useAuthor,
  useAuthorAvatar,
  useAuthorAddress,
  useResolvedAuthorAddress
};