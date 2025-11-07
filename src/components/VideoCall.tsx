import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Mic, MicOff, Video, VideoOff, PhoneOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface VideoCallProps {
  matchId: string;
  matchName: string;
  userId: string;
  onEndCall: () => void;
  isInitiator: boolean;
  channelName: string;
}

const VideoCall = ({ matchId, matchName, userId, onEndCall, isInitiator, channelName }: VideoCallProps) => {
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [callState, setCallState] = useState<'connecting' | 'connected' | 'failed'>('connecting');
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    initializeCall();
    
    return () => {
      cleanup();
    };
  }, []);

  const initializeCall = async () => {
    try {
      // Get local media stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Create peer connection
      const configuration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      };
      
      const pc = new RTCPeerConnection(configuration);
      peerConnectionRef.current = pc;

      // Add local stream to peer connection
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      // Handle remote stream
      pc.ontrack = (event) => {
        console.log('Received remote track');
        if (remoteVideoRef.current && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
          setCallState('connected');
        }
      };

      // Setup signaling channel
      const channel = supabase.channel(channelName);
      channelRef.current = channel;

      channel
        .on('broadcast', { event: 'offer' }, async ({ payload }) => {
          console.log('Received offer');
          if (payload.to === userId) {
            await handleOffer(payload.offer);
          }
        })
        .on('broadcast', { event: 'answer' }, async ({ payload }) => {
          console.log('Received answer');
          if (payload.to === userId) {
            await handleAnswer(payload.answer);
          }
        })
        .on('broadcast', { event: 'ice-candidate' }, async ({ payload }) => {
          if (payload.to === userId && payload.candidate) {
            await handleIceCandidate(payload.candidate);
          }
        })
        .subscribe();

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          channel.send({
            type: 'broadcast',
            event: 'ice-candidate',
            payload: {
              candidate: event.candidate,
              from: userId,
              to: matchId
            }
          });
        }
      };

      pc.onconnectionstatechange = () => {
        console.log('Connection state:', pc.connectionState);
        if (pc.connectionState === 'connected') {
          setCallState('connected');
        } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
          setCallState('failed');
          toast.error('Connection failed');
        }
      };

      // If initiator, create and send offer
      if (isInitiator) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        
        channel.send({
          type: 'broadcast',
          event: 'offer',
          payload: {
            offer: offer,
            from: userId,
            to: matchId
          }
        });
      }
    } catch (error) {
      console.error('Error initializing call:', error);
      toast.error('Failed to start call. Please check camera/microphone permissions.');
      onEndCall();
    }
  };

  const handleOffer = async (offer: RTCSessionDescriptionInit) => {
    try {
      const pc = peerConnectionRef.current;
      if (!pc) return;

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      channelRef.current?.send({
        type: 'broadcast',
        event: 'answer',
        payload: {
          answer: answer,
          from: userId,
          to: matchId
        }
      });
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  };

  const handleAnswer = async (answer: RTCSessionDescriptionInit) => {
    try {
      const pc = peerConnectionRef.current;
      if (!pc) return;
      
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (error) {
      console.error('Error handling answer:', error);
    }
  };

  const handleIceCandidate = async (candidate: RTCIceCandidateInit) => {
    try {
      const pc = peerConnectionRef.current;
      if (!pc) return;
      
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const cleanup = () => {
    console.log('Cleaning up video call');
    
    // Stop all tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    
    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    
    // Unsubscribe from channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }
  };

  const endCall = () => {
    cleanup();
    onEndCall();
  };

  return (
    <div className="fixed inset-0 z-50 bg-background">
      <Card className="h-full rounded-none border-0 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b bg-card">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">{matchName}</h2>
              <p className="text-sm text-muted-foreground">
                {callState === 'connecting' && 'Connecting...'}
                {callState === 'connected' && 'Connected'}
                {callState === 'failed' && 'Connection failed'}
              </p>
            </div>
          </div>
        </div>

        {/* Video Area */}
        <div className="flex-1 relative bg-black">
          {/* Remote video (full screen) */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          
          {/* Local video (picture-in-picture) */}
          <div className="absolute top-4 right-4 w-32 h-48 md:w-48 md:h-64 rounded-lg overflow-hidden border-2 border-white shadow-lg">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          </div>

          {/* Controls */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4">
            <Button
              size="lg"
              variant={isAudioEnabled ? "secondary" : "destructive"}
              onClick={toggleAudio}
              className="rounded-full w-14 h-14"
            >
              {isAudioEnabled ? (
                <Mic className="w-6 h-6" />
              ) : (
                <MicOff className="w-6 h-6" />
              )}
            </Button>
            
            <Button
              size="lg"
              variant="destructive"
              onClick={endCall}
              className="rounded-full w-14 h-14"
            >
              <PhoneOff className="w-6 h-6" />
            </Button>
            
            <Button
              size="lg"
              variant={isVideoEnabled ? "secondary" : "destructive"}
              onClick={toggleVideo}
              className="rounded-full w-14 h-14"
            >
              {isVideoEnabled ? (
                <Video className="w-6 h-6" />
              ) : (
                <VideoOff className="w-6 h-6" />
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default VideoCall;
