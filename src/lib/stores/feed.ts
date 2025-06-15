import { writable, derived, get } from 'svelte/store';
import type { Comment, FeedOptions } from '../types/index.js';
import { getPlebbit } from '../utils/plebbit.js';
import { getSubplebbitInstance } from './subplebbits.js';

// Constants from plebbit-react-hooks
const DEFAULT_POSTS_PER_PAGE = 25;
const POSTS_LEFT_BEFORE_NEXT_PAGE = 50;

// Store für Feed-Optionen
export const feedOptionsStore = writable<FeedOptions>({
  subplebbitAddresses: [],
  sortType: 'new',
  limit: 50
});

// Store für Feed-Daten
export const feedStore = writable<{
  loading: boolean;
  error: Error | null;
  posts: Comment[];
  bufferedPosts: Comment[];
  hasMore: boolean;
}>({
  loading: false,
  error: null,
  posts: [],
  bufferedPosts: [],
  hasMore: true
});

// Abgeleiteter Store, der die Posts basierend auf den Optionen zurückgibt
export const posts = derived(
  [feedStore],
  ([$feedStore]) => $feedStore.posts
);

// Abgeleiteter Store, der den Ladestatus zurückgibt
export const loading = derived(
  [feedStore],
  ([$feedStore]) => $feedStore.loading
);

// Abgeleiteter Store, der den Fehlerstatus zurückgibt
export const error = derived(
  [feedStore],
  ([$feedStore]) => $feedStore.error
);

/**
 * Lädt Posts basierend auf den angegebenen Optionen
 * @param options - Optionen für den Feed
 */
export async function loadFeed(options?: Partial<FeedOptions>): Promise<void> {
  try {
    // Aktualisiere die Feed-Optionen, wenn angegeben
    console.log('Loading feed with options:', options);
    if (options) {
      feedOptionsStore.update((currentOptions) => ({
        ...currentOptions,
        ...options
      }));
    }

    // Setze den Ladestatus
    console.log('Setting loading status to true');
    feedStore.update((state) => ({
      ...state,
      loading: true,
      error: null
    }));

    // Hole die aktuellen Feed-Optionen
    console.log('Getting current options');
    const currentOptions = get(feedOptionsStore);
    console.log('Aktuelle Feed-Optionen:', currentOptions);
    // Überprüfe, ob Subplebbit-Adressen angegeben sind
    if (!currentOptions.subplebbitAddresses || currentOptions.subplebbitAddresses.length === 0) {
      throw new Error('Keine Subplebbit-Adressen angegeben');
    }

    // Hole die Plebbit-Instanz
    console.log('Getting Plebbit instance');
    const plebbit = await getPlebbit();
    console.log('Plebbit-Instanz geladen:', plebbit);
    // Hole Posts für jede Subplebbit-Adresse
    const postsPromises = currentOptions.subplebbitAddresses.map(async (address) => {
      const subplebbit = await getSubplebbitInstance(address);
      
      // Set up event listener
      if (!subplebbit._hasUpdateListener) {
        console.log('Setting up update listener');
        subplebbit.on('update', (post) => {
          console.log('New post arrived adding to feed', post);
          feedStore.update(state => ({
            ...state,
            posts: [post, ...state.posts],
            bufferedPosts: [post, ...state.bufferedPosts]
          }));
        });
        subplebbit._hasUpdateListener = true;
      }

      let allPosts = [];
      const sortType = currentOptions.sortType || 'new';
      console.log('Subplebbit:', subplebbit.posts);

      // First try to get posts from pages.hot.comments if available
      if (subplebbit.posts.pages?.hot?.comments) {
        allPosts = [...subplebbit.posts.pages.hot.comments];
      } else {
        // Fall back to the original pageCids logic
        const pageCid = subplebbit.posts.pageCids[sortType];
        console.log('Page CID:', pageCid);
        if (pageCid) {
          try {
            // Get first page
            let postsPage = await subplebbit.posts.getPage(pageCid);
            allPosts = [...postsPage.comments];
            
            // Load more pages if needed
            while (postsPage.nextCid && allPosts.length < POSTS_LEFT_BEFORE_NEXT_PAGE) {
              try {
                postsPage = await subplebbit.posts.getPage(postsPage.nextCid);
                allPosts = allPosts.concat(postsPage.comments);
              } catch (err) {
                console.error(`Error loading next page:`, err);
                break;
              }
            }
          } catch (err) {
            console.error(`Error loading first page:`, err);
          }
        }
      }
      console.log('All posts:', allPosts);
      return allPosts;
    });
    console.log('Loading posts');
    const postsArrays = await Promise.all(postsPromises);
    let allPosts = postsArrays.flat();
    console.log('All posts:', allPosts);
    // Sort posts
    if (currentOptions.sortType === 'new') {
      allPosts = allPosts.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    } else if (currentOptions.sortType === 'top') {
      allPosts = allPosts.sort((a, b) => (b.upvoteCount || 0) - (a.upvoteCount || 0));
    }

    // Split into loaded and buffered posts
    const loadedPosts = allPosts.slice(0, currentOptions.limit || DEFAULT_POSTS_PER_PAGE);
    const bufferedPosts = allPosts.slice(currentOptions.limit || DEFAULT_POSTS_PER_PAGE);
    console.log('Loaded posts:', loadedPosts);
    console.log('Buffered posts:', bufferedPosts);
    feedStore.update((state) => ({
      ...state,
      loading: false,
      posts: loadedPosts,
      bufferedPosts,
      hasMore: bufferedPosts.length > 0
    }));

  } catch (err) {
    console.error('Error loading feed:', err);
    feedStore.update((state) => ({
      ...state,
        loading: false,
        error: err instanceof Error ? err : new Error(String(err))
    }));
  }
}

/**
 * Setzt die Feed-Optionen und lädt den Feed neu
 * @param options - Neue Feed-Optionen
 */
export async function setFeedOptions(options: Partial<FeedOptions>): Promise<void> {
  await loadFeed(options);
}

/**
 * Aktualisiert den Feed mit den aktuellen Optionen
 */
export async function refreshFeed(): Promise<void> {
  await loadFeed();
}

// New function to load more posts
export async function loadMorePosts(): Promise<void> {
  const state = get(feedStore);
  if (!state.hasMore || state.loading) return;

  feedStore.update(state => ({ ...state, loading: true }));
  
  try {
    const currentOptions = get(feedOptionsStore);
    const newLimit = (currentOptions.limit || DEFAULT_POSTS_PER_PAGE) + DEFAULT_POSTS_PER_PAGE;
    
    await loadFeed({ ...currentOptions, limit: newLimit });
  } catch (err) {
    console.error('Error loading more posts:', err);
  }
}