import { describe, it, expect, vi, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { 
  publishStore, 
  publishOptionsStore, 
  publishComment, 
  setPublishOptions, 
  answerChallenge,
  resetPublish 
} from './publish.js';
import { getPlebbit } from '../utils/plebbit.js';
import type { PublishableComment, Challenge } from '../types/index.js';

// Mock der getPlebbit-Funktion
vi.mock('../utils/plebbit.js', () => {
  return {
    getPlebbit: vi.fn()
  };
});

describe('Publish Store', () => {
  // Mock-Daten für Tests
  const mockChallenge: Challenge = {
    type: 'captcha',
    challenge: 'Was ist 2+2?'
  };

  // Mock für einen veröffentlichbaren Kommentar
  const createMockPublishableComment = () => {
    const eventHandlers: Record<string, Array<(data: unknown) => void>> = {
      challenge: [],
      challengeverification: [],
      error: []
    };

    const mockComment: Partial<PublishableComment> = {
      cid: 'test-cid',
      title: 'Test Comment',
      content: 'Test Content',
      subplebbitAddress: 'test.eth',
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      on: (event: string, callback: any) => {
        if (!eventHandlers[event]) {
          eventHandlers[event] = [];
        }
        eventHandlers[event].push(callback);
        return;
      },
      
      publish: vi.fn().mockImplementation(async () => {
        // Simuliere eine Challenge nach der Veröffentlichung
        setTimeout(() => {
          eventHandlers.challenge.forEach(handler => handler(mockChallenge));
        }, 10);
        return Promise.resolve();
      }),
      
      publishChallengeAnswer: vi.fn().mockImplementation((answer: string) => {
        // Simuliere eine erfolgreiche Challenge-Verifizierung
        setTimeout(() => {
          eventHandlers.challengeverification.forEach(handler => 
            handler({ challengeSuccess: answer === '4' })
          );
        }, 10);
      })
    };

    return mockComment as PublishableComment;
  };

  // Mock der Plebbit-Instanz
  const mockPlebbit = {
    createComment: vi.fn().mockImplementation(() => createMockPublishableComment())
  };

  beforeEach(() => {
    // Setze den Mock zurück
    vi.resetAllMocks();
    
    // Setze die Stores zurück
    publishStore.set({
      publishing: false,
      publishingError: null,
      challenge: null,
      challengeVerification: null,
      comment: null
    });
    
    publishOptionsStore.set({
      subplebbitAddress: '',
      title: '',
      content: '',
      parentCid: undefined,
      signer: undefined
    });
    
    // Setze den Mock für getPlebbit
    (getPlebbit as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockPlebbit);
  });

  it('sollte mit Standardwerten initialisiert werden', () => {
    const publishState = get(publishStore);
    const optionsState = get(publishOptionsStore);
    
    expect(publishState).toEqual({
      publishing: false,
      publishingError: null,
      challenge: null,
      challengeVerification: null,
      comment: null
    });
    
    expect(optionsState).toEqual({
      subplebbitAddress: '',
      title: '',
      content: '',
      parentCid: undefined,
      signer: undefined
    });
  });

  it('sollte einen Kommentar veröffentlichen und eine Challenge erhalten', async () => {
    // Setze die Publish-Optionen
    setPublishOptions({
      subplebbitAddress: 'test.eth',
      content: 'Test Content'
    });
    
    // Veröffentliche den Kommentar
    const publishPromise = publishComment();
    
    // Überprüfe, ob der Publishing-Status auf true gesetzt wurde
    expect(get(publishStore).publishing).toBe(true);
    
    // Warte auf die Veröffentlichung
    await publishPromise;
    
    // Warte auf die Challenge (simuliert durch setTimeout im Mock)
    await new Promise(resolve => setTimeout(resolve, 20));
    
    // Überprüfe, ob getPlebbit aufgerufen wurde
    expect(getPlebbit).toHaveBeenCalled();
    
    // Überprüfe, ob createComment mit den richtigen Optionen aufgerufen wurde
    expect(mockPlebbit.createComment).toHaveBeenCalledWith({
      subplebbitAddress: 'test.eth',
      content: 'Test Content',
      title: '',
      parentCid: undefined,
      signer: undefined
    });
    
    // Überprüfe, ob die Challenge gesetzt wurde
    const publishState = get(publishStore);
    expect(publishState.challenge).toEqual(mockChallenge);
  });

  it('sollte eine Challenge beantworten können', async () => {
    // Setze die Publish-Optionen und veröffentliche den Kommentar
    setPublishOptions({
      subplebbitAddress: 'test.eth',
      content: 'Test Content'
    });
    
    await publishComment();
    
    // Warte auf die Challenge
    await new Promise(resolve => setTimeout(resolve, 20));
    
    // Beantworte die Challenge
    await answerChallenge('4');
    
    // Warte auf die Challenge-Verifizierung
    await new Promise(resolve => setTimeout(resolve, 20));
    
    // Überprüfe, ob die Challenge-Verifizierung gesetzt wurde
    const publishState = get(publishStore);
    expect(publishState.challengeVerification).toEqual({ challengeSuccess: true });
  });

  it('sollte einen Fehler setzen, wenn keine Subplebbit-Adresse angegeben ist', async () => {
    await publishComment();
    
    const publishState = get(publishStore);
    expect(publishState.publishing).toBe(false);
    expect(publishState.publishingError).toBeInstanceOf(Error);
    expect(publishState.publishingError?.message).toBe('Keine Subplebbit-Adresse angegeben');
  });

  it('sollte einen Fehler setzen, wenn weder Titel noch Inhalt angegeben ist', async () => {
    setPublishOptions({
      subplebbitAddress: 'test.eth'
    });
    
    await publishComment();
    
    const publishState = get(publishStore);
    expect(publishState.publishing).toBe(false);
    expect(publishState.publishingError).toBeInstanceOf(Error);
    expect(publishState.publishingError?.message).toBe('Weder Titel noch Inhalt angegeben');
  });

  it('sollte den Store zurücksetzen, wenn resetPublish aufgerufen wird', async () => {
    // Setze die Publish-Optionen und veröffentliche den Kommentar
    setPublishOptions({
      subplebbitAddress: 'test.eth',
      content: 'Test Content'
    });
    
    await publishComment();
    
    // Warte auf die Challenge
    await new Promise(resolve => setTimeout(resolve, 20));
    
    // Überprüfe, ob die Challenge gesetzt wurde
    expect(get(publishStore).challenge).toEqual(mockChallenge);
    
    // Setze den Store zurück
    resetPublish();
    
    // Überprüfe, ob der Store zurückgesetzt wurde
    const publishState = get(publishStore);
    expect(publishState).toEqual({
      publishing: false,
      publishingError: null,
      challenge: null,
      challengeVerification: null,
      comment: null
    });
  });
});