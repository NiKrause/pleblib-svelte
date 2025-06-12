import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { get } from 'svelte/store';
import { feedStore, feedOptionsStore, loadFeed, setFeedOptions, refreshFeed } from './feed.js';
import { getPlebbit } from '../utils/plebbit.js';

// Mock der getPlebbit-Funktion
vi.mock('../utils/plebbit.js', () => {
  return {
    getPlebbit: vi.fn()
  };
});

describe('Feed Store', () => {
  // Mock-Daten für Tests
  const mockPosts = [
    { 
      cid: '1', 
      title: 'Test Post 1', 
      content: 'Test Content 1', 
      timestamp: 1000, 
      upvoteCount: 10 
    },
    { 
      cid: '2', 
      title: 'Test Post 2', 
      content: 'Test Content 2', 
      timestamp: 2000, 
      upvoteCount: 5 
    }
  ];

  const mockSubplebbit = {
    address: 'test.eth',
    posts: mockPosts
  };

  // Mock der Plebbit-Instanz
  const mockPlebbit = {
    getSubplebbit: vi.fn().mockResolvedValue(mockSubplebbit)
  };

  beforeEach(() => {
    // Setze den Mock zurück
    vi.resetAllMocks();
    
    // Setze die Stores zurück
    feedStore.set({
      loading: false,
      error: null,
      posts: []
    });
    
    feedOptionsStore.set({
      subplebbitAddresses: [],
      sortType: 'new',
      limit: 50
    });
    
    // Setze den Mock für getPlebbit
    (getPlebbit as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockPlebbit);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('sollte mit Standardwerten initialisiert werden', () => {
    const feedState = get(feedStore);
    const optionsState = get(feedOptionsStore);
    
    expect(feedState).toEqual({
      loading: false,
      error: null,
      posts: []
    });
    
    expect(optionsState).toEqual({
      subplebbitAddresses: [],
      sortType: 'new',
      limit: 50
    });
  });

  it('sollte Posts laden, wenn loadFeed aufgerufen wird', async () => {
    // Setze die Subplebbit-Adressen
    await setFeedOptions({ subplebbitAddresses: ['test.eth'] });
    
    // Überprüfe, ob getPlebbit aufgerufen wurde
    expect(getPlebbit).toHaveBeenCalled();
    
    // Überprüfe, ob getSubplebbit mit der richtigen Adresse aufgerufen wurde
    expect(mockPlebbit.getSubplebbit).toHaveBeenCalledWith('test.eth');
    
    // Überprüfe, ob die Posts geladen wurden
    const feedState = get(feedStore);
    expect(feedState.posts).toEqual(mockPosts);
    expect(feedState.loading).toBe(false);
    expect(feedState.error).toBe(null);
  });

  it('sollte einen Fehler setzen, wenn keine Subplebbit-Adressen angegeben sind', async () => {
    await loadFeed();
    
    const feedState = get(feedStore);
    expect(feedState.loading).toBe(false);
    expect(feedState.error).toBeInstanceOf(Error);
    expect(feedState.error?.message).toBe('Keine Subplebbit-Adressen angegeben');
  });

  it('sollte Posts nach Zeitstempel sortieren, wenn sortType "new" ist', async () => {
    // Setze die Subplebbit-Adressen und den sortType
    await setFeedOptions({ 
      subplebbitAddresses: ['test.eth'],
      sortType: 'new'
    });
    
    // Überprüfe, ob die Posts nach Zeitstempel sortiert wurden (neueste zuerst)
    const feedState = get(feedStore);
    expect(feedState.posts[0].timestamp).toBe(2000);
    expect(feedState.posts[1].timestamp).toBe(1000);
  });

  it('sollte Posts nach Upvotes sortieren, wenn sortType "top" ist', async () => {
    // Setze die Subplebbit-Adressen und den sortType
    await setFeedOptions({ 
      subplebbitAddresses: ['test.eth'],
      sortType: 'top'
    });
    
    // Überprüfe, ob die Posts nach Upvotes sortiert wurden (meiste zuerst)
    const feedState = get(feedStore);
    expect(feedState.posts[0].upvoteCount).toBe(10);
    expect(feedState.posts[1].upvoteCount).toBe(5);
  });

  it('sollte die Anzahl der Posts begrenzen, wenn ein Limit angegeben ist', async () => {
    // Setze die Subplebbit-Adressen und das Limit
    await setFeedOptions({ 
      subplebbitAddresses: ['test.eth'],
      limit: 1
    });
    
    // Überprüfe, ob die Anzahl der Posts begrenzt wurde
    const feedState = get(feedStore);
    expect(feedState.posts.length).toBe(1);
  });

  it('sollte den Feed aktualisieren, wenn refreshFeed aufgerufen wird', async () => {
    // Setze die Subplebbit-Adressen
    await setFeedOptions({ subplebbitAddresses: ['test.eth'] });
    
    // Setze den Mock zurück
    vi.resetAllMocks();
    (getPlebbit as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockPlebbit);
    
    // Rufe refreshFeed auf
    await refreshFeed();
    
    // Überprüfe, ob getPlebbit erneut aufgerufen wurde
    expect(getPlebbit).toHaveBeenCalled();
    
    // Überprüfe, ob getSubplebbit mit der richtigen Adresse aufgerufen wurde
    expect(mockPlebbit.getSubplebbit).toHaveBeenCalledWith('test.eth');
  });
});