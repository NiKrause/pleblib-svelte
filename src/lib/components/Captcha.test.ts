import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/svelte';
import Captcha from './Captcha.svelte';
import * as publishStore from '../stores/publish.js';
import type { Challenge } from '../types/index.js';

// Mock des Publish-Stores
vi.mock('../stores/publish.js', async () => {
  const actual = await vi.importActual('../stores/publish.js');
  return {
    ...actual,
    challenge: {
      subscribe: vi.fn()
    },
    answerChallenge: vi.fn()
  };
});

describe('Captcha Component', () => {
  // Mock-Daten für Tests
  const mockChallenge: Challenge = {
    type: 'captcha',
    challenge: 'Was ist 2+2?'
  };

  // Mock-Callbacks
  const onSuccess = vi.fn();
  const onError = vi.fn();

  beforeEach(() => {
    // Setze die Mocks zurück
    vi.resetAllMocks();
    
    // Mock der subscribe-Methode
    let subscribeCallback: (value: Challenge | null) => void;
    (publishStore.challenge.subscribe as ReturnType<typeof vi.fn>).mockImplementation((callback) => {
      subscribeCallback = callback;
      // Rufe den Callback sofort mit null auf
      callback(null);
      // Gib eine Unsubscribe-Funktion zurück
      return () => {};
    });
    
    // Stelle die subscribeCallback-Funktion zur Verfügung
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (publishStore as any).triggerChallenge = (challenge: Challenge | null) => {
      if (subscribeCallback) {
        subscribeCallback(challenge);
      }
    };
    
    // Mock der answerChallenge-Methode
    (publishStore.answerChallenge as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
  });

  it('sollte "Keine Challenge vorhanden" anzeigen, wenn keine Challenge vorhanden ist', () => {
    render(Captcha, {
      props: {
        onSuccess,
        onError
      }
    });
    
    expect(screen.getByText('Keine Challenge vorhanden')).toBeTruthy();
  });

  it('sollte die Challenge anzeigen, wenn eine Challenge vorhanden ist', () => {
    render(Captcha, {
      props: {
        onSuccess,
        onError
      }
    });
    
    // Simuliere eine Challenge
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (publishStore as any).triggerChallenge(mockChallenge);
    
    expect(screen.getByText('Challenge')).toBeTruthy();
    expect(screen.getByText('Was ist 2+2?')).toBeTruthy();
  });

  it('sollte die Challenge beantworten, wenn das Formular abgesendet wird', async () => {
    render(Captcha, {
      props: {
        onSuccess,
        onError
      }
    });
    
    // Simuliere eine Challenge
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (publishStore as any).triggerChallenge(mockChallenge);
    
    // Gib eine Antwort ein
    const input = screen.getByLabelText('Antwort:');
    await fireEvent.input(input, { target: { value: '4' } });
    
    // Sende das Formular ab
    const button = screen.getByText('Absenden');
    await fireEvent.click(button);
    
    // Überprüfe, ob answerChallenge mit der richtigen Antwort aufgerufen wurde
    expect(publishStore.answerChallenge).toHaveBeenCalledWith('4');
    
    // Überprüfe, ob der Success-Callback aufgerufen wurde
    expect(onSuccess).toHaveBeenCalled();
  });

  it('sollte einen Fehler anzeigen, wenn keine Antwort eingegeben wurde', async () => {
    render(Captcha, {
      props: {
        onSuccess,
        onError
      }
    });
    
    // Simuliere eine Challenge
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (publishStore as any).triggerChallenge(mockChallenge);
    
    // Sende das Formular ab, ohne eine Antwort einzugeben
    const button = screen.getByText('Absenden');
    await fireEvent.click(button);
    
    // Überprüfe, ob der Error-Callback aufgerufen wurde
    expect(onError).toHaveBeenCalled();
    expect(onError.mock.calls[0][0].message).toBe('Bitte gib eine Antwort ein');
    
    // Überprüfe, ob die Fehlermeldung angezeigt wird
    expect(screen.getByText('Bitte gib eine Antwort ein')).toBeTruthy();
  });

  it('sollte einen Fehler anzeigen, wenn answerChallenge einen Fehler wirft', async () => {
    // Mock answerChallenge, um einen Fehler zu werfen
    const error = new Error('Test Error');
    (publishStore.answerChallenge as ReturnType<typeof vi.fn>).mockRejectedValue(error);
    
    render(Captcha, {
      props: {
        onSuccess,
        onError
      }
    });
    
    // Simuliere eine Challenge
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (publishStore as any).triggerChallenge(mockChallenge);
    
    // Gib eine Antwort ein
    const input = screen.getByLabelText('Antwort:');
    await fireEvent.input(input, { target: { value: '4' } });
    
    // Sende das Formular ab
    const button = screen.getByText('Absenden');
    await fireEvent.click(button);
    
    // Überprüfe, ob der Error-Callback aufgerufen wurde
    expect(onError).toHaveBeenCalledWith(error);
    
    // Überprüfe, ob die Fehlermeldung angezeigt wird
    expect(screen.getByText('Test Error')).toBeTruthy();
  });

  it('sollte den Antwort-State zurücksetzen, wenn sich die Challenge ändert', async () => {
    render(Captcha, {
      props: {
        onSuccess,
        onError
      }
    });
    
    // Simuliere eine Challenge
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (publishStore as any).triggerChallenge(mockChallenge);
    
    // Gib eine Antwort ein
    const input = screen.getByLabelText('Antwort:');
    await fireEvent.input(input, { target: { value: '4' } });
    
    // Simuliere eine neue Challenge
    const newChallenge: Challenge = {
      type: 'captcha',
      challenge: 'Was ist 3+3?'
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (publishStore as any).triggerChallenge(newChallenge);
    
    // Überprüfe, ob die Antwort zurückgesetzt wurde
    expect((input as HTMLInputElement).value).toBe('');
  });
});