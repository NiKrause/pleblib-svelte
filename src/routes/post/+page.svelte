<script lang="ts">
    import { onMount } from 'svelte';
    import Plebbit from '@plebbit/plebbit-js';
    import NewCaptcha from '$lib/components/NewCaptcha.svelte';
    // import Captcha from '$lib/components/Captcha.svelte';
    
    let plebbit: typeof Plebbit | null = null;
    let subplebbitAddress = '';
    let subplebbitInfo = {
      title: '',
      description: '',
      posts: []
    };
    let error: Error | null = null;
    let loading = true;

    // Post form variables
    let postTitle = '';
    let postContent = '';
    let publishing = false;
    let publishingError: Error | null = null;
    let currentChallenge: any = null;
  
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
  
        const plebbitRpcClientsOptions = import.meta.env.VITE_PLEBBIT_RPC_CLIENTS_OPTIONS
        .split(',')
        .map((option: string) => option.trim())
        .filter((option: string) => option.length > 0);

        plebbit = await Plebbit({plebbitRpcClientsOptions});
  
        // Get subplebbit instance
        const subplebbit = await plebbit.getSubplebbit(subplebbitAddress);
        
        // Subscribe to updates
        subplebbit.on('update', async (update) => {
          console.log('Subplebbit update:', update);
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

    // Function to handle post submission
    async function handleSubmitPost() {
      if (!plebbit || !subplebbitAddress) return;
      
      try {
        publishing = true;
        publishingError = null;

        // Get the subplebbit instance
        // const subplebbit = await plebbit.getSubplebbit(subplebbitAddress);
        
        // Create a signer
        const signer = await plebbit.createSigner();
        
        // Create the post
        const post = await plebbit.createComment({
          signer,
          subplebbitAddress,
          title: postTitle,
          content: postContent
        });
        console.log('Post:', post);

        // Handle any challenges
        if (post.challenge) {
          currentChallenge = post.challenge;
          return; // Wait for captcha to be solved
        }

        // If no challenge, publish the post
        await post.publish();
        
        // Clear the form
        postTitle = '';
        postContent = '';
        currentChallenge = null;

      } catch (err) {
        console.error('Error publishing post:', err);
        publishingError = err instanceof Error ? err : new Error(String(err));
      } finally {
        publishing = false;
      }
    }

    // Function to handle captcha success
    async function handleCaptchaSuccess() {
      if (!plebbit || !subplebbitAddress) return;
      
      try {
        publishing = true;
        publishingError = null;

        // Get the subplebbit instance
        const subplebbit = await plebbit.getSubplebbit(subplebbitAddress);
        
        // Create and publish the post
        const post = await subplebbit.createComment({
          title: postTitle,
          content: postContent
        });
        
        await post.publish();
        
        // Clear the form
        postTitle = '';
        postContent = '';
        currentChallenge = null;

      } catch (err) {
        console.error('Error publishing post after captcha:', err);
        publishingError = err instanceof Error ? err : new Error(String(err));
      } finally {
        publishing = false;
      }
    }

    // Function to handle captcha error
    function handleCaptchaError(error: Error) {
      publishingError = error;
      currentChallenge = null;
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

      <!-- Add post form section -->
      <section class="post-form">
        <h2>Create New Post</h2>
        <form on:submit|preventDefault={handleSubmitPost}>
          <div class="form-group">
            <label for="post-title">Title:</label>
            <input
              type="text"
              id="post-title"
              bind:value={postTitle}
              placeholder="Enter post title"
              required
            />
          </div>
          
          <div class="form-group">
            <label for="post-content">Content:</label>
            <textarea
              id="post-content"
              bind:value={postContent}
              placeholder="Enter post content"
              rows="4"
              required
            ></textarea>
          </div>
          
          <button type="submit" disabled={publishing}>
            {publishing ? 'Publishing...' : 'Publish Post'}
          </button>
        </form>

        {#if publishingError}
          <p class="error">Error: {publishingError.message}</p>
        {/if}

        {#if currentChallenge}
          <div class="captcha-container">
            <NewCaptcha 
              challenge={currentChallenge}
              onSuccess={handleCaptchaSuccess} 
              onError={handleCaptchaError} 
            />
          </div>
        {/if}
      </section>
    {/if}
  </main>
  
  <style>
    /* ... existing styles ... */

    .post-form {
      margin-top: 20px;
      padding: 20px;
      background-color: #f5f5f5;
      border-radius: 4px;
    }

    .form-group {
      margin-bottom: 15px;
    }

    .form-group label {
      display: block;
      margin-bottom: 5px;
      font-weight: bold;
    }

    .form-group input,
    .form-group textarea {
      width: 100%;
      padding: 8px;
      border: 1px solid #ccc;
      border-radius: 4px;
    }

    .captcha-container {
      margin-top: 20px;
    }
  </style>