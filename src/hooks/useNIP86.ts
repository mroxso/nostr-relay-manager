import { useCallback, useState } from 'react';
import { useNIP98Auth } from './useNIP98Auth';
import { useToast } from './useToast';

export interface NIP86Response<T = unknown> {
  result?: T;
  error?: string;
}

export interface BannedPubkey {
  pubkey: string;
  reason?: string;
}

export interface AllowedPubkey {
  pubkey: string;
  reason?: string;
}

export interface EventNeedingModeration {
  id: string;
  reason?: string;
}

export interface BannedEvent {
  id: string;
  reason?: string;
}

export interface BlockedIP {
  ip: string;
  reason?: string;
}

/**
 * Hook for interacting with NIP-86 Relay Management API
 */
export function useNIP86(relayUrl: string) {
  const { createAuthHeader } = useNIP98Auth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Convert wss:// to https:// for HTTP requests
  // Return early if relayUrl is empty to avoid errors
  const httpUrl = relayUrl
    ? relayUrl.replace(/^wss:\/\//, 'https://').replace(/^ws:\/\//, 'http://')
    : '';

  const callMethod = useCallback(
    async <T = unknown>(method: string, params: unknown[] = []): Promise<T | null> => {
      if (!httpUrl) {
        throw new Error('Relay URL is required');
      }

      setIsLoading(true);
      try {
        const body = JSON.stringify({
          method,
          params,
        });

        const authHeader = await createAuthHeader(httpUrl, 'POST', body);

        if (!authHeader) {
          throw new Error('Failed to create authorization header');
        }

        const response = await fetch(httpUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/nostr+json+rpc',
            Authorization: authHeader,
          },
          body,
        });

        if (response.status === 401) {
          throw new Error('Unauthorized - check your authentication');
        }

        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
        }

        const data: NIP86Response<T> = await response.json();

        if (data.error) {
          throw new Error(data.error);
        }

        return data.result ?? null;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        toast({
          title: 'API Error',
          description: errorMessage,
          variant: 'destructive',
        });
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [httpUrl, createAuthHeader, toast]
  );

  // Supported methods
  const getSupportedMethods = useCallback(
    () => callMethod<string[]>('supportedmethods', []),
    [callMethod]
  );

  // Pubkey management
  const banPubkey = useCallback(
    (pubkey: string, reason?: string) =>
      callMethod<boolean>('banpubkey', [pubkey, reason].filter(Boolean)),
    [callMethod]
  );

  const allowPubkey = useCallback(
    (pubkey: string, reason?: string) =>
      callMethod<boolean>('allowpubkey', [pubkey, reason].filter(Boolean)),
    [callMethod]
  );

  const listBannedPubkeys = useCallback(
    () => callMethod<BannedPubkey[]>('listbannedpubkeys', []),
    [callMethod]
  );

  const listAllowedPubkeys = useCallback(
    () => callMethod<AllowedPubkey[]>('listallowedpubkeys', []),
    [callMethod]
  );

  // Event moderation
  const listEventsNeedingModeration = useCallback(
    () => callMethod<EventNeedingModeration[]>('listeventsneedingmoderation', []),
    [callMethod]
  );

  const allowEvent = useCallback(
    (eventId: string, reason?: string) =>
      callMethod<boolean>('allowevent', [eventId, reason].filter(Boolean)),
    [callMethod]
  );

  const banEvent = useCallback(
    (eventId: string, reason?: string) =>
      callMethod<boolean>('banevent', [eventId, reason].filter(Boolean)),
    [callMethod]
  );

  const listBannedEvents = useCallback(
    () => callMethod<BannedEvent[]>('listbannedevents', []),
    [callMethod]
  );

  // Relay metadata
  const changeRelayName = useCallback(
    (name: string) => callMethod<boolean>('changerelayname', [name]),
    [callMethod]
  );

  const changeRelayDescription = useCallback(
    (description: string) => callMethod<boolean>('changerelaydescription', [description]),
    [callMethod]
  );

  const changeRelayIcon = useCallback(
    (iconUrl: string) => callMethod<boolean>('changerelayicon', [iconUrl]),
    [callMethod]
  );

  // Kind management
  const allowKind = useCallback(
    (kind: number) => callMethod<boolean>('allowkind', [kind]),
    [callMethod]
  );

  const disallowKind = useCallback(
    (kind: number) => callMethod<boolean>('disallowkind', [kind]),
    [callMethod]
  );

  const listAllowedKinds = useCallback(
    () => callMethod<number[]>('listallowedkinds', []),
    [callMethod]
  );

  // IP management
  const blockIP = useCallback(
    (ip: string, reason?: string) =>
      callMethod<boolean>('blockip', [ip, reason].filter(Boolean)),
    [callMethod]
  );

  const unblockIP = useCallback(
    (ip: string) => callMethod<boolean>('unblockip', [ip]),
    [callMethod]
  );

  const listBlockedIPs = useCallback(
    () => callMethod<BlockedIP[]>('listblockedips', []),
    [callMethod]
  );

  return {
    isLoading,
    // Methods
    getSupportedMethods,
    // Pubkey management
    banPubkey,
    allowPubkey,
    listBannedPubkeys,
    listAllowedPubkeys,
    // Event moderation
    listEventsNeedingModeration,
    allowEvent,
    banEvent,
    listBannedEvents,
    // Relay metadata
    changeRelayName,
    changeRelayDescription,
    changeRelayIcon,
    // Kind management
    allowKind,
    disallowKind,
    listAllowedKinds,
    // IP management
    blockIP,
    unblockIP,
    listBlockedIPs,
  };
}

