import { writable, derived, get } from 'svelte/store';
import type { Comment, FeedOptions } from '../types/index.js';
import { getPlebbit } from '../utils/plebbit.js';

// Constants
const UPDATE_FEEDS_MIN_INTERVAL_TIME = 100; // ms
const SUBPLEBBIT_POSTS_LEFT_BEFORE_NEXT_PAGE = 50;

// Store for feed options
export const feedOptionsStore = writable<FeedOptions>({
  subplebbitAddresses: [],
  sortType: 'new',
  limit: 50
});

// Store for feed data with buffered and loaded feeds
export const feedStore = writable<{
  loading: boolean;
  error: Error | null;
  bufferedPosts: Comment[];
  loadedPosts: Comment[];
  updatedPosts: Comment[];
  subplebbitAddressesWithNewerPosts: string[];
  hasMore: boolean;
}>({
  loading: false,
  error: null,
  bufferedPosts: [],
  loadedPosts: [],
  updatedPosts: [],
  subplebbitAddressesWithNewerPosts: [],
  hasMore: false
});

// Derived stores
export const posts = derived(
  [feedStore],
  ([$feedStore]) => $feedStore.loadedPosts
);

export const loading = derived(
  [feedStore],
  ([$feedStore]) => $feedStore.loading
);

export const error = derived(
  [feedStore],
  ([$feedStore]) => $feedStore.error
);

// Track update state
let updateFeedsPending = false;
let previousSubplebbitAddresses: string[] = [];

/**
 * Updates the feed with new posts
 */
async function updateFeeds(): Promise<void> {
  if (updateFeedsPending) {
    return;
  }
  updateFeedsPending = true;

  // Throttle updates
  const timeUntilNextUpdate = Date.now() % UPDATE_FEEDS_MIN_INTERVAL_TIME;

  setTimeout(async () => {
    try {
      const currentOptions = get(feedOptionsStore);
      const currentState = get(feedStore);
      const plebbit = await getPlebbit();

      // Get all subplebbits
      const subplebbits = await Promise.all(
        currentOptions.subplebbitAddresses.map(address => plebbit.getSubplebbit(address))
      );

      // Set up listeners for each subplebbit
      subplebbits.forEach(sub => {
        // Listen for errors
        sub.on('error', (err) => {
          console.error(`Subplebbit error event for ${sub.address}:`, err);
          feedStore.update(state => ({
            ...state,
            error: new Error(`Subplebbit error: ${err.message}`)
          }));
        });

        // Listen for updates
        sub.on('update', async () => {
          console.log(`Subplebbit ${sub.address} updated, refreshing feed...`);
          try {
            // Get latest posts
            const latestPosts = sub.posts.pages.hot.comments || [];
            
            // Update store with new posts
            feedStore.update(state => {
              // Filter out old posts from this subplebbit
              const otherPosts = state.bufferedPosts.filter(post => 
                post.subplebbitAddress !== sub.address
              );
              
              // Combine with new posts
              const updatedPosts = [...otherPosts, ...latestPosts];
              
              // Sort based on current sort type
              const sortedPosts = currentOptions.sortType === 'new' 
                ? updatedPosts.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
                : updatedPosts.sort((a, b) => (b.upvoteCount || 0) - (a.upvoteCount || 0));
              
              // Update buffered posts
              const bufferedPosts = currentOptions.limit 
                ? sortedPosts.slice(0, currentOptions.limit)
                : sortedPosts;
              
              // Check if we have more posts to load
              const hasMore = latestPosts.length > currentOptions.limit;
              
              return {
                ...state,
                bufferedPosts,
                hasMore,
                subplebbitAddressesWithNewerPosts: [
                  ...state.subplebbitAddressesWithNewerPosts,
                  sub.address
                ].filter((v, i, a) => a.indexOf(v) === i) // Remove duplicates
              };
            });
          } catch (err) {
            console.error(`Error updating feed for subplebbit ${sub.address}:`, err);
            feedStore.update(state => ({
              ...state,
              error: new Error(`Update error: ${err.message}`)
            }));
          }
        });
      });

      // Load initial posts
      const postsPromises = subplebbits.map(async (sub) => {
        return sub.posts.pages.hot.comments || [];
      });

      const postsArrays = await Promise.all(postsPromises);
      let allPosts = postsArrays.flat();

      // Sort and limit posts
      if (currentOptions.sortType === 'new') {
        allPosts = allPosts.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      } else if (currentOptions.sortType === 'top') {
        allPosts = allPosts.sort((a, b) => (b.upvoteCount || 0) - (a.upvoteCount || 0));
      }

      if (currentOptions.limit && currentOptions.limit > 0) {
        allPosts = allPosts.slice(0, currentOptions.limit);
      }

      // Update store with loaded posts
      feedStore.update(state => ({
        ...state,
        loading: false,
        loadedPosts: allPosts,
        bufferedPosts: allPosts,
        hasMore: allPosts.length > currentOptions.limit
      }));

    } catch (err) {
      feedStore.update(state => ({
        ...state,
        loading: false,
        error: err instanceof Error ? err : new Error(String(err))
      }));
    } finally {
      updateFeedsPending = false;
    }
  }, timeUntilNextUpdate);
}

/**
 * Loads posts based on the given options
 */
export async function loadFeed(options?: Partial<FeedOptions>): Promise<void> {
  try {
    if (options) {
      feedOptionsStore.update((currentOptions) => ({
        ...currentOptions,
        ...options
      }));
    }

    feedStore.update((state) => ({
      ...state,
      loading: true,
      error: null
    }));

    await updateFeeds();
  } catch (err) {
    feedStore.update((state) => ({
      ...state,
      loading: false,
      error: err instanceof Error ? err : new Error(String(err))
    }));
  }
}

/**
 * Sets feed options and reloads the feed
 */
export async function setFeedOptions(options: Partial<FeedOptions>): Promise<void> {
  await loadFeed(options);
}

/**
 * Refreshes the feed with current options
 */
export async function refreshFeed(): Promise<void> {
  await loadFeed();
}