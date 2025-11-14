import { useState, useEffect } from 'react';
import { useSeoMeta } from '@unhead/react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNIP86 } from '@/hooks/useNIP86';
import { useToast } from '@/hooks/useToast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Shield,
  Users,
  FileText,
  Settings,
  Ban,
  CheckCircle,
  AlertTriangle,
  Server,
  Key,
  Globe,
  Loader2,
  Plus,
  X,
} from 'lucide-react';
import { LoginArea } from '@/components/auth/LoginArea';
import { ThemeToggle } from '@/components/ThemeToggle';
import { nip19 } from 'nostr-tools';

// Helper to normalize pubkey (accepts hex or npub, returns hex)
function normalizePubkey(input: string): string {
  const trimmed = input.trim();
  if (trimmed.startsWith('npub')) {
    try {
      const decoded = nip19.decode(trimmed);
      if (decoded.type === 'npub' || decoded.type === 'nprofile') {
        return decoded.data as string;
      }
    } catch {
      // Fall through to return trimmed
    }
  }
  // Assume it's hex if not npub
  return trimmed;
}

// Helper to normalize event ID (accepts hex or note, returns hex)
function normalizeEventId(input: string): string {
  const trimmed = input.trim();
  if (trimmed.startsWith('note') || trimmed.startsWith('nevent')) {
    try {
      const decoded = nip19.decode(trimmed);
      if (decoded.type === 'note') {
        return decoded.data as string;
      }
      if (decoded.type === 'nevent') {
        // nevent data is an EventPointer object with an id property
        const eventPointer = decoded.data as { id: string };
        return eventPointer.id;
      }
    } catch {
      // Fall through to return trimmed
    }
  }
  // Assume it's hex if not note/nevent
  return trimmed;
}

export default function Manager() {
  useSeoMeta({
    title: 'Relay Manager',
    description: 'Nostr relay administration interface powered by NIP-86',
  });

  const { user } = useCurrentUser();
  const { toast } = useToast();

  // Relay URL state - user can input their relay URL
  const [relayUrl, setRelayUrl] = useState('');
  const [activeRelayUrl, setActiveRelayUrl] = useState<string | null>(null);

  // Load relay URL from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('relay-manager-url');
    if (saved) {
      setRelayUrl(saved);
      setActiveRelayUrl(saved);
    }
  }, []);

  // Always call the hook, but only use it when activeRelayUrl is set
  // Use a default empty string to satisfy hook rules
  const nip86 = useNIP86(activeRelayUrl || '');

  const handleConnect = () => {
    if (!relayUrl.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a relay URL',
        variant: 'destructive',
      });
      return;
    }

    // Normalize URL
    let normalized = relayUrl.trim();
    if (!normalized.startsWith('wss://') && !normalized.startsWith('ws://')) {
      normalized = `wss://${normalized}`;
    }

    try {
      new URL(normalized);
      setActiveRelayUrl(normalized);
      localStorage.setItem('relay-manager-url', normalized);
      toast({
        title: 'Connected',
        description: `Connected to ${normalized}`,
      });
    } catch {
      toast({
        title: 'Invalid URL',
        description: 'Please enter a valid relay URL',
        variant: 'destructive',
      });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Relay Manager</CardTitle>
            <CardDescription>
              Please log in to manage your Nostr relay
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginArea className="w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Header */}
      <div className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Relay Manager</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <LoginArea />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Relay Connection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="w-5 h-5" />
              Relay Connection
            </CardTitle>
            <CardDescription>
              Connect to your Nostr relay to manage it via NIP-86
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="wss://relay.example.com"
                  value={relayUrl}
                  onChange={(e) => setRelayUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
                />
              </div>
              <Button onClick={handleConnect} disabled={!relayUrl.trim()}>
                Connect
              </Button>
            </div>
            {activeRelayUrl && (
              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Connected to {activeRelayUrl}
              </div>
            )}
          </CardContent>
        </Card>

        {!activeRelayUrl ? (
          <Card className="border-dashed">
            <CardContent className="py-12 px-8 text-center">
              <Server className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                Enter a relay URL above to begin managing your relay
              </p>
            </CardContent>
          </Card>
        ) : (
          <RelayManagementInterface relayUrl={activeRelayUrl} nip86={nip86} />
        )}
      </div>
    </div>
  );
}

