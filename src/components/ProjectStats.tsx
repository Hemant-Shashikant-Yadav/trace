import { FileCode, Clock, CheckCircle, AlertTriangle, Activity } from "lucide-react";
import { format } from "date-fns";

interface Asset {
  id: string;
  status: "pending" | "received" | "implemented";
  received_at: string | null;
  implemented_at: string | null;
  created_at: string;
  name: string;
}

interface ProjectStatsProps {
  assets: Asset[];
}

export const ProjectStats = ({ assets }: ProjectStatsProps) => {
  const pendingCount = assets.filter((a) => a.status === "pending").length;
  const receivedCount = assets.filter((a) => a.status === "received").length;
  const implementedCount = assets.filter((a) => a.status === "implemented").length;

  // Get recent activity (last 5 status changes)
  const recentActivity = assets
    .filter((a) => a.received_at || a.implemented_at)
    .map((a) => ({
      name: a.name,
      action: a.implemented_at ? "implemented" : "received",
      timestamp: a.implemented_at || a.received_at,
    }))
    .sort((a, b) => new Date(b.timestamp!).getTime() - new Date(a.timestamp!).getTime())
    .slice(0, 5);

  const stats = [
    {
      label: "PENDING",
      value: pendingCount,
      icon: AlertTriangle,
      className: "text-destructive border-destructive/30 bg-destructive/10",
      iconClass: "text-destructive",
    },
    {
      label: "RECEIVED",
      value: receivedCount,
      icon: Clock,
      className: "text-warning border-warning/30 bg-warning/10",
      iconClass: "text-warning",
    },
    {
      label: "IMPLEMENTED",
      value: implementedCount,
      icon: CheckCircle,
      className: "text-success border-success/30 bg-success/10",
      iconClass: "text-success",
    },
    {
      label: "TOTAL",
      value: assets.length,
      icon: FileCode,
      className: "text-primary border-primary/30 bg-primary/10",
      iconClass: "text-primary",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`command-border rounded-sm p-4 ${stat.className}`}
          >
            <div className="flex items-center justify-between mb-2">
              <stat.icon className={`w-5 h-5 ${stat.iconClass}`} />
              <span className="text-3xl font-display font-bold">{stat.value}</span>
            </div>
            <div className="text-xs font-display tracking-wider opacity-80">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <div className="command-border bg-card/80 backdrop-blur-sm rounded-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-primary" />
            <h3 className="font-display text-xs tracking-wider text-foreground">
              RECENT ACTIVITY
            </h3>
          </div>
          <div className="space-y-2">
            {recentActivity.map((activity, index) => (
              <div
                key={index}
                className="flex items-center justify-between text-xs border-b border-border/30 pb-2 last:border-0 last:pb-0"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      activity.action === "implemented"
                        ? "bg-success"
                        : "bg-warning"
                    }`}
                  />
                  <span className="font-mono text-muted-foreground truncate max-w-[150px]">
                    {activity.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`font-display tracking-wider ${
                      activity.action === "implemented"
                        ? "text-success"
                        : "text-warning"
                    }`}
                  >
                    {activity.action.toUpperCase()}
                  </span>
                  <span className="text-muted-foreground/60">
                    {format(new Date(activity.timestamp!), "MMM d, HH:mm")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
