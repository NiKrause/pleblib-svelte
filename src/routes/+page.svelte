<script lang="ts">
  import { onMount } from 'svelte';
  import {
    initPlebbit,
    loadFeed,
    posts,
    feedLoading,
    feedError,
    loadComment,
    comment,
    commentLoading,
    commentError,
    loadReplies,
    replies,
    repliesLoading,
    repliesError,
    publishComment,
    publishing,
    publishingError,
    challenge,
    Captcha,
    usePublishSubplebbitEdit,
    getPlebbit
  } from '../lib/index.js';
  import type { Subplebbit } from '../lib/types/index.js';
  
  // Variablen für die Subplebbit-Bearbeitung
  let subplebbitTitle = '';
  let subplebbitDescription = '';
  let editingSubplebbit = false;
  let editSubplebbitError: Error | null = null;
  
  // Add new variables for subplebbit info
  let subplebbitInfo = {
    title: '',
    description: ''
  };
  
  // Add new variables for account management
  let accounts: any[] = [];
  let newAccountName = '';
  let newAccountDisplayName = '';
  let creatingAccount = false;
  let accountError: Error | null = null;
  
  // Add new variables for subplebbit management
  let subplebbitAddress = '12D3KooWJzx833wsWBQxiRXsAhhWQnzrGKTPguaBY56JyCYrNum9';
  let savedSubplebbits: string[] = [];
  let creatingSubplebbit = false;
  let createSubplebbitError: Error | null = null;

  // Add these variables at the top with other variables
  let commentTitle = '';
  let commentContent = '';
  
  // Subscribe to comment updates
  if ($comment) {
    // The comment store will automatically update when the comment changes
    // thanks to the on('update') handler we added in comment.ts
    console.log('Subscribed to comment updates for:', $comment.cid);
  }
  
  // Initialisiere Plebbit beim Laden der Seite
  onMount(async () => {
    try {
      // Load saved subplebbits
      const saved = localStorage.getItem('savedSubplebbits');
      if (saved) {
        savedSubplebbits = JSON.parse(saved);
      }
      
      // Load last selected subplebbit
      const lastSelected = localStorage.getItem('lastSelectedSubplebbit');
      if (lastSelected) {
        subplebbitAddress = lastSelected;
      } else if (savedSubplebbits.length > 0) {
        // If no last selected but we have saved subplebbits, use the first one
        subplebbitAddress = savedSubplebbits[0];
      }
      
      // Initialize Plebbit
      const plebbitRpcClientsOptions = import.meta.env.VITE_PLEBBIT_RPC_CLIENTS_OPTIONS;
      await initPlebbit({plebbitRpcClientsOptions: [plebbitRpcClientsOptions]});
      console.log('Plebbit initialisiert');
      
      // Get subplebbit info using the current address
      const subplebbit = await loadSubplebbitInfo();
      if (subplebbit) {
        console.log('Subplebbit:', subplebbit);
        subplebbit.on('update', (post) => {
          console.log('Post:', post);
        });
      }
      
      // Load accounts
      await loadAccounts();
      
      // Load feed
      await loadFeed({
        subplebbitAddresses: [subplebbitAddress],
        sortType: 'new',
        limit: 10
      });
    } catch (error) {
      console.error('Fehler beim Initialisieren von Plebbit:', error);
    }
  });

  // Function to load accounts
  async function loadAccounts() {
    try {
      const plebbit = await getPlebbit();
      accounts = await plebbit.listAccounts?.() || [];
      console.log('Loaded accounts:', accounts);
    } catch (error) {
      console.error('Error loading accounts:', error);
      accountError = error instanceof Error ? error : new Error(String(error));
    }
  }

  // Funktion zum Laden eines Kommentars
  async function handleLoadComment(commentCid: string) {
    try {
      await loadComment({ commentCid });
      

    } catch (error) {
      console.error('Fehler beim Laden des Kommentars:', error);
    }
  }

  // Funktion zum Laden von Antworten
  async function handleLoadReplies() {
    if ($comment) {
      try {
        await loadReplies({ comment: $comment });
      } catch (error) {
        console.error('Fehler beim Laden der Antworten:', error);
      }
    }
  }

  // Funktion zum Veröffentlichen eines Kommentars
  async function handlePublishComment() {
    try {
      await publishComment({
        subplebbitAddress: subplebbitAddress,
        content: commentContent,
        title: commentTitle
      });
      // Clear the form after successful publishing
      commentTitle = '';
      commentContent = '';
    } catch (error) {
      console.error('Fehler beim Veröffentlichen des Kommentars:', error);
    }
  }

  // Callback-Funktionen für die Captcha-Komponente
  function handleCaptchaSuccess() {
    console.log('Captcha erfolgreich gelöst');
  }

  function handleCaptchaError(error: Error) {
    console.error('Fehler beim Lösen des Captchas:', error);
  }

  // Funktion zum Bearbeiten einer Subplebbit
  async function handleEditSubplebbit() {
    try {
      editingSubplebbit = true;
      editSubplebbitError = null;
      
      // Hook zum Bearbeiten einer Subplebbit verwenden
      const { publishSubplebbitEdit, state, error } = usePublishSubplebbitEdit({
        subplebbitAddress: subplebbitAddress,
        title: subplebbitTitle,
        description: subplebbitDescription,
        onPublishingStateChange: (newState) => {
          console.log('Subplebbit-Bearbeitung Status:', newState);
        },
        onError: (err) => {
          console.error('Fehler bei der Subplebbit-Bearbeitung:', err);
          editSubplebbitError = err;
        },
        onChallenge: (challenge) => {
          console.log('Challenge erhalten:', challenge);
        },
        onChallengeVerification: (verification) => {
          console.log('Challenge-Verifizierung erhalten:', verification);
          if (verification.challengeSuccess) {
            console.log('Subplebbit erfolgreich bearbeitet!');
          }
        }
      });
      
      // Subplebbit bearbeiten
      await publishSubplebbitEdit();
      
    } catch (error) {
      console.error('Fehler beim Bearbeiten der Subplebbit:', error);
      editSubplebbitError = error instanceof Error ? error : new Error(String(error));
    } finally {
      editingSubplebbit = false;
    }
  }

  // Function to create new account
  async function handleCreateAccount() {
    try {
      creatingAccount = true;
      accountError = null;
      
      const plebbit = await getPlebbit();
      
      // Create a new account using the Plebbit client
      const newAccount = await plebbit.createAccount?.({
        name: newAccountName,
        author: {
          displayName: newAccountDisplayName
        }
      });
      
      if (!newAccount) {
        throw new Error('Failed to create account');
      }
      
      // Refresh accounts list
      await loadAccounts();
      
      // Clear form
      newAccountName = '';
      newAccountDisplayName = '';
      
    } catch (error) {
      console.error('Fehler beim Erstellen des Accounts:', error);
      accountError = error instanceof Error ? error : new Error(String(error));
    } finally {
      creatingAccount = false;
    }
  }

  async function createSubplebbitWithoutChallenges() {
    try {
      const plebbit = await getPlebbit();
      
      const subplebbit = await plebbit.createSubplebbit({
        settings: {
          challenges: []
        }
      });
      
      await subplebbit.start();
      console.log('Subplebbit created with address:', subplebbit.address);
      
      return subplebbit;
    } catch (error) {
      console.error('Error creating subplebbit:', error);
      throw error;
    }
  }

  // Function to load subplebbit info
  async function loadSubplebbitInfo() {
    try {
      const plebbit = await getPlebbit();
      const subplebbit = await plebbit.getSubplebbit(subplebbitAddress) as Subplebbit;
      subplebbitInfo = {
        title: subplebbit.title || 'No Title',
        description: subplebbit.description || 'No Description'
      };
      // Update the form fields with current values
      subplebbitTitle = subplebbit.title || '';
      subplebbitDescription = subplebbit.description || '';
      return subplebbit;
    } catch (error) {
      console.error('Error loading subplebbit info:', error);
    }
  }

  // Function to handle subplebbit address change
  async function handleSubplebbitAddressChange() {
    try {
      // Save the selected subplebbit address to localStorage
      localStorage.setItem('lastSelectedSubplebbit', subplebbitAddress);
      
      await loadSubplebbitInfo();
      await loadFeed({
        subplebbitAddresses: [subplebbitAddress],
        sortType: 'new',
        limit: 10
      });
    } catch (error) {
      console.error('Error changing subplebbit address:', error);
    }
  }

  // Function to create and save new subplebbit
  async function handleCreateSubplebbit() {
    try {
      creatingSubplebbit = true;
      createSubplebbitError = null;
      
      const subplebbit = await createSubplebbitWithoutChallenges();
      
      // Add to saved subplebbits
      savedSubplebbits.push(subplebbit.address);
      localStorage.setItem('savedSubplebbits', JSON.stringify(savedSubplebbits));
      
      // Switch to the new subplebbit
      subplebbitAddress = subplebbit.address;
      await loadSubplebbitInfo();
      
    } catch (error) {
      console.error('Error creating subplebbit:', error);
      createSubplebbitError = error instanceof Error ? error : new Error(String(error));
    } finally {
      creatingSubplebbit = false;
    }
  }
