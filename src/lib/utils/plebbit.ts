import Plebbit from '@plebbit/plebbit-js';
import type { Plebbit as PlebbitType, PlebbitOptions } from '../types/index.js';
import { writable } from 'svelte/store';

// Erstelle einen Store für die Plebbit-Instanz
export const plebbitStore = writable<PlebbitType | null>(null);

// Standard-Plebbit-Optionen
const defaultOptions: PlebbitOptions = {
  // Standardmäßig verwenden wir die Standard-IPFS-Gateways und Pubsub-Gateways
  // Diese Werte können überschrieben werden
  // ipfsGatewayUrls: [
  //   'https://cloudflare-ipfs.com',
  //   'https://ipfs.io'
  // ],
  // pubsubHttpGatewayUrls: [
  //   'https://pubsubprovider.xyz/api/v0'
  // ],
  // WebSocket-Endpunkt ist standardmäßig nicht gesetzt
  // plebbitWsEndpoint: 
  // plebbitRpcClientsOptions: ['wss://plebbit-ws.example.com']
};

/**
 * Initialisiert eine Plebbit-Instanz mit den angegebenen Optionen
 * @param options - Optionen für die Plebbit-Instanz
 * @returns Die initialisierte Plebbit-Instanz
 */
export async function initPlebbit(options: PlebbitOptions = {}): Promise<PlebbitType> {
  try {
    // Kombiniere die Standard-Optionen mit den angegebenen Optionen
    const plebbitOptions = { ...defaultOptions, ...options };
    
    // Erstelle eine neue Plebbit-Instanz
    // const plebbit = await Plebbit({ plebbitRpcClientsOptions: [wsUrl] });
    const plebbit = await Plebbit(plebbitOptions);
    
    // Aktualisiere den Store mit Typ-Cast, um Typkonflikte zu umgehen
    plebbitStore.set(plebbit as unknown as PlebbitType);
    
    // Gib die Instanz zurück mit Typ-Cast
    return plebbit as unknown as PlebbitType;
  } catch (error) {
    console.error('Fehler beim Initialisieren von Plebbit:', error);
    throw error;
  }
}

/**
 * Gibt die aktuelle Plebbit-Instanz zurück oder initialisiert eine neue, wenn keine existiert
 * @param options - Optionen für die Plebbit-Instanz, falls eine neue erstellt werden muss
 * @returns Die Plebbit-Instanz
 */
export async function getPlebbit(options: PlebbitOptions = {}): Promise<PlebbitType> {
  let plebbit: PlebbitType | null = null;
  
  // Hole die aktuelle Plebbit-Instanz aus dem Store
  plebbitStore.subscribe((value) => {
    plebbit = value;
  })();
  
  // Wenn keine Instanz existiert, initialisiere eine neue
  if (!plebbit) {
    return initPlebbit(options);
  }
  
  return plebbit;
}