function RelayManagementInterface({
  relayUrl,
  nip86,
}: {
  relayUrl: string;
  nip86: ReturnType<typeof useNIP86>;
}) {

  // Check supported methods
  const { data: supportedMethods } = useQuery({
    queryKey: ['nip86', 'supportedmethods', relayUrl],
    queryFn: () => nip86.getSupportedMethods(),
    enabled: !!relayUrl,
  });

  return (
    <Tabs defaultValue="pubkeys" className="space-y-6">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="pubkeys">
          <Users className="w-4 h-4 mr-2" />
          Pubkeys
        </TabsTrigger>
        <TabsTrigger value="events">
          <FileText className="w-4 h-4 mr-2" />
          Events
        </TabsTrigger>
        <TabsTrigger value="kinds">
          <Key className="w-4 h-4 mr-2" />
          Kinds
        </TabsTrigger>
        <TabsTrigger value="ips">
          <Globe className="w-4 h-4 mr-2" />
          IPs
        </TabsTrigger>
        <TabsTrigger value="settings">
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </TabsTrigger>
      </TabsList>

      <TabsContent value="pubkeys" className="space-y-6">
        <PubkeyManagement nip86={nip86} supportedMethods={supportedMethods} />
      </TabsContent>

      <TabsContent value="events" className="space-y-6">
        <EventModeration nip86={nip86} supportedMethods={supportedMethods} />
      </TabsContent>

      <TabsContent value="kinds" className="space-y-6">
        <KindManagement nip86={nip86} supportedMethods={supportedMethods} />
      </TabsContent>

      <TabsContent value="ips" className="space-y-6">
        <IPManagement nip86={nip86} supportedMethods={supportedMethods} />
      </TabsContent>

      <TabsContent value="settings" className="space-y-6">
        <RelaySettings nip86={nip86} supportedMethods={supportedMethods} />
      </TabsContent>
    </Tabs>
  );
}

