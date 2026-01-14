import React, { useState } from "react";
import { Clock, User, ChevronDown, Trash2, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  TableCell,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { Asset } from "./types";
import { useProjectMembersSimple } from "@/hooks/useProjectMembers";
import { AssetHistoryPopover } from "./AssetHistoryPopover";
import { ReworkModal } from "./ReworkModal";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface AssetRowProps {
  asset: Asset;
  projectId: string;
  onStatusUpdate: (assetId: string, status: "pending" | "received" | "implemented") => void;
  onAssigneeUpdate: (assetId: string, assignedTo: string) => void;
  onDeleteAsset: (assetId: string) => void;
}

const StatusBadge = ({
  status,
  revisionCount,
  onClick,
}: {
  status: "pending" | "received" | "implemented";
  revisionCount: number;
  onClick: () => void;
}) => {
  // Determine if this is a rework state
  const isRework = status === "pending" && revisionCount > 0;
  
  const configs = {
    pending: {
      label: "PENDING",
      className: "bg-destructive/20 text-destructive border-destructive/50 glow-red",
    },
    rework: {
      label: "REWORK",
      className: "bg-orange-500/20 text-orange-500 border-orange-500/50",
    },
    received: {
      label: "RECEIVED",
      className: "bg-warning/20 text-warning border-warning/50 glow-yellow",
    },
    implemented: {
      label: "IMPLEMENTED",
      className: "bg-success/20 text-success border-success/50 glow-green",
    },
  };

  const config = isRework ? configs.rework : configs[status];

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onClick}
        className={`px-3 py-1 text-xs font-display tracking-wider border rounded-sm transition-all hover:scale-105 ${config.className}`}
      >
        {config.label}
      </button>
      {revisionCount > 0 && (
        <span className="text-xs text-muted-foreground font-mono">
          (v{revisionCount + 1})
        </span>
      )}
    </div>
  );
};