</script>

<main>
  <h1>PlebLib Svelte Demo</h1>
  
  <!-- Add subplebbit info section -->
  <section class="subplebbit-info">
    <h2>{subplebbitInfo.title}</h2>
    <p>{subplebbitInfo.description}</p>
  </section>

  <!-- Add accounts section -->
  <section class="accounts-section">
    <h2>Accounts</h2>
    
    <!-- List existing accounts -->
    {#if accounts.length > 0}
      <div class="accounts-list">
        <h3>Existing Accounts</h3>
        <ul>
          {#each accounts as account}
            <li>
              <strong>{account.name || 'Unnamed Account'}</strong>
              {#if account.author?.displayName}
                <span class="display-name">({account.author.displayName})</span>
              {/if}
              <div class="account-address">
                Address: {account.author?.address || 'No address'}
              </div>
              {#if account.karma}
                <div class="account-karma">
                  Karma: {account.karma.score}
                </div>
              {/if}
            </li>
          {/each}
        </ul>
      </div>
    {:else}
      <p>No accounts found</p>
    {/if}
    
    <!-- Create new account form -->
    <div class="create-account">
      <h3>Create New Account</h3>
      <form on:submit|preventDefault={handleCreateAccount}>
        <div class="form-group">
          <label for="account-name">Account Name:</label>
          <input
            type="text"
            id="account-name"
            bind:value={newAccountName}
            placeholder="Enter account name"
            class="form-control"
            required
          />
        </div>
        
        <div class="form-group">
          <label for="display-name">Display Name:</label>
          <input
            type="text"
            id="display-name"
            bind:value={newAccountDisplayName}
            placeholder="Enter display name"
            class="form-control"
            required
          />
        </div>
        
        <button type="submit" disabled={creatingAccount}>
          {creatingAccount ? 'Creating...' : 'Create Account'}
        </button>
        
        {#if accountError}
          <p class="error">Error: {accountError.message}</p>
        {/if}
      </form>
    </div>
  </section>

  <section>
    <h2>Feed</h2>
    {#if $feedLoading}
      <p>Lade Feed...</p>
    {:else if $feedError}
      <p class="error">Fehler: {$feedError.message}</p>
    {:else if $posts.length === 0}
      <p>Keine Posts gefunden</p>
    {:else}
      <ul>
        {#each $posts as post}
          <li>
            <h3>{post.title || 'Kein Titel'}</h3>
            <p>{post.content || 'Kein Inhalt'}</p>
            <button on:click={() => handleLoadComment(post.cid || '')}>
              Kommentar laden
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  </section>

  <section>
    <h2>Kommentar</h2>
    {#if $commentLoading}
      <p>Lade Kommentar...</p>
    {:else if $commentError}
      <p class="error">Fehler: {$commentError.message}</p>
    {:else if $comment}
      <div class="comment">
        <h3>{$comment.title || 'Kein Titel'}</h3>
        <p>{$comment.content || 'Kein Inhalt'}</p>
        <p>
          Von: {$comment.author?.displayName || $comment.author?.address || 'Unbekannt'}
        </p>
        {#if $comment.timestamp}
          <p class="comment-timestamp">
            Erstellt: {new Date($comment.timestamp * 1000).toLocaleString()}
          </p>
        {/if}
        {#if $comment.updated}
          <p class="comment-updated">
            Aktualisiert: {new Date($comment.updated * 1000).toLocaleString()}
          </p>
        {/if}
        <button on:click={handleLoadReplies}>Antworten laden</button>
      </div>
    {:else}
      <p>Kein Kommentar ausgewählt</p>
    {/if}
  </section>

  <section>
    <h2>Antworten</h2>
    {#if $repliesLoading}
      <p>Lade Antworten...</p>
    {:else if $repliesError}
      <p class="error">Fehler: {$repliesError.message}</p>
    {:else if $replies.length === 0}
      <p>Keine Antworten gefunden</p>
    {:else}
      <ul>
        {#each $replies as reply}
          <li>
            <p>{reply.content || 'Kein Inhalt'}</p>
            <p>
              Von: {reply.author?.displayName || reply.author?.address || 'Unbekannt'}
            </p>
          </li>
        {/each}
      </ul>
    {/if}
  </section>

  <section>
    <h2>Kommentar veröffentlichen</h2>
    <form on:submit|preventDefault={handlePublishComment}>
      <div class="form-group">
        <label for="comment-title">Titel:</label>
        <input
          type="text"
          id="comment-title"
          bind:value={commentTitle}
          placeholder="Titel eingeben"
          class="form-control"
          required
        />
      </div>
      
      <div class="form-group">
        <label for="comment-content">Inhalt:</label>
        <textarea
          id="comment-content"
          bind:value={commentContent}
          placeholder="Inhalt eingeben"
          class="form-control"
          rows="4"
          required
        ></textarea>
      </div>
      
      <button type="submit" disabled={$publishing}>
        {$publishing ? 'Wird veröffentlicht...' : 'Kommentar veröffentlichen'}
      </button>
    </form>
    
    {#if $publishingError}
      <p class="error">Fehler: {$publishingError.message}</p>
    {/if}
    
    {#if $challenge}
      <div class="captcha-container">
        <Captcha onSuccess={handleCaptchaSuccess} onError={handleCaptchaError} />
      </div>
    {/if}
  </section>

  <section>
    <h2>Subplebbit bearbeiten</h2>
    <form on:submit|preventDefault={handleEditSubplebbit}>
      <div class="form-group">
        <label for="subplebbit-title">Titel:</label>
        <input
          type="text"
          id="subplebbit-title"
          bind:value={subplebbitTitle}
          placeholder="Neuer Titel für die Subplebbit"
          class="form-control"
        />
      </div>
      
      <div class="form-group">
        <label for="subplebbit-description">Beschreibung:</label>
        <textarea
          id="subplebbit-description"
          bind:value={subplebbitDescription}
          placeholder="Neue Beschreibung für die Subplebbit"
          class="form-control"
          rows="4"
        ></textarea>
      </div>
      
      <button type="submit" disabled={editingSubplebbit}>
        {editingSubplebbit ? 'Wird bearbeitet...' : 'Subplebbit bearbeiten'}
      </button>
      
      {#if editSubplebbitError}
        <p class="error">Fehler: {editSubplebbitError.message}</p>
      {/if}
    </form>
  </section>

  <!-- Modify the subplebbit management section -->
  <section class="subplebbit-management">
    <h2>Subplebbit Management</h2>
    
    <div class="form-group">
      <label for="subplebbit-select">Select Subplebbit:</label>
      <select
        id="subplebbit-select"
        bind:value={subplebbitAddress}
        on:change={handleSubplebbitAddressChange}
        class="form-control"
      >
        {#each savedSubplebbits as address}
          <option value={address}>{address}</option>
        {/each}
      </select>
    </div>

    <div class="form-group">
      <label for="subplebbit-address">Or Enter Subplebbit Address:</label>
      <input
        type="text"
        id="subplebbit-address"
        bind:value={subplebbitAddress}
        placeholder="Enter subplebbit address"
        class="form-control"
      />
      <button on:click={handleSubplebbitAddressChange}>Load Subplebbit</button>
    </div>

    <div class="create-subplebbit">
      <h3>Create New Subplebbit</h3>
      <button on:click={handleCreateSubplebbit} disabled={creatingSubplebbit}>
        {creatingSubplebbit ? 'Creating...' : 'Create New Subplebbit'}
      </button>
      
      {#if createSubplebbitError}
        <p class="error">Error: {createSubplebbitError.message}</p>
      {/if}
    </div>
  </section>
</main>

<style>
  main {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
  }
  
  section {
    margin-bottom: 40px;
    border: 1px solid #ccc;
    border-radius: 4px;
    padding: 20px;
  }
  
  h1 {
    font-size: 2em;
    margin-bottom: 20px;
  }
  
  h2 {
    font-size: 1.5em;
    margin-bottom: 10px;
  }
  
  ul {
    list-style: none;
    padding: 0;
  }
  
  li {
    margin-bottom: 20px;
    padding: 10px;
  }
  
  .form-group {
    margin-bottom: 15px;
  }
  
  label {
    display: block;
    margin-bottom: 5px;
    font-weight: bold;
  }
  
  .form-control {
    width: 100%;
    padding: 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
  }
  
  button {
    padding: 8px 16px;
    background-color: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  button:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
  
  .error {
    color: red;
    margin-top: 10px;
    border: 1px solid #eee;
    border-radius: 4px;
  }
  
  .comment {
    padding: 10px;
    border: 1px solid #eee;
    border-radius: 4px;
  }
  
  .error {
    color: red;
  }
  
  button {
    background-color: #4caf50;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    margin-top: 10px;
  }
  
  button:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
  
  .captcha-container {
    margin-top: 20px;
  }
  
  .subplebbit-info {
    margin-bottom: 20px;
    padding: 15px;
    background-color: #f5f5f5;
    border-radius: 4px;
  }
  
  .subplebbit-info h2 {
    margin: 0 0 10px 0;
    color: #333;
  }
  
  .subplebbit-info p {
    margin: 0;
    color: #666;
  }
  
  .accounts-section {
    margin-bottom: 40px;
  }
  
  .accounts-list {
    margin-bottom: 30px;
  }
  
  .accounts-list ul {
    list-style: none;
    padding: 0;
  }
  
  .accounts-list li {
    padding: 15px;
    border: 1px solid #eee;
    border-radius: 4px;
    margin-bottom: 10px;
    background-color: #f9f9f9;
  }
  
  .display-name {
    color: #666;
    margin-left: 8px;
  }
  
  .account-address {
    font-size: 0.9em;
    color: #888;
    margin-top: 5px;
    word-break: break-all;
  }
  
  .create-account {
    padding: 20px;
    border: 1px solid #eee;
    border-radius: 4px;
    background-color: #f9f9f9;
  }
  
  .create-account h3 {
    margin-top: 0;
  }
  
  .account-karma {
    font-size: 0.9em;
    color: #666;
    margin-top: 5px;
  }
  
  .subplebbit-management {
    margin-bottom: 40px;
  }
  

  .create-subplebbit {
    margin-top: 20px;
    padding: 20px;
    border: 1px solid #eee;
    border-radius: 4px;
    background-color: #f9f9f9;
  }
  
  select.form-control {
    width: 100%;
    padding: 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
    background-color: white;
    margin-bottom: 10px;
  }
  
  select.form-control option {
    padding: 8px;
    font-family: monospace;
  }
  
  .comment-timestamp, .comment-updated {
    font-size: 0.8em;
    color: #666;
    margin: 5px 0;
  }
  
  .comment-updated {
    color: #4CAF50;
  }
</style>