function PubkeyManagement({
  nip86,
  supportedMethods,
}: {
  nip86: ReturnType<typeof useNIP86>;
  supportedMethods?: string[] | null;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: bannedPubkeys, isLoading: loadingBanned } = useQuery({
    queryKey: ['nip86', 'bannedpubkeys'],
    queryFn: () => nip86.listBannedPubkeys(),
    enabled: supportedMethods?.includes('listbannedpubkeys'),
  });

  const { data: allowedPubkeys, isLoading: loadingAllowed } = useQuery({
    queryKey: ['nip86', 'allowedpubkeys'],
    queryFn: () => nip86.listAllowedPubkeys(),
    enabled: supportedMethods?.includes('listallowedpubkeys'),
  });

  const banMutation = useMutation({
    mutationFn: ({ pubkey, reason }: { pubkey: string; reason?: string }) =>
      nip86.banPubkey(pubkey, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nip86', 'bannedpubkeys'] });
      toast({ title: 'Pubkey banned successfully' });
    },
  });

  const allowMutation = useMutation({
    mutationFn: ({ pubkey, reason }: { pubkey: string; reason?: string }) =>
      nip86.allowPubkey(pubkey, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nip86', 'allowedpubkeys'] });
      toast({ title: 'Pubkey allowed successfully' });
    },
  });

  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [allowDialogOpen, setAllowDialogOpen] = useState(false);
  const [pubkeyInput, setPubkeyInput] = useState('');
  const [reasonInput, setReasonInput] = useState('');

  const handleBan = () => {
    if (!pubkeyInput.trim()) return;
    try {
      const normalizedPubkey = normalizePubkey(pubkeyInput.trim());
      banMutation.mutate(
        { pubkey: normalizedPubkey, reason: reasonInput.trim() || undefined },
        {
          onSuccess: () => {
            setBanDialogOpen(false);
            setPubkeyInput('');
            setReasonInput('');
          },
        }
      );
    } catch {
      toast({
        title: 'Invalid pubkey',
        description: 'Please enter a valid pubkey (hex or npub)',
        variant: 'destructive',
      });
    }
  };

  const handleAllow = () => {
    if (!pubkeyInput.trim()) return;
    try {
      const normalizedPubkey = normalizePubkey(pubkeyInput.trim());
      allowMutation.mutate(
        { pubkey: normalizedPubkey, reason: reasonInput.trim() || undefined },
        {
          onSuccess: () => {
            setAllowDialogOpen(false);
            setPubkeyInput('');
            setReasonInput('');
          },
        }
      );
    } catch {
      toast({
        title: 'Invalid pubkey',
        description: 'Please enter a valid pubkey (hex or npub)',
        variant: 'destructive',
      });
    }
  };

  const formatPubkey = (pubkey: string) => {
    try {
      return nip19.npubEncode(pubkey);
    } catch {
      return `${pubkey.slice(0, 8)}...${pubkey.slice(-8)}`;
    }
  };

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2">
        {/* Banned Pubkeys */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Ban className="w-5 h-5 text-destructive" />
                Banned Pubkeys
              </CardTitle>
              <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Ban
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Ban Pubkey</DialogTitle>
                    <DialogDescription>
                      Ban a pubkey from using this relay
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Pubkey (hex or npub)</Label>
                      <Input
                        placeholder="npub1..."
                        value={pubkeyInput}
                        onChange={(e) => setPubkeyInput(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Reason (optional)</Label>
                      <Textarea
                        placeholder="Reason for banning..."
                        value={reasonInput}
                        onChange={(e) => setReasonInput(e.target.value)}
                      />
                    </div>
                    <Button
                      onClick={handleBan}
                      disabled={!pubkeyInput.trim() || banMutation.isPending}
                      className="w-full"
                    >
                      {banMutation.isPending && (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      )}
                      Ban Pubkey
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {loadingBanned ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : bannedPubkeys && bannedPubkeys.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pubkey</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bannedPubkeys.map((item) => (
                    <TableRow key={item.pubkey}>
                      <TableCell className="font-mono text-sm">
                        {formatPubkey(item.pubkey)}
                      </TableCell>
                      <TableCell>{item.reason || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No banned pubkeys
              </p>
            )}
          </CardContent>
        </Card>

        {/* Allowed Pubkeys */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Allowed Pubkeys
              </CardTitle>
              <Dialog open={allowDialogOpen} onOpenChange={setAllowDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Allow
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Allow Pubkey</DialogTitle>
                    <DialogDescription>
                      Add a pubkey to the allow list
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Pubkey (hex or npub)</Label>
                      <Input
                        placeholder="npub1..."
                        value={pubkeyInput}
                        onChange={(e) => setPubkeyInput(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Reason (optional)</Label>
                      <Textarea
                        placeholder="Reason for allowing..."
                        value={reasonInput}
                        onChange={(e) => setReasonInput(e.target.value)}
                      />
                    </div>
                    <Button
                      onClick={handleAllow}
                      disabled={!pubkeyInput.trim() || allowMutation.isPending}
                      className="w-full"
                    >
                      {allowMutation.isPending && (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      )}
                      Allow Pubkey
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {loadingAllowed ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : allowedPubkeys && allowedPubkeys.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pubkey</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allowedPubkeys.map((item) => (
                    <TableRow key={item.pubkey}>
                      <TableCell className="font-mono text-sm">
                        {formatPubkey(item.pubkey)}
                      </TableCell>
                      <TableCell>{item.reason || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No allowed pubkeys
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function EventModeration({
  nip86,
  supportedMethods,
}: {
  nip86: ReturnType<typeof useNIP86>;
  supportedMethods?: string[] | null;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: eventsNeedingModeration, isLoading: loadingPending } =
    useQuery({
      queryKey: ['nip86', 'eventsneedingmoderation'],
      queryFn: () => nip86.listEventsNeedingModeration(),
      enabled: supportedMethods?.includes('listeventsneedingmoderation'),
    });

  const { data: bannedEvents, isLoading: loadingBanned } = useQuery({
    queryKey: ['nip86', 'bannedevents'],
    queryFn: () => nip86.listBannedEvents(),
      enabled: supportedMethods?.includes('listbannedevents'),
  });

  const allowMutation = useMutation({
    mutationFn: ({ eventId, reason }: { eventId: string; reason?: string }) => {
      const normalizedId = normalizeEventId(eventId);
      return nip86.allowEvent(normalizedId, reason);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['nip86', 'eventsneedingmoderation'],
      });
      queryClient.invalidateQueries({ queryKey: ['nip86', 'bannedevents'] });
      toast({ title: 'Event allowed successfully' });
    },
  });

  const banMutation = useMutation({
    mutationFn: ({ eventId, reason }: { eventId: string; reason?: string }) => {
      const normalizedId = normalizeEventId(eventId);
      return nip86.banEvent(normalizedId, reason);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['nip86', 'eventsneedingmoderation'],
      });
      queryClient.invalidateQueries({ queryKey: ['nip86', 'bannedevents'] });
      toast({ title: 'Event banned successfully' });
    },
  });

  const formatEventId = (id: string) => {
    try {
      return nip19.noteEncode(id);
    } catch {
      return `${id.slice(0, 8)}...${id.slice(-8)}`;
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Events Needing Moderation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            Pending Moderation
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingPending ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : eventsNeedingModeration &&
            eventsNeedingModeration.length > 0 ? (
            <div className="space-y-2">
              {eventsNeedingModeration.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-mono text-sm">{formatEventId(item.id)}</p>
                    {item.reason && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {item.reason}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        allowMutation.mutate({ eventId: item.id })
                      }
                      disabled={allowMutation.isPending}
                    >
                      <CheckCircle className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => banMutation.mutate({ eventId: item.id })}
                      disabled={banMutation.isPending}
                    >
                      <Ban className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No events pending moderation
            </p>
          )}
        </CardContent>
      </Card>

      {/* Banned Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ban className="w-5 h-5 text-destructive" />
            Banned Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingBanned ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : bannedEvents && bannedEvents.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event ID</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bannedEvents.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-sm">
                      {formatEventId(item.id)}
                    </TableCell>
                    <TableCell>{item.reason || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No banned events
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function KindManagement({
  nip86,
  supportedMethods,
}: {
  nip86: ReturnType<typeof useNIP86>;
  supportedMethods?: string[] | null;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: allowedKinds, isLoading } = useQuery({
    queryKey: ['nip86', 'allowedkinds'],
    queryFn: () => nip86.listAllowedKinds(),
    enabled: supportedMethods?.includes('listallowedkinds'),
  });

  const [kindInput, setKindInput] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [action, setAction] = useState<'allow' | 'disallow'>('allow');

  const allowMutation = useMutation({
    mutationFn: (kind: number) => nip86.allowKind(kind),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nip86', 'allowedkinds'] });
      toast({ title: 'Kind allowed successfully' });
      setDialogOpen(false);
      setKindInput('');
    },
  });

  const disallowMutation = useMutation({
    mutationFn: (kind: number) => nip86.disallowKind(kind),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nip86', 'allowedkinds'] });
      toast({ title: 'Kind disallowed successfully' });
      setDialogOpen(false);
      setKindInput('');
    },
  });

  const handleSubmit = () => {
    const kind = parseInt(kindInput);
    if (isNaN(kind)) {
      toast({
        title: 'Invalid kind',
        description: 'Kind must be a number',
        variant: 'destructive',
      });
      return;
    }

    if (action === 'allow') {
      allowMutation.mutate(kind);
    } else {
      disallowMutation.mutate(kind);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Allowed Kinds</CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setAction('allow')}
              >
                <Plus className="w-4 h-4 mr-2" />
                Allow Kind
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {action === 'allow' ? 'Allow' : 'Disallow'} Kind
                </DialogTitle>
                <DialogDescription>
                  {action === 'allow'
                    ? 'Add a kind to the allowed list'
                    : 'Remove a kind from the allowed list'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Kind Number</Label>
                  <Input
                    type="number"
                    placeholder="1"
                    value={kindInput}
                    onChange={(e) => setKindInput(e.target.value)}
                  />
                </div>
                <Button
                  onClick={handleSubmit}
                  disabled={!kindInput || allowMutation.isPending || disallowMutation.isPending}
                  className="w-full"
                >
                  {(allowMutation.isPending || disallowMutation.isPending) && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  {action === 'allow' ? 'Allow' : 'Disallow'} Kind
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : allowedKinds && allowedKinds.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {allowedKinds.map((kind) => (
              <Badge key={kind} variant="secondary" className="text-sm">
                {kind}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No allowed kinds configured
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function IPManagement({
  nip86,
  supportedMethods,
}: {
  nip86: ReturnType<typeof useNIP86>;
  supportedMethods?: string[] | null;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: blockedIPs, isLoading } = useQuery({
    queryKey: ['nip86', 'blockedips'],
    queryFn: () => nip86.listBlockedIPs(),
    enabled: supportedMethods?.includes('listblockedips'),
  });

  const [ipInput, setIpInput] = useState('');
  const [reasonInput, setReasonInput] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const blockMutation = useMutation({
    mutationFn: ({ ip, reason }: { ip: string; reason?: string }) =>
      nip86.blockIP(ip, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nip86', 'blockedips'] });
      toast({ title: 'IP blocked successfully' });
      setDialogOpen(false);
      setIpInput('');
      setReasonInput('');
    },
  });

  const unblockMutation = useMutation({
    mutationFn: (ip: string) => nip86.unblockIP(ip),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nip86', 'blockedips'] });
      toast({ title: 'IP unblocked successfully' });
    },
  });

  const handleBlock = () => {
    if (!ipInput.trim()) return;
    blockMutation.mutate({
      ip: ipInput.trim(),
      reason: reasonInput.trim() || undefined,
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Blocked IPs</CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Block IP
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Block IP Address</DialogTitle>
                <DialogDescription>
                  Block an IP address from accessing this relay
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>IP Address</Label>
                  <Input
                    placeholder="192.168.1.1"
                    value={ipInput}
                    onChange={(e) => setIpInput(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Reason (optional)</Label>
                  <Textarea
                    placeholder="Reason for blocking..."
                    value={reasonInput}
                    onChange={(e) => setReasonInput(e.target.value)}
                  />
                </div>
                <Button
                  onClick={handleBlock}
                  disabled={!ipInput.trim() || blockMutation.isPending}
                  className="w-full"
                >
                  {blockMutation.isPending && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  Block IP
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : blockedIPs && blockedIPs.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>IP Address</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {blockedIPs.map((item) => (
                <TableRow key={item.ip}>
                  <TableCell className="font-mono">{item.ip}</TableCell>
                  <TableCell>{item.reason || '-'}</TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => unblockMutation.mutate(item.ip)}
                      disabled={unblockMutation.isPending}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No blocked IPs
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function RelaySettings({
  nip86,
}: {
  nip86: ReturnType<typeof useNIP86>;
  supportedMethods?: string[] | null;
}) {
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [iconUrl, setIconUrl] = useState('');

  const nameMutation = useMutation({
    mutationFn: (name: string) => nip86.changeRelayName(name),
    onSuccess: () => {
      toast({ title: 'Relay name updated successfully' });
      setName('');
    },
  });

  const descriptionMutation = useMutation({
    mutationFn: (description: string) =>
      nip86.changeRelayDescription(description),
    onSuccess: () => {
      toast({ title: 'Relay description updated successfully' });
      setDescription('');
    },
  });

  const iconMutation = useMutation({
    mutationFn: (iconUrl: string) => nip86.changeRelayIcon(iconUrl),
    onSuccess: () => {
      toast({ title: 'Relay icon updated successfully' });
      setIconUrl('');
    },
  });

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Relay Name</CardTitle>
          <CardDescription>Change the relay's display name</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="My Relay"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Button
            onClick={() => nameMutation.mutate(name)}
            disabled={!name.trim() || nameMutation.isPending}
            className="w-full"
          >
            {nameMutation.isPending && (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            )}
            Update Name
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Description</CardTitle>
          <CardDescription>Change the relay's description</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="A description of your relay..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Button
            onClick={() => descriptionMutation.mutate(description)}
            disabled={!description.trim() || descriptionMutation.isPending}
            className="w-full"
          >
            {descriptionMutation.isPending && (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            )}
            Update Description
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Icon URL</CardTitle>
          <CardDescription>Change the relay's icon URL</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="https://example.com/icon.png"
            value={iconUrl}
            onChange={(e) => setIconUrl(e.target.value)}
          />
          <Button
            onClick={() => iconMutation.mutate(iconUrl)}
            disabled={!iconUrl.trim() || iconMutation.isPending}
            className="w-full"
          >
            {iconMutation.isPending && (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            )}
            Update Icon
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

