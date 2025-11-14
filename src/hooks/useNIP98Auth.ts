import { useCallback } from 'react';
import { useCurrentUser } from './useCurrentUser';

/**
 * Hook for creating NIP-98 HTTP Authorization headers
 * Used for authenticating HTTP requests to Nostr services
 */
export function useNIP98Auth() {
  const { user } = useCurrentUser();

  const createAuthHeader = useCallback(
    async (
      url: string,
      method: string = 'GET',
      body?: string
    ): Promise<string | null> => {
      if (!user?.signer) {
        throw new Error('User must be logged in to create NIP-98 auth');
      }

      // Get the relay URL (convert wss:// to https://)
      const httpUrl = url.replace(/^wss:\/\//, 'https://').replace(/^ws:\/\//, 'http://');

      // Calculate payload hash if body exists
      let payloadHash: string | undefined;
      if (body) {
        const encoder = new TextEncoder();
        const data = encoder.encode(body);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        payloadHash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
      }

      // Create the auth event tags
      const tags: string[][] = [
        ['u', httpUrl],
        ['method', method],
      ];

      if (payloadHash) {
        tags.push(['payload', payloadHash]);
      }

      // Sign the event using the signer interface (works with all login types)
      const authEvent = await user.signer.signEvent({
        kind: 27235, // NIP-98 HTTP Auth
        content: '',
        tags,
        created_at: Math.floor(Date.now() / 1000),
      });

      // Encode to base64
      const eventJson = JSON.stringify(authEvent);
      const base64 = btoa(eventJson);

      return `Nostr ${base64}`;
    },
    [user]
  );

  return { createAuthHeader };
}

