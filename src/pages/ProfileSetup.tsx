import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { X, Upload, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ProfileSetup = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const [profile, setProfile] = useState({
    name: '',
    branch: '',
    year: 1,
    bio: '',
    hobbies: [] as string[],
    profile_picture_url: '',
  });
  
  const [hobbyInput, setHobbyInput] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    if (user) {
      fetchProfile();
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

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setProfile({
          name: data.name || '',
          branch: data.branch || '',
          year: data.year || 1,
          bio: data.bio || '',
          hobbies: data.hobbies || [],
          profile_picture_url: data.profile_picture_url || '',
        });
      }
    } catch (error: any) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !user) return;
    
    const file = e.target.files[0];
    setImageFile(file);
    setUploadingImage(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(fileName);

      setProfile({ ...profile, profile_picture_url: publicUrl });
      toast.success('Image uploaded!');
    } catch (error: any) {
      toast.error('Failed to upload image');
      console.error(error);
    } finally {
      setUploadingImage(false);
    }
  };

  const addHobby = () => {
    if (hobbyInput.trim() && !profile.hobbies.includes(hobbyInput.trim())) {
      setProfile({ ...profile, hobbies: [...profile.hobbies, hobbyInput.trim()] });
      setHobbyInput('');
    }
  };

  const removeHobby = (hobby: string) => {
    setProfile({ ...profile, hobbies: profile.hobbies.filter(h => h !== hobby) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!profile.name || !profile.branch || !profile.year) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          name: profile.name,
          branch: profile.branch,
          year: profile.year,
          bio: profile.bio,
          hobbies: profile.hobbies,
          profile_picture_url: profile.profile_picture_url,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast.success('Profile saved!');
      navigate('/explore');
    } catch (error: any) {
      toast.error('Failed to save profile');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-background via-background to-secondary/5">
      <Card className="w-full max-w-2xl shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">Complete Your Profile</CardTitle>
          <CardDescription>Tell us about yourself to start making connections</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Picture */}
            <div className="flex flex-col items-center gap-4">
              {profile.profile_picture_url ? (
                <img 
                  src={profile.profile_picture_url} 
                  alt="Profile" 
                  className="w-32 h-32 rounded-full object-cover border-4 border-primary"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center">
                  <Upload className="w-12 h-12 text-muted-foreground" />
                </div>
              )}
              <Label htmlFor="picture" className="cursor-pointer">
                <div className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                  {uploadingImage ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Upload Photo
                    </>
                  )}
                </div>
                <Input
                  id="picture"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                />
              </Label>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                placeholder="Your Name"
                required
              />
            </div>

            {/* Branch */}
            <div className="space-y-2">
              <Label htmlFor="branch">Branch/Department *</Label>
              <Select value={profile.branch} onValueChange={(value) => setProfile({ ...profile, branch: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your branch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Chemical Engineering">Chemical Engineering</SelectItem>
                  <SelectItem value="Civil Engineering">Civil Engineering</SelectItem>
                  <SelectItem value="Computer Science and Engineering">Computer Science and Engineering</SelectItem>
                  <SelectItem value="Electrical Engineering">Electrical Engineering</SelectItem>
                  <SelectItem value="Engineering Physics">Engineering Physics</SelectItem>
                  <SelectItem value="Artificial Intelligence and Data Engineering">Artificial Intelligence and Data Engineering</SelectItem>
                  <SelectItem value="Mathematics and Computing">Mathematics and Computing</SelectItem>
                  <SelectItem value="Mechanical Engineering">Mechanical Engineering</SelectItem>
                  <SelectItem value="Metallurgical and Materials Engineering">Metallurgical and Materials Engineering</SelectItem>
                  <SelectItem value="Digital Agriculture">Digital Agriculture</SelectItem>
                  <SelectItem value="Electrical Engineering (Integrated Circuit Design and Technology)">Electrical Engineering (Integrated Circuit Design and Technology)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Year */}
            <div className="space-y-2">
              <Label htmlFor="year">Year *</Label>
              <Select value={profile.year.toString()} onValueChange={(value) => setProfile({ ...profile, year: parseInt(value) })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1st Year</SelectItem>
                  <SelectItem value="2">2nd Year</SelectItem>
                  <SelectItem value="3">3rd Year</SelectItem>
                  <SelectItem value="4">4th Year</SelectItem>
                  <SelectItem value="5">5th Year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                placeholder="Tell us about yourself..."
                rows={4}
              />
            </div>

            {/* Hobbies */}
            <div className="space-y-2">
              <Label>Hobbies & Interests</Label>
              <div className="flex gap-2">
                <Input
                  value={hobbyInput}
                  onChange={(e) => setHobbyInput(e.target.value)}
                  placeholder="Add a hobby..."
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addHobby())}
                />
                <Button type="button" onClick={addHobby}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {profile.hobbies.map((hobby) => (
                  <Badge key={hobby} variant="secondary" className="pl-3 pr-2 py-1">
                    {hobby}
                    <button
                      type="button"
                      onClick={() => removeHobby(hobby)}
                      className="ml-2 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <Button type="submit" className="flex-1" disabled={loading || uploadingImage}>
                {loading ? 'Saving...' : 'Save & Continue'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate('/explore')}>
                Skip for Now
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileSetup;
