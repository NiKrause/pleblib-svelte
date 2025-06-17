# PlebLib Svelte

A Svelte library for integrating with Plebbit, enabling you to create & subplebbits, fetch and publish posts, comments, and replies and solves default Captchas. This library is an experimental port of the [plebbit-react-hooks](https://github.com/plebbit/plebbit-react-hooks) leveraging [plebbit-js](https://github.com/plebbit/plebbit-js)

Remark: This library was experimentally ported by RooCode AI (Claude Sonnet 4.0). Unfortunately, it is not yet ported completely and consistently. It is not fully tested, but can serve as an experimental package to evaluate Plebbit-JS for decentralized social blogging and other social media formats. 

It might be replaced with better version at some point. It can serve as a first demo on how to use Plebbit-JS within Svelte! 

At the time of writing, a plebbit node (Plebbit-Cli) is necessary for plebbit-js to connect via websocket. 
Current version of plebbit-js might work in a local-first way with integrated [Helia (IPFS node)](https://github.com/ipfs/helia) running in the browser.

## Installation
1. Create a new Svelte project and install a pleblib-svelte package

```bash
# With npm
npm install pleblib-svelte

# With pnpm
pnpm add pleblib-svelte

# With yarn
yarn add pleblib-svelte
```

2. Run plebbit-cli using Docker Compose

```bash
# Start the plebbit-cli node
docker-compose up -d

# The node will be available at ws://localhost:9138
```

3. Run the development server with
```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { initPlebbit } from 'pleblib`svelte';
  
  let status = 'Initializing...';
  
  onMount(async () => {
    try {
      await initPlebbit({
        plebbitWsEndpoint: 'ws://localhost:9138/auth-key-of-plebbit-cli'
      });
      status = 'Connected to Plebbit!';
    } catch (error) {
      status = `Error: ${error.message}`;
    }
  });
</script>

<main>
  <h1>Plebbit Demo</h1>
  <p>{status}</p>
</main>

<style>
  main {
    text-align: center;
    padding: 1em;
    max-width: 240px;
    margin: 0 auto;
  }
</style>
```

## Usage

### Initialization

Before using the library, you need to initialize Plebbit:

```typescript
import { initPlebbit } from 'pleblib-svelte';

// Initialize Plebbit with default options
await initPlebbit();

// Or with custom options
await initPlebbit({
  plebbitWsEndpoint: 'wss://your-plebbit-websocket-server.com',
  ipfsGatewayUrls: [
    'https://cloudflare-ipfs.com',
    'https://ipfs.io'
  ]
});
```

### Example: Listing Posts from a Subplebbit

Here's a complete example of how to list posts from a subplebbit:

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import Plebbit from '@plebbit/plebbit-js';
  
  let plebbit: typeof Plebbit | null = null;
  let subplebbitAddress = '';
  let subplebbitInfo = {
    title: '',
    description: '',
    posts: []
  };
  let error: Error | null = null;
  let loading = true;

  onMount(async () => {
    try {
      // Initialize Plebbit
      const plebbitRpcClientsOptions = import.meta.env.VITE_PLEBBIT_RPC_CLIENTS_OPTIONS
        .split(',')
        .map(option => option.trim())
        .filter(option => option.length > 0);

      plebbit = await Plebbit({
        plebbitRpcClientsOptions
      });

      // Get subplebbit instance
      const subplebbit = await plebbit.getSubplebbit(subplebbitAddress);
      subplebbit.update();

      // Function to handle subplebbit updates
      async function handleSubplebbitUpdate() {
        let allPosts = [];
        
        // Get posts from pages.hot.comments if available
        if (subplebbit.posts.pages?.hot?.comments) {
          allPosts = [...subplebbit.posts.pages.hot.comments];
        } else {
          // Fall back to pageCids
          const pageCid = subplebbit.posts.pageCids['new'];
          if (pageCid) {
            let postsPage = await subplebbit.posts.getPage(pageCid);
            allPosts = [...postsPage.comments];
            
            // Load more pages if needed
            while (postsPage.nextCid && allPosts.length < 50) {
              postsPage = await subplebbit.posts.getPage(postsPage.nextCid);
              allPosts = allPosts.concat(postsPage.comments);
            }
          }
        }

        // Sort posts by timestamp
        allPosts = allPosts.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        
        subplebbitInfo = {
          title: subplebbit.title || 'No Title',
          description: subplebbit.description || 'No Description',
          posts: allPosts
        };
      }

      // Handle updates
      plebbit.on('update', handleSubplebbitUpdate);
      subplebbit.on('update', handleSubplebbitUpdate);

      // Initial load
      await handleSubplebbitUpdate();

    } catch (err) {
      error = err instanceof Error ? err : new Error(String(err));
    } finally {
      loading = false;
    }
  });
</script>

<main>
  <h1>Subplebbit Viewer</h1>

  {#if loading}
    <p>Loading subplebbit...</p>
  {:else if error}
    <p class="error">Error: {error.message}</p>
  {:else}
    <section class="subplebbit-info">
      <h2>{subplebbitInfo.title}</h2>
      <p>{subplebbitInfo.description}</p>
      
      <div class="posts">
        <h3>Posts</h3>
        {#if subplebbitInfo.posts.length === 0}
          <p>No posts found</p>
        {:else}
          <ul>
            {#each subplebbitInfo.posts as post}
              <li>
                <h4>{post.title || 'No Title'}</h4>
                <p>{post.content || 'No Content'}</p>
                <div class="post-meta">
                  <span>By: {post.author?.displayName || post.author?.address || 'Unknown'}</span>
                  {#if post.timestamp}
                    <span>Posted: {new Date(post.timestamp * 1000).toLocaleString()}</span>
                  {/if}
                </div>
              </li>
            {/each}
          </ul>
        {/if}
      </div>
    </section>
  {/if}
</main>

<style>
  main {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
  }

  .subplebbit-info {
    background-color: #f5f5f5;
    border-radius: 4px;
    padding: 20px;
    margin-bottom: 20px;
  }

  .posts ul {
    list-style: none;
    padding: 0;
  }

  .posts li {
    background-color: white;
    border: 1px solid #eee;
    border-radius: 4px;
    padding: 15px;
    margin-bottom: 15px;
  }

  .post-meta {
    font-size: 0.9em;
    color: #666;
    margin-top: 10px;
  }

  .error {
    color: red;
    padding: 10px;
    border: 1px solid red;
    border-radius: 4px;
    background-color: #fff5f5;
  }
</style>
```

### Publishing Comments

To publish a comment or post:

```typescript
import { publishComment } from 'pleblib-svelte';

await publishComment({
  subplebbitAddress: 'news.eth',
  title: 'My First Post', // Optional for posts
  content: 'This is the content of my post',
  parentCid: 'QmParentCommentCid' // Optional for replies
});
```

## Development

```bash
# Clone the repository
git clone https://github.com/yourusername/pleblib-svelte.git
cd pleblib-svelte

# Install dependencies
pnpm install

# Start development server
pnpm run dev
```

## License

MIT