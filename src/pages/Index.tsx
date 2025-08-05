import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, LogOut, Users, Target, BarChart3 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const Index = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation Header */}
      <nav className="bg-slate-800/50 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-primary mr-3" />
              <h1 className="text-xl font-semibold text-white">High Rise Capital CRM</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-slate-300">Welcome, {user?.email}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="border-slate-600 bg-slate-700 text-slate-200 hover:bg-slate-600"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">CRM Dashboard</h2>
          <p className="text-slate-400">Manage your deals, leads, and track performance</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-200">
                Total Leads
              </CardTitle>
              <Users className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">2,350</div>
              <p className="text-xs text-slate-400">
                +20.1% from last month
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-200">
                Active Deals
              </CardTitle>
              <Target className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">145</div>
              <p className="text-xs text-slate-400">
                +12% from last month
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-200">
                Conversion Rate
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">8.2%</div>
              <p className="text-xs text-slate-400">
                +2.1% from last month
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="text-center py-12">
          <h3 className="text-2xl font-semibold text-white mb-4">🎉 Phase 1 Complete!</h3>
          <p className="text-slate-400 mb-6">
            Authentication and security foundation has been successfully implemented.
          </p>
          <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-6 max-w-2xl mx-auto">
            <h4 className="text-lg font-medium text-white mb-3">What's Next?</h4>
            <ul className="text-left text-slate-300 space-y-2">
              <li>✅ Database security with RLS policies</li>
              <li>✅ User authentication system</li>
              <li>✅ Role-based access control (User/Manager/Admin)</li>
              <li>🚀 Ready for Phase 2: Core Data Management</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
