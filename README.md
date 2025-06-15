# PlebLib Svelte

A Svelte library for integrating with Plebbit, enabling you to create & subplebbits, fetch and publish posts, comments, and replies and solves default Captchas. This library is an experimental port of the [plebbit-react-hooks](https://github.com/plebbit/plebbit-react-hooks) library for Svelte.

Remark: This library was experimentally ported by AI (Claude Sonnet 4.0) but it is not yet ported consistently and is not fully tested. It might be replaced with another version soon, but can serve as a first demo on how to use Plebbit-JS with Svelte! 

A Plebbit node (Plebbit-Cli) is necessary to run the libary at the time of writing. A future version of Plebbit-JS might be able to work in a browser with direct peer-to-per without a Plebbit-Cli.



## Installation
1. Install a plebbit-cli node locally

```bash
# With npm
npm install pleblib-svelte

# With pnpm
pnpm add pleblib-svelte

# With yarn
yarn add pleblib-svelte
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
      plebbit = await Plebbit({
        plebbitRpcClientsOptions: ['ws://localhost:9138/FslcFRsCGwXPWFfcmKT1TVstn9eyIUoW7knM8O7f']
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