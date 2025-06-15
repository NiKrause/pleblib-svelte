<script lang="ts">
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';
  
  // Props
  export let onSuccess: () => void = () => {};
  export let onError: (error: Error) => void = () => {};
  export let challenge: any = null;
  
  // Local state
  let answer = '';
  let loading = false;
  let error: Error | null = null;
  
  // Handler for form submission
  async function handleSubmit() {
    if (!challenge) {
      error = new Error('No challenge available');
      onError(error);
      return;
    }
    
    if (!answer) {
      error = new Error('Please enter an answer');
      onError(error);
      return;
    }
    
    try {
      loading = true;
      error = null;
      
      // Answer the challenge using plebbit-js
      await challenge.answer(answer);
      
      // Call success callback
      onSuccess();
    } catch (err) {
      error = err instanceof Error ? err : new Error(String(err));
      onError(error);
    } finally {
      loading = false;
    }
  }
</script>

<div class="captcha-container">
  {#if challenge}
    <div class="challenge">
      <h3>Challenge</h3>
      
      {#if challenge.type === 'captcha'}
        <p>{challenge.challenge}</p>
      {:else if challenge.type === 'image/png' || challenge.challenge?.startsWith('iVBORw0KGgoAAAANSUhEUgAA')}
        <img 
          src={`data:image/png;base64,${challenge.challenge}`} 
          alt="Captcha" 
          class="captcha-image"
        />
      {:else}
        <p>Unknown challenge type: {challenge.type}</p>
      {/if}
      
      <form on:submit|preventDefault={handleSubmit}>
        <div class="input-group">
          <label for="captcha-answer">Answer:</label>
          <input
            id="captcha-answer"
            type="text"
            bind:value={answer}
            disabled={loading}
            placeholder="Enter your answer"
          />
        </div>
        
        <button type="submit" disabled={loading || !answer}>
          {loading ? 'Submitting...' : 'Submit'}
        </button>
      </form>
      
      {#if error}
        <div class="error">
          <p>{error.message}</p>
        </div>
      {/if}
    </div>
  {:else}
    <p>No challenge available</p>
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