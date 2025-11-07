import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Loader2 } from 'lucide-react';
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
      console.log('Initializing video call...');
      
      // Get local media stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      console.log('Got local stream:', stream.getTracks().map(t => t.kind));
      
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Create peer connection with TURN servers for better connectivity
      const configuration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' }
        ],
        iceCandidatePoolSize: 10
      };
      
      const pc = new RTCPeerConnection(configuration);
      peerConnectionRef.current = pc;

      // Add local stream to peer connection
      stream.getTracks().forEach(track => {
        const sender = pc.addTrack(track, stream);
        console.log('Added local track:', track.kind, sender);
      });

      // Handle remote stream
      pc.ontrack = (event) => {
        console.log('Received remote track:', event.track.kind, event.streams);
        if (remoteVideoRef.current) {
          const remoteStream = event.streams[0];
          console.log('Setting remote stream with tracks:', remoteStream.getTracks().map(t => t.kind));
          remoteVideoRef.current.srcObject = remoteStream;
          
          // Force play after a brief delay
          setTimeout(() => {
            remoteVideoRef.current?.play().catch(e => 
              console.error('Error playing remote video:', e)
            );
          }, 100);
          
          setCallState('connected');
          toast.success('Call connected!');
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
          console.log('Sending ICE candidate:', event.candidate.candidate);
          channel.send({
            type: 'broadcast',
            event: 'ice-candidate',
            payload: {
              candidate: event.candidate,
              from: userId,
              to: matchId
            }
          });
        } else {
          console.log('ICE gathering complete');
        }
      };

      pc.oniceconnectionstatechange = () => {
        console.log('ICE connection state:', pc.iceConnectionState);
        if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
          setCallState('connected');
          toast.success('Video call connected');
        } else if (pc.iceConnectionState === 'failed') {
          setCallState('failed');
          toast.error('Connection failed. Please check your network.');
        } else if (pc.iceConnectionState === 'disconnected') {
          toast.warning('Connection lost. Reconnecting...');
        }
      };

      pc.onconnectionstatechange = () => {
        console.log('Connection state:', pc.connectionState);
        if (pc.connectionState === 'connected') {
          setCallState('connected');
        } else if (pc.connectionState === 'failed') {
          setCallState('failed');
          toast.error('Connection failed');
        }
      };

      pc.onsignalingstatechange = () => {
        console.log('Signaling state:', pc.signalingState);
      };

      // If initiator, create and send offer
      if (isInitiator) {
        console.log('Creating offer as initiator');
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true
        });
        await pc.setLocalDescription(offer);
        console.log('Sending offer');
        
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
      console.log('Handling offer');
      const pc = peerConnectionRef.current;
      if (!pc) {
        console.error('No peer connection');
        return;
      }

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      console.log('Remote description set');
      
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      console.log('Sending answer');

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
      toast.error('Failed to handle call offer');
    }
  };

  const handleAnswer = async (answer: RTCSessionDescriptionInit) => {
    try {
      console.log('Handling answer');
      const pc = peerConnectionRef.current;
      if (!pc) {
        console.error('No peer connection');
        return;
      }
      
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
      console.log('Remote description set from answer');
    } catch (error) {
      console.error('Error handling answer:', error);
      toast.error('Failed to handle call answer');
    }
  };

  const handleIceCandidate = async (candidate: RTCIceCandidateInit) => {
    try {
      const pc = peerConnectionRef.current;
      if (!pc) {
        console.error('No peer connection for ICE candidate');
        return;
      }
      
      console.log('Adding ICE candidate:', candidate.candidate);
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
            className="w-full h-full object-cover bg-gray-900"
          />
          
          {/* Connection indicator */}
          {callState === 'connecting' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="text-center text-white">
                <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
                <p className="text-lg">Connecting...</p>
              </div>
            </div>
          )}
          
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
