import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useToast } from '@/hooks/use-toast';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute = ({ children }: AdminRouteProps) => {
  const { profile, loading } = useUserProfile();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && profile) {
      if (profile.role !== 'admin') {
        toast({
          title: "Access Denied",
          description: "You don't have permission to access this page.",
          variant: "destructive",
        });
        navigate('/');
      }
    }
  }, [profile, loading, navigate, toast]);

  // Show loading while checking permissions
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Checking permissions...</div>
      </div>
    );
  }

  // Only render children if user is admin
  if (profile?.role === 'admin') {
    return <>{children}</>;
  }

  // Return null while redirecting
  return null;
};

export default AdminRoute;