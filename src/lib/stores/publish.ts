import { writable, derived, get } from 'svelte/store';
import type {
  PublishCommentOptions,
  PublishCommentState,
  Challenge,
  PublishableComment
} from '../types/index.js';
import { getPlebbit } from '../utils/plebbit.js';

// Store für Publish-Optionen
export const publishOptionsStore = writable<PublishCommentOptions>({
  subplebbitAddress: '',
  title: '',
  content: '',
  parentCid: undefined,
  signer: undefined
});

// Store für Publish-Status
export const publishStore = writable<PublishCommentState>({
  publishing: false,
  publishingError: null,
  challenge: null,
  challengeVerification: null,
  comment: null
});

// Abgeleitete Stores
export const publishing = derived(
  [publishStore],
  ([$publishStore]) => $publishStore.publishing
);

export const publishingError = derived(
  [publishStore],
  ([$publishStore]) => $publishStore.publishingError
);

export const challenge = derived(
  [publishStore],
  ([$publishStore]) => $publishStore.challenge
);

export const challengeVerification = derived(
  [publishStore],
  ([$publishStore]) => $publishStore.challengeVerification
);

export const comment = derived(
  [publishStore],
  ([$publishStore]) => $publishStore.comment
);

// Add this interface at the top of the file
interface StoredComment extends PublishableComment {
  _methods?: {
    publishChallengeAnswer: (challengeAnswer: any) => void;
    publish: () => Promise<void>;
    stop: () => void;
    on: (event: string, callback: (data: any) => void) => void;
  };
}

/**
 * Veröffentlicht einen Kommentar oder Post basierend auf den angegebenen Optionen
 * @param options - Optionen für die Veröffentlichung
 * @param challengeAnswer - Antwort auf die Challenge (optional)
 */
