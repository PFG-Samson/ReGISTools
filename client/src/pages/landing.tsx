import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-primary text-primary-foreground rounded-lg p-4">
              <i className="fas fa-map-marked-alt text-3xl"></i>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">ReGIS</h1>
          <p className="text-xl text-muted-foreground mb-2">Enterprise Asset & Records System</p>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            A secure, government-grade GIS-driven Enterprise Asset & Records System that combines 
            a modern spatial data backbone with integrated staff and document management.
          </p>
        </div>

        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">Welcome</h2>
              <p className="text-muted-foreground">
                Sign in to access your asset management dashboard and start managing your organization's resources.
              </p>
              <Button 
                onClick={handleLogin} 
                size="lg" 
                className="w-full"
                data-testid="button-login"
              >
                <i className="fas fa-sign-in-alt mr-2"></i>
                Sign In
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="bg-primary/10 rounded-lg p-3 w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                  <i className="fas fa-box text-primary text-xl"></i>
                </div>
                <h3 className="font-semibold text-foreground mb-2">Asset Management</h3>
                <p className="text-sm text-muted-foreground">
                  Track and manage all your assets with spatial location data and lifecycle information.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="bg-green-100 rounded-lg p-3 w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                  <i className="fas fa-users text-green-600 text-xl"></i>
                </div>
                <h3 className="font-semibold text-foreground mb-2">Staff Directory</h3>
                <p className="text-sm text-muted-foreground">
                  Maintain staff records with organizational hierarchy and location tracking.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="bg-orange-100 rounded-lg p-3 w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                  <i className="fas fa-file-alt text-orange-600 text-xl"></i>
                </div>
                <h3 className="font-semibold text-foreground mb-2">Document Management</h3>
                <p className="text-sm text-muted-foreground">
                  Store and organize documents with metadata tagging and retention policies.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
