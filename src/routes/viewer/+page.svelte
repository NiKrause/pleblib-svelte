<script lang="ts">
    import { onMount } from 'svelte';
    import Plebbit from '@plebbit/plebbit-js';
    
    let plebbit: typeof Plebbit | null = null;
    const DEFAULT_SUBPLEBBIT = '12D3KooWJzx833wsWBQxiRXsAhhWQnzrGKTPguaBY56JyCYrNum9';
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
          .map((option: string) => option.trim())
          .filter((option: string) => option.length > 0);
  
        plebbit = await Plebbit({
          plebbitRpcClientsOptions
        });
  
        // Get subplebbit instance
        const lastSelected = localStorage.getItem('lastSelectedSubplebbit');
        subplebbitAddress = lastSelected || DEFAULT_SUBPLEBBIT;
        const subplebbit = await plebbit.getSubplebbit(subplebbitAddress);
        subplebbit.update(); //always receive updates form the subplebbit 
  
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
              try {
                let postsPage = await subplebbit.posts.getPage(pageCid);
                allPosts = [...postsPage.comments];
                
                while (postsPage.nextCid && allPosts.length < 50) {
                  try {
                    postsPage = await subplebbit.posts.getPage(postsPage.nextCid);
                    allPosts = allPosts.concat(postsPage.comments);
                  } catch (err) {
                    console.error(`Error loading next page:`, err);
                    break;
                  }
                }
              } catch (err) {
                console.error(`Error loading first page:`, err);
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
        plebbit.on('update', async (update) => {
          console.log('Global Plebbit update:', update);
          await handleSubplebbitUpdate();
        });
        subplebbit.on('update', async (update) => {
          console.log('Subplebbit update:', update);
          await handleSubplebbitUpdate();
        });
  
        // Initial load
        await handleSubplebbitUpdate();
  
      } catch (err) {
        error = err instanceof Error ? err : new Error(String(err));
      } finally {
        loading = false;
      }
    });

    function formatContent(content: string) {
        if (!content) return 'No Content';
        
        // Regular expression to match YouTube URLs
        const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/g;
        
        // Replace YouTube URLs with embedded players
        return content.replace(youtubeRegex, (match, videoId) => {
            return `<div class="youtube-embed">
                <iframe 
                    width="560" 
                    height="315" 
                    src="https://www.youtube.com/embed/${videoId}" 
                    frameborder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowfullscreen>
                </iframe>
            </div>`;
        });
    }
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
                  <p>{@html formatContent(post.content || 'No Content')}</p>
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
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Inter:wght@400;500&display=swap');
  
    main {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      font-family: 'Inter', sans-serif;
    }
  
    h1, h2, h3, h4 {
      font-family: 'Playfair Display', serif;
      font-weight: 600;
    }
  
    h1 {
      font-size: 2.5rem;
      margin-bottom: 1.5rem;
    }
  
    h2 {
      font-size: 2rem;
      margin-bottom: 1rem;
    }
  
    h3 {
      font-size: 1.5rem;
      margin-bottom: 0.75rem;
    }
  
    h4 {
      font-size: 1.25rem;
      margin-bottom: 0.5rem;
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