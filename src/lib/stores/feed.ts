import { writable, derived, get } from 'svelte/store';
import type { Comment, FeedOptions } from '../types/index.js';
import { getPlebbit } from '../utils/plebbit.js';

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
}>({
  loading: false,
  error: null,
  posts: []
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
    if (options) {
      feedOptionsStore.update((currentOptions) => ({
        ...currentOptions,
        ...options
      }));
    }

    // Setze den Ladestatus
    feedStore.update((state) => ({
      ...state,
      loading: true,
      error: null
    }));

    // Hole die aktuellen Feed-Optionen
    const currentOptions = get(feedOptionsStore);
    console.log('Aktuelle Feed-Optionen:', currentOptions);
    // Überprüfe, ob Subplebbit-Adressen angegeben sind
    if (!currentOptions.subplebbitAddresses || currentOptions.subplebbitAddresses.length === 0) {
      throw new Error('Keine Subplebbit-Adressen angegeben');
    }

    // Hole die Plebbit-Instanz
    const plebbit = await getPlebbit();
    console.log('Plebbit-Instanz geladen:', plebbit);
    // Hole Posts für jede Subplebbit-Adresse
    const postsPromises = currentOptions.subplebbitAddresses.map(async (address) => {
        const subplebbit = await plebbit.getSubplebbit(address);
        console.log(`Geladene Subplebbit: ${subplebbit.address}`,subplebbit);
        let allPosts = [];
        // let postsPage = await subplebbit.posts.getPage(subplebbit.posts.pageCids.new);
        console.log('subplebbit.posts.pageCids',subplebbit.posts.pageCids)
        console.log('subplebbit.posts.pages', Object.values(subplebbit.posts.pages)[0].comments)
        // Wenn die Subplebbit-Posts bereits geladen sind, verwende diese
          // if (Object.keys(subplebbit.posts.pageCids).length !== 0) {
          //   console.log("subplebbit.posts.pageCids", subplebbit.posts.pageCids);
          //   let postsPage = await subplebbit.posts.getPage(subplebbit.posts.pageCids.new);
          //   allPosts = [...postsPage.comments];
            
          //   while (postsPage.nextCid) {
          //     try {
          //       postsPage = await subplebbit.posts.getPage(postsPage.nextCid);
          //       allPosts = allPosts.concat(postsPage.comments);
          //     } catch (err) {
          //       console.error(`Error loading next page (${postsPage.nextCid}):`, err);
          //       break;
          //     }
          //   }
          // } else {
          //   allPosts = Object.values(subplebbit.posts.pages)[0].comments;
          // }


      console.log(`Geladene Subplebbit: ${subplebbit.address} mit ${subplebbit.posts.pages.hot.comments || 0} Posts`);

      //console.log(`Geladene Subplebbit: ${subplebbit.address} mit ${subplebbit.posts?.length || 0} Posts`);

      // return subplebbit.posts || [];
      return subplebbit.posts.pages.hot.comments || [];
    });

    // Warte auf alle Promises
    const postsArrays = await Promise.all(postsPromises);
    console.log('Alle geladenen Posts:', postsArrays);
    // Kombiniere alle Posts
    let allPosts = postsArrays.flat();

    // Sortiere die Posts basierend auf dem sortType
    if (currentOptions.sortType === 'new') {
      allPosts = allPosts.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    } else if (currentOptions.sortType === 'top') {
      allPosts = allPosts.sort((a, b) => (b.upvoteCount || 0) - (a.upvoteCount || 0));
    }
    console.log('Alle Posts nach Sortierung:', allPosts);

    // Begrenze die Anzahl der Posts, wenn ein Limit angegeben ist
    if (currentOptions.limit && currentOptions.limit > 0) {
      allPosts = allPosts.slice(0, currentOptions.limit);
    }

    // Aktualisiere den Store mit den geladenen Posts
    feedStore.update((state) => ({
      ...state,
      loading: false,
      posts: allPosts
    }));
  } catch (err) {
    // Setze den Fehlerstatus
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