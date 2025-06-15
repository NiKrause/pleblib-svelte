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
        // Load last selected subplebbit from localStorage
        const lastSelected = localStorage.getItem('lastSelectedSubplebbit');
        if (lastSelected) {
          subplebbitAddress = lastSelected;
        } else {
          error = new Error('No subplebbit selected');
          loading = false;
          return;
        }
  
        // Initialize Plebbit
        const plebbitRpcClientsOptions = import.meta.env.VITE_PLEBBIT_RPC_CLIENTS_OPTIONS;
        plebbit = await Plebbit({
          plebbitRpcClientsOptions: [plebbitRpcClientsOptions]
        });
        
        // Get subplebbit instance
        const subplebbit = await plebbit.getSubplebbit(subplebbitAddress);  
        subplebbit.update()

        // Function to handle subplebbit updates
        async function handleSubplebbitUpdate() {
          console.log('Handling subplebbit update');
          let allPosts = [];
          
          // First try to get posts from pages.hot.comments if available
          if (subplebbit.posts.pages?.hot?.comments) {
            allPosts = [...subplebbit.posts.pages.hot.comments];
          } else {
            // Fall back to the original pageCids logic
            const pageCid = subplebbit.posts.pageCids['new'];
            if (pageCid) {
              try {
                // Get first page
                let postsPage = await subplebbit.posts.getPage(pageCid);
                allPosts = [...postsPage.comments];
                
                // Load more pages if needed
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
          
          // Update the subplebbit info when changes occur
          subplebbitInfo = {
            title: subplebbit.title || 'No Title',
            description: subplebbit.description || 'No Description',
            posts: allPosts
          };
        }

        //Handle global Plebbit updates
        plebbit.on('update', async (update) => {
          console.log('Global Plebbit update:', update);
          await handleSubplebbitUpdate();
        });

        // Handle subplebbit-specific updates
        subplebbit.on('update', async (update) => {
          console.log('Subplebbit update:', update);
          await handleSubplebbitUpdate();
        });
  
        // Initial load of subplebbit info and posts
        let allPosts = [];
        if (subplebbit.posts.pages?.hot?.comments) {
          allPosts = [...subplebbit.posts.pages.hot.comments];
        } else {
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
  
      } catch (err) {
        console.error('Error initializing subplebbit:', err);
        error = err instanceof Error ? err : new Error(String(err));
      } finally {
        loading = false;
      }
    });

    // Add this function to detect and format YouTube URLs
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
  
    h1 {
      font-size: 2em;
      margin-bottom: 20px;
    }
  
    h2 {
      font-size: 1.5em;
      margin-bottom: 10px;
      color: #333;
    }
  
    h3 {
      font-size: 1.2em;
      margin: 20px 0 10px;
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
  
    .post-meta span {
      margin-right: 15px;
    }
  
    .error {
      color: red;
      padding: 10px;
      border: 1px solid red;
      border-radius: 4px;
      background-color: #fff5f5;
    }
  
    .youtube-embed {
        position: relative;
        width: 100%;
        padding-bottom: 56.25%; /* 16:9 Aspect Ratio */
        margin: 1rem 0;
    }

    .youtube-embed iframe {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        border-radius: 4px;
    }
  </style>