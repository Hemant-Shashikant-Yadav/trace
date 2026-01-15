import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { History, User, FileCode, ArrowRight } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ActivityLogEntry {
  id: string;
  asset_id: string;
  asset_name: string;
  old_status: "pending" | "received" | "implemented";
  new_status: "pending" | "received" | "implemented";
  changed_by: string;
  changed_by_email: string | null;
  changed_by_nickname: string | null;
  created_at: string;
}

interface ProjectActivityLogProps {
  projectId: string;
}

export const ProjectActivityLog = ({ projectId }: ProjectActivityLogProps) => {
  const { data: logs = [], isLoading, error } = useQuery({
    queryKey: ["project-activity-log", projectId],
    queryFn: async () => {
      // Fetch asset_history for all assets in this project
      const { data: assets, error: assetsError } = await supabase
        .from("assets")
        .select("id, name")
        .eq("project_id", projectId);

      if (assetsError) {
        console.error("Error fetching assets for activity log:", assetsError);
        throw assetsError;
      }

      if (!assets || assets.length === 0) {
        return [];
      }

      const assetIds = assets.map(a => a.id);
      const assetNameMap = new Map(assets.map(a => [a.id, a.name]));

      // Fetch history for all assets in this project
      const { data: history, error: historyError } = await supabase
        .from("asset_history")
        .select("*")
        .in("asset_id", assetIds)
        .order("created_at", { ascending: false })
        .limit(100); // Limit to last 100 entries

      if (historyError) {
        console.error("Error fetching history:", historyError);
        throw historyError;
      }

      // Enrich history with asset names and user details
      const enrichedLogs: ActivityLogEntry[] = [];

      for (const entry of history || []) {
        // Get user profile for changed_by
        const { data: profile } = await (supabase as any)
          .from("profiles")
          .select("email, nickname")
          .eq("id", entry.changed_by)
          .single();

        enrichedLogs.push({
          id: entry.id,
          asset_id: entry.asset_id,
          asset_name: assetNameMap.get(entry.asset_id) || "Unknown Asset",
          old_status: entry.old_status,
          new_status: entry.new_status,
          changed_by: entry.changed_by,
          changed_by_email: profile?.email || null,
          changed_by_nickname: profile?.nickname || null,
          created_at: entry.created_at,
        });
      }

      return enrichedLogs;
    },
    enabled: !!projectId,
    staleTime: 60000, // Cache for 1 minute
  });

  const getStatusColorClass = (status: string) => {
    switch (status) {
      case "pending":
        return "text-destructive font-mono uppercase";
      case "received":
        return "text-warning font-mono uppercase";
      case "implemented":
        return "text-success font-mono uppercase";
      default:
        return "text-muted-foreground font-mono uppercase";
    }
  };

  const getStatusChangeIndicator = (oldStatus: string, newStatus: string) => {
    const statusOrder = { pending: 0, received: 1, implemented: 2 };
    const isBackward = statusOrder[newStatus as keyof typeof statusOrder] < statusOrder[oldStatus as keyof typeof statusOrder];
    
    if (isBackward) {
      return <span className="text-orange-500 text-xs ml-2">(REWORK)</span>;
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-primary animate-pulse font-display tracking-widest">
          LOADING ACTIVITY LOG...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-destructive font-display tracking-wider">
          ERROR LOADING LOGS: {(error as Error).message}
        </div>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <History className="w-16 h-16 text-muted-foreground/30 mb-4" />
        <h2 className="text-xl font-display text-muted-foreground mb-2">
          NO ACTIVITY YET
        </h2>
        <p className="text-muted-foreground/60 text-sm">
          Status changes will appear here once team members start working on assets.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <History className="w-6 h-6 text-primary" />
        <h2 className="text-xl font-display tracking-wider text-foreground">
          PROJECT ACTIVITY LOG
        </h2>
        <span className="text-sm text-muted-foreground">
          ({logs.length} {logs.length === 1 ? "event" : "events"})
        </span>
      </div>

      {/* Activity Table */}
      <div className="command-border rounded-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent bg-secondary/50">
              <TableHead className="text-muted-foreground font-display text-xs tracking-wider">
                TIMESTAMP
              </TableHead>
              <TableHead className="text-muted-foreground font-display text-xs tracking-wider">
                USER
              </TableHead>
              <TableHead className="text-muted-foreground font-display text-xs tracking-wider">
                ASSET
              </TableHead>
              <TableHead className="text-muted-foreground font-display text-xs tracking-wider">
                STATUS CHANGE
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow 
                key={log.id} 
                className="border-border hover:bg-secondary/20 transition-colors"
              >
                {/* Timestamp */}
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {format(new Date(log.created_at), "MMM dd, yyyy HH:mm:ss")}
                </TableCell>

                {/* User */}
                <TableCell className="text-sm">
                  <div className="flex items-center gap-2">
                    <User className="w-3 h-3 text-muted-foreground" />
                    <span className="text-foreground">
                      {log.changed_by_nickname || log.changed_by_email || "Unknown User"}
                    </span>
                  </div>
                </TableCell>

                {/* Asset */}
                <TableCell className="text-sm">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-3 h-3 text-primary" />
                    <span className="font-mono text-foreground">{log.asset_name}</span>
                  </div>
                </TableCell>

                {/* Status Change */}
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className={getStatusColorClass(log.old_status)}>
                      {log.old_status}
                    </span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    <span className={getStatusColorClass(log.new_status)}>
                      {log.new_status}
                    </span>
                    {getStatusChangeIndicator(log.old_status, log.new_status)}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Footer Note */}
      <div className="text-xs text-muted-foreground text-center pt-4">
        Showing last {logs.length} {logs.length === 1 ? "activity" : "activities"} • 
        Updates refresh automatically
      </div>
    </div>
  );
};
