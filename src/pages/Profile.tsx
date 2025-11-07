import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Edit, LogOut, Trash2, Heart, MessageCircle, User as UserIcon, ArrowLeft } from 'lucide-react';
import CustomCursor from '@/components/CustomCursor';
import ThemeToggle from '@/components/ThemeToggle';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ProfileData {
  name: string;
  branch: string;
  year: number;
  bio: string;
  hobbies: string[];
  profile_picture_url: string;
}

const Profile = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [matchCount, setMatchCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    if (user) {
      fetchProfile();
      fetchMatchCount();
    }
  }, [user, authLoading, navigate]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error: any) {
      toast.error('Failed to load profile');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMatchCount = async () => {
    if (!user) return;

    try {
      const { count, error } = await supabase
        .from('matches')
        .select('*', { count: 'exact', head: true })
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

      if (error) throw error;
      setMatchCount(count || 0);
    } catch (error: any) {
      console.error(error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
      navigate('/');
    } catch (error: any) {
      toast.error('Failed to sign out');
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    setDeleting(true);
    try {
      // Delete profile (cascade will handle other tables)
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);

      if (error) throw error;

      await signOut();
      toast.success('Account deleted');
      navigate('/');
    } catch (error: any) {
      toast.error('Failed to delete account');
      console.error(error);
    } finally {
      setDeleting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-primary/5">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="w-full max-w-md text-center p-12">
          <p className="text-muted-foreground mb-4">Profile not found</p>
          <Button onClick={() => navigate('/profile-setup')}>
            Complete Profile
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5 p-6 has-custom-cursor">
      <CustomCursor />
      <ThemeToggle />
      
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/explore')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold">My Profile</h1>
          <Button variant="ghost" size="icon" onClick={() => navigate('/chat')}>
            <MessageCircle className="w-5 h-5" />
          </Button>
        </div>

        {/* Profile Card */}
        <Card className="mb-6 shadow-xl">
          <CardHeader className="text-center pb-2">
            <Avatar className="w-32 h-32 mx-auto mb-4 border-4 border-primary">
              <AvatarImage src={profile.profile_picture_url} />
              <AvatarFallback className="text-4xl">
                <UserIcon className="w-16 h-16" />
              </AvatarFallback>
            </Avatar>
            <CardTitle className="text-3xl">{profile.name}</CardTitle>
            <p className="text-muted-foreground">{profile.branch} • Year {profile.year}</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {profile.bio && (
              <div>
                <h3 className="font-semibold mb-2">About</h3>
                <p className="text-muted-foreground">{profile.bio}</p>
              </div>
            )}

            {profile.hobbies && profile.hobbies.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Interests</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.hobbies.map((hobby) => (
                    <Badge key={hobby} variant="secondary">{hobby}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="text-center p-4 bg-muted rounded-lg">
                <Heart className="w-6 h-6 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold">{matchCount}</p>
                <p className="text-sm text-muted-foreground">Matches</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <MessageCircle className="w-6 h-6 text-secondary mx-auto mb-2" />
                <p className="text-2xl font-bold">{matchCount}</p>
                <p className="text-sm text-muted-foreground">Connections</p>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3 pt-4">
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => navigate('/profile-setup')}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
              
              <Button 
                className="w-full" 
                variant="outline"
                onClick={handleSignOut}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    className="w-full" 
                    variant="destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your
                      account and remove all your data from our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      disabled={deleting}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {deleting ? 'Deleting...' : 'Delete Account'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
