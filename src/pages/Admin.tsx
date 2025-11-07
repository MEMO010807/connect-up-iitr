import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, ArrowLeft, Search, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface Profile {
  id: string;
  name: string;
  branch: string;
  year: number;
  bio: string | null;
  hobbies: string[] | null;
  profile_picture_url: string | null;
  created_at: string;
  updated_at: string;
}

interface Match {
  id: string;
  user1_id: string;
  user2_id: string;
  matched_at: string;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
}

interface Like {
  id: string;
  liker_id: string;
  liked_id: string;
  created_at: string;
}

const Admin = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [likes, setLikes] = useState<Like[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('profiles');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    } else if (user) {
      fetchAllData();
    }
  }, [user, authLoading, navigate]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchProfiles(),
        fetchMatches(),
        fetchMessages(),
        fetchLikes()
      ]);
      toast.success('Data loaded successfully');
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load some data');
    } finally {
      setLoading(false);
    }
  };

  const fetchProfiles = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    setProfiles(data || []);
  };

  const fetchMatches = async () => {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .order('matched_at', { ascending: false });
    
    if (error) throw error;
    setMatches(data || []);
  };

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    setMessages(data || []);
  };

  const fetchLikes = async () => {
    const { data, error } = await supabase
      .from('likes')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    setLikes(data || []);
  };

  const filteredProfiles = profiles.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.branch.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/profile')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
              <p className="text-muted-foreground">View and manage all database records</p>
            </div>
          </div>
          <Button onClick={fetchAllData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Database Overview</CardTitle>
            <CardDescription>
              Browse all tables and records in your database
            </CardDescription>
            <div className="flex gap-4 mt-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, branch, or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="profiles">
                  Profiles <Badge variant="secondary" className="ml-2">{profiles.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="matches">
                  Matches <Badge variant="secondary" className="ml-2">{matches.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="messages">
                  Messages <Badge variant="secondary" className="ml-2">{messages.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="likes">
                  Likes <Badge variant="secondary" className="ml-2">{likes.length}</Badge>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="profiles" className="mt-6">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Branch</TableHead>
                        <TableHead>Year</TableHead>
                        <TableHead>Bio</TableHead>
                        <TableHead>Hobbies</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProfiles.map((profile) => (
                        <TableRow key={profile.id}>
                          <TableCell className="font-medium">{profile.name}</TableCell>
                          <TableCell>{profile.branch}</TableCell>
                          <TableCell>{profile.year}</TableCell>
                          <TableCell className="max-w-xs truncate">
                            {profile.bio || '-'}
                          </TableCell>
                          <TableCell>
                            {profile.hobbies?.map((hobby, i) => (
                              <Badge key={i} variant="outline" className="mr-1">
                                {hobby}
                              </Badge>
                            ))}
                          </TableCell>
                          <TableCell>
                            {format(new Date(profile.created_at), 'MMM d, yyyy')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="matches" className="mt-6">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Match ID</TableHead>
                        <TableHead>User 1 ID</TableHead>
                        <TableHead>User 2 ID</TableHead>
                        <TableHead>Matched At</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {matches.map((match) => (
                        <TableRow key={match.id}>
                          <TableCell className="font-mono text-xs">{match.id.slice(0, 8)}...</TableCell>
                          <TableCell className="font-mono text-xs">{match.user1_id.slice(0, 8)}...</TableCell>
                          <TableCell className="font-mono text-xs">{match.user2_id.slice(0, 8)}...</TableCell>
                          <TableCell>
                            {format(new Date(match.matched_at), 'MMM d, yyyy HH:mm')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="messages" className="mt-6">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>From</TableHead>
                        <TableHead>To</TableHead>
                        <TableHead>Content</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Sent At</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {messages.map((message) => (
                        <TableRow key={message.id}>
                          <TableCell className="font-mono text-xs">{message.sender_id.slice(0, 8)}...</TableCell>
                          <TableCell className="font-mono text-xs">{message.receiver_id.slice(0, 8)}...</TableCell>
                          <TableCell className="max-w-xs truncate">{message.content}</TableCell>
                          <TableCell>
                            {message.read_at ? (
                              <Badge variant="secondary">Read</Badge>
                            ) : (
                              <Badge variant="outline">Unread</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {format(new Date(message.created_at), 'MMM d, yyyy HH:mm')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="likes" className="mt-6">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Liker ID</TableHead>
                        <TableHead>Liked ID</TableHead>
                        <TableHead>Created At</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {likes.map((like) => (
                        <TableRow key={like.id}>
                          <TableCell className="font-mono text-xs">{like.liker_id.slice(0, 8)}...</TableCell>
                          <TableCell className="font-mono text-xs">{like.liked_id.slice(0, 8)}...</TableCell>
                          <TableCell>
                            {format(new Date(like.created_at), 'MMM d, yyyy HH:mm')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Admin;
