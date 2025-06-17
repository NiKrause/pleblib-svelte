import { writable, derived, get } from 'svelte/store';
import type {
  PublishCommentOptions,
  PublishCommentState,
  Challenge,
  PublishableComment
} from '../types/index.js';
import { getPlebbit } from '../utils/plebbit.js';

// Store for publish options
export const publishOptionsStore = writable<PublishCommentOptions>({
  subplebbitAddress: '',
  title: '',
  content: '',
  parentCid: undefined,
  signer: undefined
});

// Store for publish status
export const publishStore = writable<PublishCommentState>({
  publishing: false,
  publishingError: null,
  challenge: null,
  challengeVerification: null,
  comment: null
});

// Derived stores
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
 * Publishes a comment or post based on the specified options
 * @param options - Options for publishing
 * @param challengeAnswer - Answer to the challenge (optional)
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

    // Set the publishing status
    publishStore.update((state) => ({
      ...state,
      publishing: true,
      publishingError: null
    }));

    // Get current publish options
    const currentOptions = get(publishOptionsStore);
    console.log("currentOptions after store update:", currentOptions)

    // Check if a subplebbit address is provided
    if (!currentOptions.subplebbitAddress) {
      throw new Error('No subplebbit address provided');
    }

    // Check if content exists
    if (!currentOptions.content && !currentOptions.title) {
      throw new Error('Neither title nor content provided');
    }

    // Get the Plebbit instance
    const plebbit = await getPlebbit();
    console.log("plebbit instance:", plebbit)
    console.log("currentOptions before comment creation:", currentOptions)
    
    const accounts = await plebbit.listAccounts?.() || [];
    console.log('Available accounts:', accounts);
    const defaultAccount = accounts[0];
    console.log('Using default account:', defaultAccount);

    // Create the comment
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

    // If a challenge answer is provided, answer the challenge
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
      // Start the publication
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
    // Set the error status
    publishStore.update((state) => ({
      ...state,
      publishing: false,
      publishingError: err instanceof Error ? err : new Error(String(err))
    }));
  }
}

/**
 * Answers a challenge for a comment
 * @param answer - Answer to the challenge
 */
export async function answerChallenge(answer: string): Promise<void> {
  const currentState = get(publishStore);
  
  console.log("Current state:", currentState);
  console.log("Comment object:", currentState.comment);
  
  if (!currentState.comment) {
    throw new Error('No comment available to answer the challenge');
  }
  
  if (!currentState.challenge) {
    throw new Error('No challenge available to answer');
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
 * Sets the publish options
 * @param options - New publish options
 */
export function setPublishOptions(options: Partial<PublishCommentOptions>): void {
  publishOptionsStore.update((currentOptions) => ({
    ...currentOptions,
    ...options
  }));
}

/**
 * Resets the publish store
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