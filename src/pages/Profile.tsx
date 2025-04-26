import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { updateProfile, getAuth } from 'firebase/auth';
import { useAuth } from '@/lib/AuthContext';
import PageTitle from '@/components/PageTitle';

const profileSchema = z.object({
  displayName: z.string().min(2, 'Name must be at least 2 characters').optional(),
  email: z.string().email('Invalid email address').optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const auth = getAuth();
  
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: user?.displayName || '',
      email: user?.email || '',
    }
  });

  const onSubmit = async (data: ProfileFormValues) => {
    if (!user || !auth.currentUser) return;
    
    setIsUpdating(true);
    try {
      // Note: Email change requires re-authentication in Firebase
      // This example only updates the display name
      await updateProfile(auth.currentUser, {
        displayName: data.displayName || user.displayName,
      });
      
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been successfully updated.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <PageTitle title="Profile" />
      <div className="glass-card mb-8 p-8">
        <h1 className="mb-6 text-3xl font-bold gradient-text">Your Profile</h1>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                placeholder="Your Name"
                className={errors.displayName ? 'border-red-500' : ''}
                {...register('displayName')}
              />
              {errors.displayName && (
                <p className="text-xs text-red-500">{errors.displayName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                disabled
                className="bg-muted"
                {...register('email')}
              />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed. Contact support for assistance.
              </p>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button
              type="submit"
              className="gradient-btn"
              disabled={isUpdating}
            >
              {isUpdating ? (
                <div className="flex items-center justify-center">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span className="ml-2">Updating...</span>
                </div>
              ) : (
                'Update Profile'
              )}
            </Button>
          </div>
        </form>
      </div>

      <div className="glass-card p-8">
        <h2 className="mb-6 text-2xl font-bold gradient-text">Account Information</h2>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-sm text-muted-foreground">Account Created</div>
            <div>{user?.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleString() : 'N/A'}</div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="text-sm text-muted-foreground">Last Sign In</div>
            <div>{user?.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleString() : 'N/A'}</div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="text-sm text-muted-foreground">User ID</div>
            <div className="break-all text-xs">{user?.uid}</div>
          </div>
        </div>
      </div>
    </div>
  );
} 