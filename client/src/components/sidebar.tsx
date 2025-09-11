import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Sidebar() {
  const { user } = useAuth();

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <div className="bg-card border-r border-border w-64 flex-shrink-0 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="bg-primary text-primary-foreground rounded-lg p-2">
            <i className="fas fa-map-marked-alt text-lg"></i>
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">ReGIS</h1>
            <p className="text-sm text-muted-foreground">Asset & Records</p>
          </div>
        </div>
      </div>

      {/* User Profile */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="bg-secondary rounded-full w-10 h-10 flex items-center justify-center">
            {user?.profileImageUrl ? (
              <img 
                src={user.profileImageUrl} 
                alt="Profile" 
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <i className="fas fa-user text-muted-foreground"></i>
            )}
          </div>
          <div>
            <p className="font-medium text-foreground" data-testid="text-user-name">
              {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.email || 'User'}
            </p>
            <p className="text-sm text-muted-foreground" data-testid="text-user-role">
              {user?.role || 'User'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-2">
        <Link href="/" className="block">
          <div className="flex items-center space-x-3 px-3 py-2 rounded-lg bg-primary text-primary-foreground" data-testid="link-dashboard">
            <i className="fas fa-tachometer-alt"></i>
            <span>Dashboard</span>
          </div>
        </Link>
        <Link href="/assets" className="block">
          <div className="flex items-center space-x-3 px-3 py-2 rounded-lg text-foreground hover:bg-accent transition-colors" data-testid="link-assets">
            <i className="fas fa-box"></i>
            <span>Assets</span>
          </div>
        </Link>
        <Link href="/staff" className="block">
          <div className="flex items-center space-x-3 px-3 py-2 rounded-lg text-foreground hover:bg-accent transition-colors" data-testid="link-staff">
            <i className="fas fa-users"></i>
            <span>Staff Directory</span>
          </div>
        </Link>
        <Link href="/documents" className="block">
          <div className="flex items-center space-x-3 px-3 py-2 rounded-lg text-foreground hover:bg-accent transition-colors" data-testid="link-documents">
            <i className="fas fa-file-alt"></i>
            <span>Documents</span>
          </div>
        </Link>
        <Link href="/workflows" className="block">
          <div className="flex items-center space-x-3 px-3 py-2 rounded-lg text-foreground hover:bg-accent transition-colors" data-testid="link-workflows">
            <i className="fas fa-project-diagram"></i>
            <span>Workflows</span>
          </div>
        </Link>
        <div className="flex items-center space-x-3 px-3 py-2 rounded-lg text-foreground hover:bg-accent transition-colors cursor-pointer">
          <i className="fas fa-mobile-alt"></i>
          <span>Mobile App</span>
        </div>
        <div className="flex items-center space-x-3 px-3 py-2 rounded-lg text-foreground hover:bg-accent transition-colors cursor-pointer">
          <i className="fas fa-chart-bar"></i>
          <span>Reports</span>
        </div>
        <Link href="/audit" className="block">
          <div className="flex items-center space-x-3 px-3 py-2 rounded-lg text-foreground hover:bg-accent transition-colors" data-testid="link-audit">
            <i className="fas fa-history"></i>
            <span>Audit Logs</span>
          </div>
        </Link>
      </nav>

      {/* Settings and Logout */}
      <div className="p-4 border-t border-border space-y-2">
        <div className="flex items-center space-x-3 px-3 py-2 rounded-lg text-foreground hover:bg-accent transition-colors cursor-pointer">
          <i className="fas fa-cog"></i>
          <span>Settings</span>
        </div>
        <Button 
          variant="ghost" 
          className="w-full justify-start" 
          onClick={handleLogout}
          data-testid="button-logout"
        >
          <i className="fas fa-sign-out-alt mr-3"></i>
          <span>Logout</span>
        </Button>
      </div>
    </div>
  );
}