export const AssetRow = React.memo(
  ({ asset, projectId, onStatusUpdate, onAssigneeUpdate, onDeleteAsset }: AssetRowProps) => {
    const [editingNotes, setEditingNotes] = useState(false);
    const [notesValue, setNotesValue] = useState("");
    const [reworkModalOpen, setReworkModalOpen] = useState(false);
    const [pendingStatus, setPendingStatus] = useState<"pending" | "received" | "implemented" | null>(null);
    
    const queryClient = useQueryClient();
    
    // Fetch project members for assignee dropdown
    const { data: members = [] } = useProjectMembersSimple(projectId);

    const handleAssigneeSelect = (email: string) => {
      onAssigneeUpdate(asset.id, email);
    };

    const handleUnassign = () => {
      onAssigneeUpdate(asset.id, "");
    };

    const handleNotesEdit = () => {
      setEditingNotes(true);
      setNotesValue(asset.notes || "");
    };

    const handleNotesSave = async () => {
      // Update notes via supabase
      await supabase
        .from("assets")
        .update({ notes: notesValue || null })
        .eq("id", asset.id);
      
      setEditingNotes(false);
      setNotesValue("");
    };

    const formatTimestamp = (timestamp: string | null) => {
      if (!timestamp) return "—";
      return format(new Date(timestamp), "MMM d, HH:mm");
    };

    // Check if status change is backward (requires rework modal)
    const isBackwardTransition = (oldStatus: string, newStatus: string): boolean => {
      const statusOrder = { pending: 0, received: 1, implemented: 2 };
      return statusOrder[newStatus as keyof typeof statusOrder] < statusOrder[oldStatus as keyof typeof statusOrder];
    };

    // Handle status change with interception
    const handleStatusChange = async (newStatus: "pending" | "received" | "implemented") => {
      const oldStatus = asset.status;
      
      if (isBackwardTransition(oldStatus, newStatus)) {
        // Open rework modal
        setPendingStatus(newStatus);
        setReworkModalOpen(true);
      } else {
        // Normal forward transition
        onStatusUpdate(asset.id, newStatus);
        
        // Invalidate asset history to refresh UI immediately
        // Small delay to allow DB trigger to complete
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ["asset-history", asset.id] });
        }, 300);
      }
    };

    // Handle rework submission
    const handleReworkSubmit = async (reason: string) => {
      if (!pendingStatus) return;

      // Update status and notes in database
      const { error } = await supabase
        .from("assets")
        .update({
          status: pendingStatus,
          notes: reason,
        })
        .eq("id", asset.id);

      if (!error) {
        // Invalidate asset history to refresh UI
        queryClient.invalidateQueries({ queryKey: ["asset-history", asset.id] });
        
        // Close modal and trigger parent refetch
        setReworkModalOpen(false);
        setPendingStatus(null);
        onStatusUpdate(asset.id, pendingStatus);
      }
    };

    return (
      <TableRow
        key={asset.id}
        className="border-border hover:bg-secondary/30 transition-colors"
      >
        <TableCell className="font-mono text-sm text-foreground">
          {asset.name}
        </TableCell>
        <TableCell className="font-mono-path text-xs max-w-[200px] truncate" title={asset.file_path}>
          {asset.file_path}
        </TableCell>
        <TableCell>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="cursor-pointer flex items-center gap-1">
                <StatusBadge
                  status={asset.status}
                  revisionCount={asset.revision_count}
                  onClick={() => {}}
                />
                <ChevronDown className="w-3 h-3 text-muted-foreground" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-card border-border">
              <DropdownMenuItem
                onClick={() => handleStatusChange("pending")}
                className="text-destructive focus:text-destructive"
              >
                PENDING
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleStatusChange("received")}
                className="text-warning focus:text-warning"
              >
                RECEIVED
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleStatusChange("implemented")}
                className="text-success focus:text-success"
              >
                IMPLEMENTED
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
        <TableCell>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                <User className="w-3 h-3" />
                {asset.assigned_to || "Unassigned"}
                <ChevronDown className="w-3 h-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-card border-border">
              <DropdownMenuItem onClick={handleUnassign} className="text-muted-foreground">
                <UserPlus className="w-3 h-3 mr-2" />
                Unassigned
              </DropdownMenuItem>
              {members.length > 0 && <DropdownMenuSeparator />}
              {members.map((member) => (
                <DropdownMenuItem
                  key={member.user_id}
                  onClick={() => handleAssigneeSelect(member.email)}
                  className={asset.assigned_to === member.email ? "bg-secondary" : ""}
                >
                  <User className="w-3 h-3 mr-2" />
                  {member.nickname || member.email}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
        <TableCell>
          {editingNotes ? (
            <Input
              value={notesValue}
              onChange={(e) => setNotesValue(e.target.value)}
              onBlur={handleNotesSave}
              onKeyDown={(e) => e.key === "Enter" && handleNotesSave()}
              autoFocus
              className="h-7 text-xs bg-input border-border w-40"
            />
          ) : (
            <button
              onClick={handleNotesEdit}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors truncate max-w-[150px] text-left"
              title={asset.notes || "Add notes..."}
            >
              {asset.notes || "—"}
            </button>
          )}
        </TableCell>
        <TableCell className="text-xs">
          <div className="flex items-center gap-2">
            <div className="space-y-1 flex-1">
              {asset.received_at && (
                <div className="text-warning/80">
                  Recv: {formatTimestamp(asset.received_at)}
                </div>
              )}
              {asset.implemented_at && (
                <div className="text-success/80">
                  Impl: {formatTimestamp(asset.implemented_at)}
                </div>
              )}
              {!asset.received_at && !asset.implemented_at && (
                <span className="text-muted-foreground/50">—</span>
              )}
            </div>
            <AssetHistoryPopover assetId={asset.id} />
          </div>
        </TableCell>
        <TableCell>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-card border-border">
              <AlertDialogHeader>
                <AlertDialogTitle className="font-display tracking-wider text-foreground">
                  CONFIRM DELETION
                </AlertDialogTitle>
                <AlertDialogDescription className="text-muted-foreground">
                  Are you sure you want to delete{" "}
                  <span className="font-mono text-foreground">{asset.name}</span>?
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="border-border">CANCEL</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDeleteAsset(asset.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  DELETE
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </TableCell>

        {/* Rework Modal */}
        <ReworkModal
          isOpen={reworkModalOpen}
          onClose={() => {
            setReworkModalOpen(false);
            setPendingStatus(null);
          }}
          onSubmit={handleReworkSubmit}
          assetName={asset.name}
          oldStatus={asset.status}
          newStatus={pendingStatus || "pending"}
        />
      </TableRow>
    );
  },
  // Custom comparison function for memo optimization
  (prevProps, nextProps) => {
    // Only re-render if asset data or projectId changed
    return (
      prevProps.asset.id === nextProps.asset.id &&
      prevProps.asset.updated_at === nextProps.asset.updated_at &&
      prevProps.asset.status === nextProps.asset.status &&
      prevProps.asset.revision_count === nextProps.asset.revision_count &&
      prevProps.asset.assigned_to === nextProps.asset.assigned_to &&
      prevProps.asset.notes === nextProps.asset.notes &&
      prevProps.projectId === nextProps.projectId
    );
  }
);

AssetRow.displayName = "AssetRow";
