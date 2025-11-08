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
import { Loader2, ArrowLeft, Search, RefreshCw, Shield, ShieldOff, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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

interface UserWithRole {
  id: string;
  email: string;
  isAdmin: boolean;
  profile?: {
    name: string;
  };
}

const Admin = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [likes, setLikes] = useState<Like[]>([]);
  const [users, setUsers] = useState<UserWithRole[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('profiles');
  const [userToToggle, setUserToToggle] = useState<UserWithRole | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    } else if (user) {
      checkAdminStatus();
    }
  }, [user, authLoading, navigate]);

  const checkAdminStatus = async () => {
    if (!user) return;
    
    setCheckingAdmin(true);
    try {
      const { data, error } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin'
      });

      if (error) throw error;

      if (data) {
        setIsAdmin(true);
        fetchAllData();
      } else {
        toast.error('Access denied. Admin privileges required.');
        navigate('/profile');
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      toast.error('Failed to verify admin status');
      navigate('/profile');
    } finally {
      setCheckingAdmin(false);
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchProfiles(),
        fetchMatches(),
        fetchMessages(),
        fetchLikes(),
        fetchUsers()
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

  const fetchUsers = async () => {
    try {
      // Fetch all profiles with their user info
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name');

      if (profilesError) throw profilesError;

      // Fetch all user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Get auth users (we need to do this via a query to profiles which has user IDs)
      const usersWithRoles: UserWithRole[] = profilesData.map((profile) => {
        const userRole = rolesData.find(r => r.user_id === profile.id);
        return {
          id: profile.id,
          email: '', // We'll need to get this from auth metadata if needed
          isAdmin: userRole?.role === 'admin',
          profile: {
            name: profile.name
          }
        };
      });

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const toggleAdminRole = async (userId: string, currentlyAdmin: boolean) => {
    try {
      if (currentlyAdmin) {
        // Remove admin role
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', 'admin');

        if (error) throw error;
        toast.success('Admin role revoked');
      } else {
        // Add admin role
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: 'admin' });

        if (error) throw error;
        toast.success('Admin role granted');
      }

      await fetchUsers();
      setUserToToggle(null);
    } catch (error: any) {
      console.error('Error toggling admin role:', error);
      toast.error(error.message || 'Failed to update admin role');
    }
  };

  const filteredProfiles = profiles.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.branch.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (authLoading || checkingAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-destructive" />
              Access Denied
            </CardTitle>
            <CardDescription>
              You do not have admin privileges to access this page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/profile')} className="w-full">
              Return to Profile
            </Button>
          </CardContent>
        </Card>
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
              <TabsList className="grid grid-cols-5 w-full">
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
                <TabsTrigger value="users">
                  Users <Badge variant="secondary" className="ml-2">{users.length}</Badge>
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

              <TabsContent value="users" className="mt-6">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>User ID</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((userItem) => (
                        <TableRow key={userItem.id}>
                          <TableCell className="font-medium">
                            {userItem.profile?.name || 'Unknown'}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {userItem.id.slice(0, 8)}...
                          </TableCell>
                          <TableCell>
                            {userItem.isAdmin ? (
                              <Badge variant="default" className="gap-1">
                                <Shield className="h-3 w-3" />
                                Admin
                              </Badge>
                            ) : (
                              <Badge variant="secondary">User</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {userItem.id !== user?.id && (
                              <Button
                                variant={userItem.isAdmin ? "destructive" : "default"}
                                size="sm"
                                onClick={() => setUserToToggle(userItem)}
                              >
                                {userItem.isAdmin ? (
                                  <>
                                    <ShieldOff className="h-4 w-4 mr-2" />
                                    Revoke Admin
                                  </>
                                ) : (
                                  <>
                                    <Shield className="h-4 w-4 mr-2" />
                                    Make Admin
                                  </>
                                )}
                              </Button>
                            )}
                            {userItem.id === user?.id && (
                              <span className="text-sm text-muted-foreground">You</span>
                            )}
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

        <AlertDialog open={!!userToToggle} onOpenChange={() => setUserToToggle(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {userToToggle?.isAdmin ? 'Revoke Admin Access' : 'Grant Admin Access'}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {userToToggle?.isAdmin
                  ? `Are you sure you want to revoke admin privileges from ${userToToggle.profile?.name || 'this user'}? They will no longer be able to access the admin dashboard.`
                  : `Are you sure you want to grant admin privileges to ${userToToggle?.profile?.name || 'this user'}? They will have full access to manage users and view all data.`
                }
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => userToToggle && toggleAdminRole(userToToggle.id, userToToggle.isAdmin)}
              >
                Confirm
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default Admin;
