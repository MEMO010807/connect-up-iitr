import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User as UserIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MessageNotificationProps {
  senderName: string;
  senderAvatar?: string;
  message: string;
  onClose: () => void;
}

export const MessageNotification = ({ 
  senderName, 
  senderAvatar, 
  message, 
  onClose 
}: MessageNotificationProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Slide in animation
    setTimeout(() => setIsVisible(true), 100);

    // Auto dismiss after 5 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <Card
      className={`fixed top-4 right-4 z-50 w-80 p-4 shadow-lg border-l-4 border-l-primary transition-all duration-300 ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={senderAvatar} />
          <AvatarFallback>
            <UserIcon className="w-5 h-5" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <p className="font-semibold text-sm">{senderName}</p>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground truncate">{message}</p>
        </div>
      </div>
    </Card>
  );
};