export async function publishComment(
  options?: Partial<PublishCommentOptions>,
  challengeAnswer?: string
): Promise<void> {
  try {
    console.log("publishComment: options:", options)
    if (options) {
      publishOptionsStore.update((currentOptions) => ({
        ...currentOptions,
        ...options
      }));
    }

    // Setze den Publishing-Status
    publishStore.update((state) => ({
      ...state,
      publishing: true,
      publishingError: null
    }));

    // Hole die aktuellen Publish-Optionen
    const currentOptions = get(publishOptionsStore);
    console.log("currentOptions after store update:", currentOptions)

    // Überprüfe, ob eine Subplebbit-Adresse angegeben ist
    if (!currentOptions.subplebbitAddress) {
      throw new Error('Keine Subplebbit-Adresse angegeben');
    }

    // Überprüfe, ob Inhalt vorhanden ist
    if (!currentOptions.content && !currentOptions.title) {
      throw new Error('Weder Titel noch Inhalt angegeben');
    }

    // Hole die Plebbit-Instanz
    const plebbit = await getPlebbit();
    console.log("plebbit instance:", plebbit)
    console.log("currentOptions before comment creation:", currentOptions)
    
    const accounts = await plebbit.listAccounts?.() || [];
    console.log('Available accounts:', accounts);
    const defaultAccount = accounts[0];
    console.log('Using default account:', defaultAccount);

    // Erstelle den Kommentar
    const signer = await plebbit.createSigner();
    const getRandomString = () => (Math.random() + 1).toString(36).replace('.', '');
    const comment = await plebbit.createComment({
      signer,
      subplebbitAddress: currentOptions.subplebbitAddress,
      title: currentOptions.title || `Post ${getRandomString()}`,
      content: currentOptions.content || `Content ${getRandomString()}`
    }) as PublishableComment;
    
    console.log("Comment created successfully:", comment);

    let challengeTimeout: NodeJS.Timeout

    comment.on('challenge', (challengeData) => {
      console.log("Challenge received:", challengeData);
      // Extract the first challenge from the challenges array
      const firstChallenge = challengeData.challenges?.[0];
      if (firstChallenge) {
        publishStore.update((state) => ({
          ...state,
          challenge: firstChallenge
        }));
      }
      clearTimeout(challengeTimeout)
    });

    comment.on('challengeverification', (challengeVerification) => {
      console.log("Challenge verification received:", challengeVerification);
      publishStore.update((state) => ({
        ...state,
        challengeVerification
      }));
      clearTimeout(challengeTimeout)
      comment.stop()
    });

    comment.on('error', (error) => {
      console.error("Error during publishing:", error);
      publishStore.update((state) => ({
        ...state,
        publishing: false,
        publishingError: error
      }));
      clearTimeout(challengeTimeout)
      comment.stop()
    });

    comment.on('publishingstatechange', (state) => {
      console.log("Publishing state changed:", state);
      if(state === 'publishing-challenge-request') {
        console.log("publishing-challenge-request");
      }
      if(state === 'publishing-challenge-response') {
        console.log("publishing-challenge-response");
      }
      if (state === 'succeeded' || state === 'failed' || state === 'waiting-challenge-answers') {
        publishStore.update((currentState) => ({
          ...currentState,
          publishing: state !== 'succeeded',
          publishingError: state === 'failed' ? new Error('Publishing failed') : null
        }));
      }
      if (state === 'waiting-challenge-answers') {
        challengeTimeout = setTimeout(() => {
          console.log("Challenge timeout");
          comment.stop()
        }, 30000)
      }
    });

    // Wenn eine Challenge-Antwort angegeben ist, beantworte die Challenge
    if (challengeAnswer) {
      console.log("Using provided challenge answer:", challengeAnswer);
      const currentState = get(publishStore);
      if (currentState.challenge) {
        console.log("Publishing challenge answer...");
        (comment as unknown as PublishableComment).publishChallengeAnswer(challengeAnswer);
      } else {
        console.log("No challenge found in current state");
      }
    } else {
      // Starte die Veröffentlichung
      console.log("Starting comment publication...");
      await comment.publish();
      console.log("Comment published successfully");
    }

    // Update the store with the comment directly
    publishStore.update((state) => ({
      ...state,
      comment: comment
    }));
  } catch (err) {
    console.error("Error in publishComment:", err);
    // Setze den Fehlerstatus
    publishStore.update((state) => ({
      ...state,
      publishing: false,
      publishingError: err instanceof Error ? err : new Error(String(err))
    }));
  }
}

/**
 * Beantwortet eine Challenge für einen Kommentar
 * @param answer - Antwort auf die Challenge
 */
export async function answerChallenge(answer: string): Promise<void> {
  const currentState = get(publishStore);
  
  console.log("Current state:", currentState);
  console.log("Comment object:", currentState.comment);
  
  if (!currentState.comment) {
    throw new Error('Kein Kommentar zum Beantworten der Challenge vorhanden');
  }
  
  if (!currentState.challenge) {
    throw new Error('Keine Challenge zum Beantworten vorhanden');
  }

  try {
    const comment = currentState.comment;
    // Ensure we have the subplebbit property
    console.log("Comment object:", comment);
    if (!comment.subplebbit) {
      const plebbit = await getPlebbit();
      const subplebbit = await plebbit.getSubplebbit(comment.subplebbitAddress);
      comment.subplebbit = subplebbit;
    }
    
    console.log("Comment object:", comment);
    comment.publishChallengeAnswers([answer]);
  } catch (err) {
    console.error("Error in answerChallenge:", err);
    publishStore.update((state) => ({
      ...state,
      publishingError: err instanceof Error ? err : new Error(String(err))
    }));
  }
}

/**
 * Setzt die Publish-Optionen
 * @param options - Neue Publish-Optionen
 */
export function setPublishOptions(options: Partial<PublishCommentOptions>): void {
  publishOptionsStore.update((currentOptions) => ({
    ...currentOptions,
    ...options
  }));
}

/**
 * Setzt den Publish-Store zurück
 */
export function resetPublish(): void {
  publishStore.set({
    publishing: false,
    publishingError: null,
    challenge: null,
    challengeVerification: null,
    comment: null
  });
}