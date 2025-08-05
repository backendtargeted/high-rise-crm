import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Send, FileSignature, CheckCircle } from 'lucide-react';
import Navbar from '@/components/Navbar';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Dashboard</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Today's tasks - Large left card */}
          <Card className="lg:col-span-1 bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg font-medium text-card-foreground">
                Today's tasks
              </CardTitle>
            </CardHeader>
            <CardContent className="h-64 flex items-center justify-center">
              <div className="text-muted-foreground text-sm">
                No tasks scheduled
              </div>
            </CardContent>
          </Card>

          {/* Right side metrics */}
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Top row metrics */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-card-foreground flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Funded Deals $$
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-card-foreground">$0</div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-card-foreground flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  Apps Sent
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-card-foreground">0</div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-card-foreground flex items-center gap-2">
                  <FileSignature className="h-4 w-4" />
                  Apps Signed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-card-foreground">0</div>
              </CardContent>
            </Card>

            {/* Bottom larger card spanning 3 columns */}
            <Card className="md:col-span-3 bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg font-medium text-card-foreground flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Sent last 7 days not signed
                </CardTitle>
              </CardHeader>
              <CardContent className="h-32 flex items-center justify-center">
                <div className="text-muted-foreground text-sm">
                  No pending applications
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
