# PlebLib Svelte

Eine Svelte-Bibliothek für die Integration mit Plebbit, die es ermöglicht, Posts, Kommentare und Antworten abzurufen und zu veröffentlichen. Diese Bibliothek ist eine Portierung der [plebbit-react-hooks](https://github.com/plebbit/plebbit-react-hooks)-Bibliothek für Svelte.

## Installation

```bash
# Mit npm
npm install pleblib-svelte

# Mit pnpm
pnpm add pleblib-svelte

# Mit yarn
yarn add pleblib-svelte
```

## Verwendung

### Initialisierung

Bevor Sie die Bibliothek verwenden können, müssen Sie Plebbit initialisieren:

```typescript
import { initPlebbit } from 'pleblib-svelte';

// Initialisiere Plebbit mit Standardoptionen
await initPlebbit();

// Oder mit benutzerdefinierten Optionen
await initPlebbit({
  ipfsHttpClientOptions: { ... },
  pubsubHttpClientOptions: { ... },
  dataPath: '/path/to/data',
  // WebSocket-URL für die Plebbit-Instanz
  plebbitWsEndpoint: 'wss://your-plebbit-websocket-server.com',
  // Gateway-URLs für IPFS und Pubsub
  ipfsGatewayUrls: [
    'https://cloudflare-ipfs.com',
    'https://ipfs.io'
  ],
  pubsubHttpGatewayUrls: [
    'https://pubsubprovider.xyz/api/v0'
  ]
});
```

### Feeds abrufen

Um Posts von Subplebbits abzurufen:

```typescript
import { loadFeed, posts, feedLoading, feedError } from 'pleblib-svelte';

// Lade Posts von bestimmten Subplebbits
await loadFeed({
  subplebbitAddresses: ['news.eth', 'science.eth'],
  sortType: 'new', // oder 'top'
  limit: 20
});

// Verwende die Stores in Svelte-Komponenten
$: if ($feedLoading) {
  console.log('Lade Feed...');
} else if ($feedError) {
  console.error('Fehler beim Laden des Feeds:', $feedError);
} else {
  console.log('Posts geladen:', $posts);
}
```

### Kommentare abrufen

Um einen einzelnen Kommentar abzurufen:

```typescript
import { loadComment, comment, commentLoading, commentError } from 'pleblib-svelte';

// Lade einen Kommentar anhand seiner CID
await loadComment({
  commentCid: 'QmYourCommentCid',
  onlyIfCached: false
});

// Verwende die Stores in Svelte-Komponenten
$: if ($commentLoading) {
  console.log('Lade Kommentar...');
} else if ($commentError) {
  console.error('Fehler beim Laden des Kommentars:', $commentError);
} else if ($comment) {
  console.log('Kommentar geladen:', $comment);
}
```

### Antworten abrufen

Um Antworten auf einen Kommentar abzurufen:

```typescript
import { loadReplies, replies, repliesLoading, repliesError } from 'pleblib-svelte';

// Lade Antworten auf einen Kommentar
await loadReplies({
  comment: myComment,
  sortType: 'new',
  limit: 10,
  flat: false // true, um verschachtelte Antworten abzuflachen
});

// Verwende die Stores in Svelte-Komponenten
$: if ($repliesLoading) {
  console.log('Lade Antworten...');
} else if ($repliesError) {
  console.error('Fehler beim Laden der Antworten:', $repliesError);
} else {
  console.log('Antworten geladen:', $replies);
}
```

### Kommentare veröffentlichen

Um einen Kommentar oder Post zu veröffentlichen:

```typescript
import { 
  publishComment, 
  publishing, 
  publishingError, 
  challenge, 
  answerChallenge 
} from 'pleblib-svelte';

// Veröffentliche einen Kommentar oder Post
await publishComment({
  subplebbitAddress: 'news.eth',
  title: 'Mein erster Post', // Optional für Posts
  content: 'Dies ist der Inhalt meines Posts',
  parentCid: 'QmParentCommentCid' // Optional für Antworten
});

// Verwende die Stores in Svelte-Komponenten
$: if ($publishing) {
  console.log('Veröffentliche Kommentar...');
} else if ($publishingError) {
  console.error('Fehler beim Veröffentlichen:', $publishingError);
} else if ($challenge) {
  console.log('Challenge erhalten:', $challenge);
  // Beantworte die Challenge
  answerChallenge('Deine Antwort auf die Challenge');
}
```

### Captcha-Komponente

Die Bibliothek enthält eine Captcha-Komponente, die für die Beantwortung von Challenges verwendet werden kann:

```svelte
<script>
  import { Captcha } from 'pleblib-svelte';
  
  function handleSuccess() {
    console.log('Captcha erfolgreich gelöst');
  }
  
  function handleError(error) {
    console.error('Fehler beim Lösen des Captchas:', error);
  }
</script>

<Captcha onSuccess={handleSuccess} onError={handleError} />
```

## Beispiel

Hier ist ein vollständiges Beispiel für eine Svelte-Komponente, die die Bibliothek verwendet:

```svelte
<script>
  import { onMount } from 'svelte';
  import { 
    initPlebbit, 
    loadFeed, 
    posts, 
    feedLoading, 
    feedError,
    publishComment,
    publishing,
    challenge,
    Captcha
  } from 'pleblib-svelte';
  
  onMount(async () => {
    await initPlebbit();
    await loadFeed({
      subplebbitAddresses: ['news.eth'],
      sortType: 'new',
      limit: 10
    });
  });
  
  async function handlePublish() {
    await publishComment({
      subplebbitAddress: 'news.eth',
      content: 'Dies ist ein Testkommentar'
    });
  }
  
  function handleCaptchaSuccess() {
    console.log('Captcha erfolgreich gelöst');
  }
  
  function handleCaptchaError(error) {
    console.error('Fehler beim Lösen des Captchas:', error);
  }
</script>

<main>
  <h1>Plebbit Demo</h1>
  
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
          </li>
        {/each}
      </ul>
    {/if}
  </section>
  
  <section>
    <h2>Kommentar veröffentlichen</h2>
    <button on:click={handlePublish} disabled={$publishing}>
      {$publishing ? 'Wird veröffentlicht...' : 'Kommentar veröffentlichen'}
    </button>
    
    {#if $challenge}
      <div class="captcha-container">
        <Captcha onSuccess={handleCaptchaSuccess} onError={handleCaptchaError} />
      </div>
    {/if}
  </section>
</main>
```

## Entwicklung

Um an der Bibliothek zu arbeiten:

```bash
# Klone das Repository
git clone https://github.com/yourusername/pleblib-svelte.git
cd pleblib-svelte

# Installiere Abhängigkeiten
pnpm install

# Starte den Entwicklungsserver
pnpm run dev
```

## Tests

Die Bibliothek enthält Tests für alle Komponenten und Stores:

```bash
# Führe alle Tests aus
pnpm test

# Führe nur Unit-Tests aus
pnpm test:unit

# Führe nur E2E-Tests aus
pnpm test:e2e
```

## Konfiguration

### WebSocket-URL und Gateway-URLs

Sie können die WebSocket-URL für die Plebbit-Instanz und andere Gateway-URLs in den Plebbit-Optionen konfigurieren:

```typescript
await initPlebbit({
  // WebSocket-URL für die Plebbit-Instanz
  plebbitWsEndpoint: 'wss://your-plebbit-websocket-server.com',
  
  // Gateway-URLs für IPFS
  ipfsGatewayUrls: [
    'https://cloudflare-ipfs.com',
    'https://ipfs.io'
  ],
  
  // Gateway-URLs für Pubsub
  pubsubHttpGatewayUrls: [
    'https://pubsubprovider.xyz/api/v0'
  ]
});
```

Die WebSocket-URL (`plebbitWsEndpoint`) ermöglicht eine direkte Verbindung zu einem Plebbit-WebSocket-Server, was die Leistung und Zuverlässigkeit verbessern kann. Wenn Sie Ihren eigenen Plebbit-Server betreiben, können Sie hier die URL Ihres Servers angeben.

Die Gateway-URLs (`ipfsGatewayUrls` und `pubsubHttpGatewayUrls`) ermöglichen die Kommunikation mit IPFS und Pubsub über HTTP-Gateways, was in Umgebungen nützlich sein kann, in denen direkte P2P-Verbindungen nicht möglich sind.

## Lizenz

MIT
