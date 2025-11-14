import { nip19 } from 'nostr-tools';
import { useAuthor } from '@/hooks/useAuthor';
import { genUserName } from '@/lib/genUserName';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface PubkeyDisplayProps {
  pubkey: string;
  showNpub?: boolean;
  className?: string;
  variant?: 'default' | 'compact';
}

/**
 * Displays a pubkey with its username from kind: 0 metadata.
 * Falls back to generated username if no metadata is available.
 */
export function PubkeyDisplay({ 
  pubkey, 
  showNpub = true, 
  className,
  variant = 'default'
}: PubkeyDisplayProps) {
  const author = useAuthor(pubkey);
  const metadata = author.data?.metadata;
  const displayName = metadata?.name ?? genUserName(pubkey);
  const npub = nip19.npubEncode(pubkey);
  const isLoading = author.isLoading && !metadata;

  if (isLoading) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Skeleton className="h-4 w-24" />
        {showNpub && <Skeleton className="h-3 w-32" />}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <span className="font-medium">{displayName}</span>
        {showNpub && (
          <span className="font-mono text-xs text-muted-foreground">
            {npub.slice(0, 12)}...{npub.slice(-8)}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <span className="font-medium">{displayName}</span>
      {showNpub && (
        <span className="font-mono text-xs text-muted-foreground">
          {npub}
        </span>
      )}
    </div>
  );
}

