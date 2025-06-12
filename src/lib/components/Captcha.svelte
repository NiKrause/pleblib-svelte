<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { challenge, answerChallenge } from '../stores/publish.js';
  import type { Challenge } from '../types/index.js';
  
  // Props
  export let onSuccess: () => void = () => {};
  export let onError: (error: Error) => void = () => {};
  
  // Lokaler State
  let answer = '';
  let loading = false;
  let error: Error | null = null;
  
  // Challenge-Subscription
  let unsubscribe: () => void;
  let currentChallenge: Challenge | null = null;
  
  onMount(() => {
    // Abonniere den Challenge-Store
    unsubscribe = challenge.subscribe((value) => {
      currentChallenge = value;
      
      // Setze den Antwort-State zurück, wenn sich die Challenge ändert
      if (value) {
        answer = '';
        error = null;
      }
    });
  });
  
  onDestroy(() => {
    // Bereinige die Subscription
    if (unsubscribe) {
      unsubscribe();
    }
  });
  
  // Handler für die Formular-Übermittlung
  async function handleSubmit() {
    if (!currentChallenge) {
      error = new Error('Keine Challenge vorhanden');
      onError(error);
      return;
    }
    
    if (!answer) {
      error = new Error('Bitte gib eine Antwort ein');
      onError(error);
      return;
    }
    
    try {
      loading = true;
      error = null;
      
      // Beantworte die Challenge
      await answerChallenge(answer);
      
      // Rufe den Success-Callback auf
      onSuccess();
    } catch (err) {
      // Setze den Fehler-State
      error = err instanceof Error ? err : new Error(String(err));
      onError(error);
    } finally {
      loading = false;
    }
  }
</script>

<div class="captcha-container">
  {#if currentChallenge}
    <div class="challenge">
      <h3>Challenge</h3>
      
      {#if currentChallenge.type === 'captcha'}
        <p>{currentChallenge.challenge}</p>
      {:else if currentChallenge.type === 'image/png' || currentChallenge.challenge?.startsWith('iVBORw0KGgoAAAANSUhEUgAA')}
        <img 
          src={`data:image/png;base64,${currentChallenge.challenge}`} 
          alt="Captcha" 
          class="captcha-image"
        />
      {:else}
        <p>Unbekannter Challenge-Typ: {currentChallenge.type}</p>
      {/if}
      
      <form on:submit|preventDefault={handleSubmit}>
        <div class="input-group">
          <label for="captcha-answer">Antwort:</label>
          <input
            id="captcha-answer"
            type="text"
            bind:value={answer}
            disabled={loading}
            placeholder="Gib deine Antwort ein"
          />
        </div>
        
        <button type="submit" disabled={loading || !answer}>
          {loading ? 'Wird gesendet...' : 'Absenden'}
        </button>
      </form>
      
      {#if error}
        <div class="error">
          <p>{error.message}</p>
        </div>
      {/if}
    </div>
  {:else}
    <p>Keine Challenge vorhanden</p>
  {/if}
</div>

<style>
  .captcha-container {
    border: 1px solid #ccc;
    border-radius: 4px;
    padding: 16px;
    margin: 16px 0;
    max-width: 400px;
  }
  
  .challenge h3 {
    margin-top: 0;
    margin-bottom: 16px;
  }
  
  .input-group {
    margin-bottom: 16px;
  }
  
  .input-group label {
    display: block;
    margin-bottom: 4px;
  }
  
  .input-group input {
    width: 100%;
    padding: 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
  }
  
  button {
    background-color: #4caf50;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
  }
  
  button:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
  
  .error {
    color: #f44336;
    margin-top: 16px;
  }

  .captcha-image {
    max-width: 100%;
    height: auto;
    margin-bottom: 16px;
    border: 1px solid #eee;
    border-radius: 4px;
  }
</style>