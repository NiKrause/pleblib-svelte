<script lang="ts">
    import { onMount } from 'svelte';
    import { initPlebbit } from '$lib/index.js';
    
    let status = 'Initializing...';
    
    onMount(async () => {
      try {
        const plebbitRpcClientsOptions = import.meta.env.VITE_PLEBBIT_RPC_CLIENTS_OPTIONS
        .split(',')
        .map((option: string) => option.trim())
        .filter((option: string) => option.length > 0);

        
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