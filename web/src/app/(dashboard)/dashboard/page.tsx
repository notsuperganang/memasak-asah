// web/src/app/(dashboard)/dashboard/page.tsx
import { Topbar } from '@/components/layout/topbar';
import { Button } from '@/components/ui/button';
import { Upload, TrendingUp, Users, BarChart3 } from 'lucide-react';

export default function DashboardPage() {
  return (
    <>
      <Topbar 
        title="Dashboard" 
        subtitle="Overview of your lead scoring campaigns"
      />
      
      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={<Upload className="w-6 h-6 text-primary-600" />}
            label="Total Campaigns"
            value="12"
            bgColor="bg-primary-50"
          />
          <StatCard
            icon={<Users className="w-6 h-6 text-blue-600" />}
            label="Total Leads"
            value="3,456"
            bgColor="bg-blue-50"
          />
          <StatCard
            icon={<TrendingUp className="w-6 h-6 text-green-600" />}
            label="High Risk Leads"
            value="892"
            bgColor="bg-green-50"
          />
          <StatCard
            icon={<BarChart3 className="w-6 h-6 text-orange-600" />}
            label="Avg Probability"
            value="67%"
            bgColor="bg-orange-50"
          />
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Actions
          </h2>
          <div className="flex flex-wrap gap-4">
            <Button>
              <Upload className="w-4 h-4 mr-2" />
              Upload Campaign
            </Button>
            <Button variant="outline">
              Quick Score
            </Button>
          </div>
        </div>

        {/* Recent Campaigns Placeholder */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Campaigns
          </h2>
          <p className="text-gray-500 text-center py-8">
            No campaigns yet. Upload your first CSV to get started!
          </p>
        </div>
      </div>
    </>
  );
}

// Stat Card Component
function StatCard({ 
  icon, 
  label, 
  value, 
  bgColor 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string; 
  bgColor: string;
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`${bgColor} p-3 rounded-lg`}>
          {icon}
        </div>
      </div>
    </div>
  );
}