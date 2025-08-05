import { Button } from '@/components/ui/button';
import { Building2, LogOut, Users, Target, BarChart3, Home, Building, GitBranch } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Link, useLocation } from 'react-router-dom';
import RealtimeNotifications from './RealtimeNotifications';

const Navbar = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const location = useLocation();

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      });
    }
  };

  const navItems = [
    { to: '/', icon: Home, label: 'Dashboard' },
    { to: '/leads', icon: Users, label: 'Leads' },
    { to: '/companies', icon: Building, label: 'Companies' },
    { to: '/applications', icon: Target, label: 'Applications' },
    { to: '/pipeline', icon: GitBranch, label: 'Pipeline' },
    { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  ];

  return (
    <nav className="bg-card border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center">
              <Building2 className="h-8 w-8 text-primary mr-3" />
              <h1 className="text-xl font-semibold text-foreground">High Rise Capital CRM</h1>
            </Link>
            
            <div className="hidden md:flex space-x-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary/20 text-primary border border-primary/30'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-muted-foreground">Welcome, {user?.email}</span>
            <RealtimeNotifications />
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="border-border bg-card text-card-foreground hover:bg-accent"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;