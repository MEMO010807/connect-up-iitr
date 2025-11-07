import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { Heart, X, Loader2, MessageCircle, User as UserIcon, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CustomCursor from '@/components/CustomCursor';
import ThemeToggle from '@/components/ThemeToggle';

interface Profile {
  id: string;
  name: string;
  branch: string;
  year: number;
  bio: string;
  hobbies: string[];
  profile_picture_url: string;
}

const Explore = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    if (user) {
      fetchProfiles();
    }
  }, [user, authLoading, navigate]);

  const fetchProfiles = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Get profiles that user hasn't liked yet
      const { data: likedProfiles } = await supabase
        .from('likes')
        .select('liked_id')
        .eq('liker_id', user.id);

      const likedIds = likedProfiles?.map(l => l.liked_id) || [];

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user.id)
        .not('id', 'in', `(${likedIds.join(',') || 'null'})`);

      if (error) throw error;
      setProfiles(data || []);
    } catch (error: any) {
      toast.error('Failed to load profiles');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (actionLoading || !user || currentIndex >= profiles.length) return;

    setActionLoading(true);
    setSwipeDirection('right');
    
    const currentProfile = profiles[currentIndex];

    try {
      const { error } = await supabase
        .from('likes')
        .insert({
          liker_id: user.id,
          liked_id: currentProfile.id,
        });

      if (error) throw error;

      // Check if it's a match
      const { data: matchData } = await supabase
        .from('matches')
        .select('*')
        .or(`and(user1_id.eq.${user.id < currentProfile.id ? user.id : currentProfile.id},user2_id.eq.${user.id < currentProfile.id ? currentProfile.id : user.id}),and(user1_id.eq.${user.id < currentProfile.id ? currentProfile.id : user.id},user2_id.eq.${user.id < currentProfile.id ? user.id : currentProfile.id})`)
        .single();

      if (matchData) {
        toast.success(`🎉 It's a match with ${currentProfile.name}!`, {
          duration: 4000,
          action: {
            label: 'Chat Now',
            onClick: () => navigate('/chat')
          }
        });
      } else {
        toast.success('Liked!');
      }

      setTimeout(() => {
        setCurrentIndex(currentIndex + 1);
        setSwipeDirection(null);
      }, 300);
    } catch (error: any) {
      toast.error('Failed to like profile');
      console.error(error);
      setSwipeDirection(null);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSkip = () => {
    if (actionLoading || currentIndex >= profiles.length) return;
    
    setSwipeDirection('left');
    setTimeout(() => {
      setCurrentIndex(currentIndex + 1);
      setSwipeDirection(null);
    }, 300);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-primary/5">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  const currentProfile = profiles[currentIndex];
  const hasMoreProfiles = currentIndex < profiles.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5 p-6 has-custom-cursor">
      <CustomCursor />
      <ThemeToggle />
      
      {/* Header */}
      <div className="max-w-md mx-auto mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">
            Connect<span className="text-primary">Up</span>
          </h1>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={() => navigate('/profile')}>
              <UserIcon className="w-5 h-5" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => navigate('/chat')}>
              <MessageCircle className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Card Stack */}
      <div className="max-w-md mx-auto">
        <AnimatePresence mode="wait">
          {hasMoreProfiles && currentProfile ? (
            <motion.div
              key={currentProfile.id}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ 
                scale: 1, 
                opacity: 1,
                x: swipeDirection === 'left' ? -500 : swipeDirection === 'right' ? 500 : 0,
                rotate: swipeDirection === 'left' ? -20 : swipeDirection === 'right' ? 20 : 0,
              }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="overflow-hidden shadow-2xl">
                <CardContent className="p-0">
                  {/* Profile Image */}
                  <div className="relative h-96 bg-gradient-to-br from-primary/20 to-secondary/20">
                    {currentProfile.profile_picture_url ? (
                      <img
                        src={currentProfile.profile_picture_url}
                        alt={currentProfile.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <UserIcon className="w-32 h-32 text-muted-foreground" />
                      </div>
                    )}
                    
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    
                    {/* Name & Basic Info */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                      <h2 className="text-3xl font-bold mb-1">{currentProfile.name}</h2>
                      <p className="text-lg opacity-90">{currentProfile.branch} • Year {currentProfile.year}</p>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="p-6 space-y-4">
                    {currentProfile.bio && (
                      <div>
                        <h3 className="font-semibold mb-2">About</h3>
                        <p className="text-muted-foreground">{currentProfile.bio}</p>
                      </div>
                    )}

                    {currentProfile.hobbies && currentProfile.hobbies.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-2 flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-primary" />
                          Interests
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {currentProfile.hobbies.map((hobby) => (
                            <Badge key={hobby} variant="secondary">{hobby}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <Card className="p-12 text-center shadow-2xl">
              <div className="flex flex-col items-center gap-4">
                <Heart className="w-16 h-16 text-muted-foreground" />
                <h2 className="text-2xl font-bold">No More Profiles</h2>
                <p className="text-muted-foreground">
                  You've seen all available profiles. Check back later for new connections!
                </p>
                <div className="flex gap-4 mt-4">
                  <Button onClick={() => navigate('/chat')}>
                    View Matches
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/profile')}>
                    Edit Profile
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        {hasMoreProfiles && currentProfile && (
          <div className="flex justify-center gap-6 mt-8">
            <Button
              size="lg"
              variant="destructive"
              className="w-20 h-20 rounded-full shadow-lg hover:scale-110 transition-transform"
              onClick={handleSkip}
              disabled={actionLoading}
            >
              <X className="w-8 h-8" />
            </Button>
            <Button
              size="lg"
              className="w-20 h-20 rounded-full shadow-lg hover:scale-110 transition-transform"
              onClick={handleLike}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <Loader2 className="w-8 h-8 animate-spin" />
              ) : (
                <Heart className="w-8 h-8" />
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Explore;
