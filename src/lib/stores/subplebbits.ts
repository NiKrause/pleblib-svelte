import { writable } from 'svelte/store';
import type { Subplebbit } from '../types/index.js';
import { getPlebbit } from '../utils/plebbit.js';

// Store to keep track of active subplebbit instances
export const subplebbitInstances = writable<{[address: string]: Subplebbit}>({});

// Helper function to get or create a subplebbit instance
export async function getSubplebbitInstance(address: string): Promise<Subplebbit> {
  let instances: {[address: string]: Subplebbit} = {};
  
  // Subscribe to get current instances
  subplebbitInstances.subscribe(value => {
    instances = value;
  })();
  
  // If we already have an instance, return it
  if (instances[address]) {
    console.log('Returning existing subplebbit instance');
    return instances[address];
  }
  
  // Otherwise create a new instance
  const plebbit = await getPlebbit();
  console.log('Getting subplebbit instance for address:', address);
  const subplebbit = await plebbit.getSubplebbit(address);
  console.log('Subplebbit instance:', subplebbit);
  
  // Store the instance
  subplebbitInstances.update(current => ({
    ...current,
    [address]: subplebbit
  }));
  
  return subplebbit;
} 