import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Send, ArrowLeft, User as UserIcon } from 'lucide-react';
import CustomCursor from '@/components/CustomCursor';
import ThemeToggle from '@/components/ThemeToggle';

interface Match {
  id: string;
  name: string;
  profile_picture_url: string;
  lastMessage?: string;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
}

const Chat = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    if (user) {
      fetchMatches();
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (selectedMatch && user) {
      fetchMessages(selectedMatch.id);
      subscribeToMessages(selectedMatch.id);
    }
  }, [selectedMatch, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMatches = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Get all matches
      const { data: matchData, error } = await supabase
        .from('matches')
        .select('*')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

      if (error) throw error;

      // Get profile details for each match
      const matchIds = matchData?.map(m => 
        m.user1_id === user.id ? m.user2_id : m.user1_id
      ) || [];

      if (matchIds.length === 0) {
        setLoading(false);
        return;
      }

      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', matchIds);

      if (profileError) throw profileError;

      const matchesWithProfiles = profiles?.map(p => ({
        id: p.id,
        name: p.name,
        profile_picture_url: p.profile_picture_url,
      })) || [];

      setMatches(matchesWithProfiles);
    } catch (error: any) {
      toast.error('Failed to load matches');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (matchId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${matchId}),and(sender_id.eq.${matchId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error: any) {
      toast.error('Failed to load messages');
      console.error(error);
    }
  };

  const subscribeToMessages = (matchId: string) => {
    if (!user) return;

    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `sender_id=eq.${matchId}`,
        },
        (payload) => {
          if (payload.new.receiver_id === user.id) {
            setMessages(prev => [...prev, payload.new as Message]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedMatch || !user || sending) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: selectedMatch.id,
          content: newMessage.trim(),
        });

      if (error) throw error;

      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        sender_id: user.id,
        receiver_id: selectedMatch.id,
        content: newMessage.trim(),
        created_at: new Date().toISOString(),
      }]);

      setNewMessage('');
    } catch (error: any) {
      toast.error('Failed to send message');
      console.error(error);
    } finally {
      setSending(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-primary/5">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-background to-primary/5 has-custom-cursor">
      <CustomCursor />
      <ThemeToggle />
      
      {/* Header */}
      <div className="border-b bg-card p-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/explore')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold">
            {selectedMatch ? selectedMatch.name : 'Messages'}
          </h1>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Matches Sidebar */}
        <div className={`w-80 border-r bg-card ${selectedMatch ? 'hidden md:block' : 'block'}`}>
          <ScrollArea className="h-full">
            <div className="p-4 space-y-2">
              {matches.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No matches yet</p>
                  <Button 
                    className="mt-4" 
                    onClick={() => navigate('/explore')}
                  >
                    Start Swiping
                  </Button>
                </div>
              ) : (
                matches.map((match) => (
                  <Card
                    key={match.id}
                    className={`p-4 cursor-pointer hover:bg-accent transition-colors ${
                      selectedMatch?.id === match.id ? 'bg-accent' : ''
                    }`}
                    onClick={() => setSelectedMatch(match)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={match.profile_picture_url} />
                        <AvatarFallback>
                          <UserIcon className="w-5 h-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{match.name}</p>
                        {match.lastMessage && (
                          <p className="text-sm text-muted-foreground truncate">
                            {match.lastMessage}
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedMatch ? (
            <>
              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.sender_id === user?.id ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                          message.sender_id === user?.id
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p>{message.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(message.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="border-t bg-card p-4">
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type a message..."
                    disabled={sending}
                  />
                  <Button onClick={sendMessage} disabled={sending || !newMessage.trim()}>
                    {sending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <p>Select a match to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;
