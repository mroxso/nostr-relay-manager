import { nip19 } from 'nostr-tools';
import { useParams } from 'react-router-dom';
import NotFound from './NotFound';
import { PubkeyDisplay } from '@/components/PubkeyDisplay';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthor } from '@/hooks/useAuthor';
import { genUserName } from '@/lib/genUserName';
import { Skeleton } from '@/components/ui/skeleton';

export function NIP19Page() {
  const { nip19: identifier } = useParams<{ nip19: string }>();

  // Decode identifier and extract pubkey if applicable
  let decoded: ReturnType<typeof nip19.decode> | null = null;
  let pubkey: string | undefined = undefined;
  
  if (identifier) {
    try {
      decoded = nip19.decode(identifier);
      if (decoded.type === 'npub' || decoded.type === 'nprofile') {
        pubkey = decoded.data as string;
      }
    } catch {
      // Will be handled below
    }
  }

  // Call hook unconditionally (it handles undefined pubkey)
  const author = useAuthor(pubkey);

  if (!identifier || !decoded) {
    return <NotFound />;
  }

  const { type } = decoded;

  switch (type) {
    case 'npub':
    case 'nprofile': {
      if (!pubkey) return <NotFound />;
      
      const metadata = author.data?.metadata;
      const displayName = metadata?.name ?? genUserName(pubkey);
      const isLoading = author.isLoading && !metadata;

      return (
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center gap-4">
                  <Skeleton className="h-16 w-16 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-64" />
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={metadata?.picture} alt={displayName} />
                    <AvatarFallback>
                      {displayName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <PubkeyDisplay pubkey={pubkey} />
                    {metadata?.nip05 && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {metadata.nip05}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    case 'note':
      // AI agent should implement note view here
      return <div>Note placeholder</div>;

    case 'nevent':
      // AI agent should implement event view here
      return <div>Event placeholder</div>;

    case 'naddr':
      // AI agent should implement addressable event view here
      return <div>Addressable event placeholder</div>;

    default:
      return <NotFound />;
  }
} 