import { useGetDashboardStats } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, MessageSquare, Mail, Eye, Users, FolderTree } from "lucide-react";
import { formatDateTime } from "@/lib/format";

export default function Dashboard() {
  const { data: stats, isLoading } = useGetDashboardStats();

  if (isLoading || !stats) {
    return (
      <AdminLayout>
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>)}
          </div>
        </div>
      </AdminLayout>
    );
  }

  const statCards = [
    { title: "Total Posts", value: stats.totalPosts, icon: FileText, subtext: `${stats.publishedPosts} published` },
    { title: "Total Views", value: stats.totalViews.toLocaleString(), icon: Eye, subtext: "Across all posts" },
    { title: "Subscribers", value: stats.totalSubscribers, icon: Mail, subtext: "Newsletter readers" },
    { title: "Categories", value: stats.totalCategories, icon: FolderTree, subtext: "Active sections" },
    { title: "Messages", value: stats.totalMessages, icon: MessageSquare, subtext: `${stats.unreadMessages} unread` },
    { title: "Registered Users", value: stats.totalUsers || 0, icon: Users, subtext: "Community members" },
  ];

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Overview of your publishing platform</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statCards.map((stat, i) => (
          <Card key={i} className="border-none shadow-sm shadow-black/5 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">{stat.title}</CardTitle>
              <stat.icon className="w-4 h-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
              <p className="text-xs text-gray-500 mt-1 font-medium">{stat.subtext}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-none shadow-sm shadow-black/5">
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentActivity && stats.recentActivity.length > 0 ? (
              <div className="space-y-6">
                {stats.recentActivity.map((activity, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-2 h-2 mt-2 rounded-full bg-primary shrink-0" />
                    <div>
                      <p className="text-sm text-gray-800">{activity.description}</p>
                      <p className="text-xs text-gray-500 mt-1">{formatDateTime(activity.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-8">No recent activity</p>
            )}
          </CardContent>
        </Card>
        
        {/* We would render top posts or categories here if we had that data readily available in the dashboard stats, 
            but for now we'll just keep it simple and clean */}
      </div>
    </AdminLayout>
  );
}
