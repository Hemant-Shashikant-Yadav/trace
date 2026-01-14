import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AssetHistoryEntry {
  id: string;
  asset_id: string;
  old_status: "pending" | "received" | "implemented";
  new_status: "pending" | "received" | "implemented";
  created_at: string;
  user_email?: string;
  changed_by: string;
}

/**
 * Hook to fetch asset history with user email resolution
 * Since direct access to auth.users may be blocked by RLS,
 * this fetches history and attempts to resolve the changed_by UUID
 */
export function useAssetHistory(assetId: string | null) {
  return useQuery({
    queryKey: ["asset-history", assetId],
    queryFn: async () => {
      if (!assetId) return [];

      // Fetch asset history
      const { data: history, error } = await supabase
        .from("asset_history")
        .select("*")
        .eq("asset_id", assetId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching asset history:", error);
        return [];
      }

      if (!history || history.length === 0) {
        return [];
      }

      // Try to get current user to see if we can resolve at least their email
      const { data: { user } } = await supabase.auth.getUser();

      // Enhance history with user emails where possible
      const enhancedHistory = history.map((entry) => {
        const enhanced: AssetHistoryEntry = {
          ...entry,
          user_email: undefined,
        };

        // If the changed_by matches current user, add their email
        if (user && entry.changed_by === user.id) {
          enhanced.user_email = user.email || undefined;
        }

        return enhanced;
      });

      return enhancedHistory;
    },
    enabled: !!assetId,
  });
}

/**
 * Format status for display
 */
export function formatStatus(status: "pending" | "received" | "implemented"): string {
  const statusMap = {
    pending: "Pending",
    received: "Received",
    implemented: "Implemented",
  };
  return statusMap[status];
}

/**
 * Determine if a status change is a backward transition (rework)
 */
export function isBackwardTransition(
  oldStatus: "pending" | "received" | "implemented",
  newStatus: "pending" | "received" | "implemented"
): boolean {
  const statusOrder = { pending: 0, received: 1, implemented: 2 };
  return statusOrder[newStatus] < statusOrder[oldStatus];
}
