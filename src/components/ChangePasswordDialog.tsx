import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface ChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

const SECURITY_QUESTIONS = [
  { key: 'security_answer_1', question: 'What is your favourite food?' },
  { key: 'security_answer_2', question: 'What was your childhood name?' },
  { key: 'security_answer_3', question: 'Which is your favourite colour?' },
];

const ChangePasswordDialog = ({ open, onOpenChange, userId }: ChangePasswordDialogProps) => {
  const [step, setStep] = useState<'verify' | 'change'>('verify');
  const [loading, setLoading] = useState(false);
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedQuestion, setSelectedQuestion] = useState(
    SECURITY_QUESTIONS[Math.floor(Math.random() * SECURITY_QUESTIONS.length)]
  );

  const handleVerifyAnswer = async () => {
    if (!securityAnswer.trim()) {
      toast.error('Please enter your answer');
      return;
    }

    setLoading(true);
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select(selectedQuestion.key)
        .eq('id', userId)
        .single();

      if (error) throw error;

      const storedAnswer = profile[selectedQuestion.key]?.toLowerCase().trim();
      const userAnswer = securityAnswer.toLowerCase().trim();

      if (storedAnswer === userAnswer) {
        setStep('change');
        toast.success('Answer verified!');
      } else {
        toast.error('Incorrect answer. Please try again.');
        setSecurityAnswer('');
      }
    } catch (error: any) {
      toast.error('Failed to verify answer');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast.success('Password changed successfully!');
      handleClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to change password');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('verify');
    setSecurityAnswer('');
    setNewPassword('');
    setConfirmPassword('');
    setSelectedQuestion(SECURITY_QUESTIONS[Math.floor(Math.random() * SECURITY_QUESTIONS.length)]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change Password</DialogTitle>
          <DialogDescription>
            {step === 'verify'
              ? 'Answer your security question to verify your identity'
              : 'Enter your new password'}
          </DialogDescription>
        </DialogHeader>

        {step === 'verify' ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="font-semibold">{selectedQuestion.question}</Label>
              <Input
                type="text"
                placeholder="Your answer"
                value={securityAnswer}
                onChange={(e) => setSecurityAnswer(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleVerifyAnswer()}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleVerifyAnswer} disabled={loading}>
                {loading ? 'Verifying...' : 'Verify'}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Confirm Password</Label>
              <Input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleChangePassword()}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleChangePassword} disabled={loading}>
                {loading ? 'Changing...' : 'Change Password'}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ChangePasswordDialog;
