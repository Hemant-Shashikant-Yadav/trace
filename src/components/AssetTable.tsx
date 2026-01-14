import { useState } from "react";
import { FileCode, Clock, User, ChevronDown, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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

interface Asset {
  id: string;
  project_id: string;
  name: string;
  file_path: string;
  status: "pending" | "received" | "implemented";
  assigned_to: string | null;
  received_at: string | null;
  implemented_at: string | null;
  created_at: string;
}

interface AssetTableProps {
  assets: Asset[];
  onStatusUpdate: (assetId: string, status: "pending" | "received" | "implemented") => void;
  onAssigneeUpdate: (assetId: string, assignedTo: string) => void;
  onDeleteAsset: (assetId: string) => void;
}

const StatusBadge = ({
  status,
  onClick,
}: {
  status: "pending" | "received" | "implemented";
  onClick: () => void;
}) => {
  const configs = {
    pending: {
      label: "PENDING",
      className: "bg-destructive/20 text-destructive border-destructive/50 glow-red",
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

  const config = configs[status];

  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 text-xs font-display tracking-wider border rounded-sm transition-all hover:scale-105 ${config.className}`}
    >
      {config.label}
    </button>
  );
};

export const AssetTable = ({
  assets,
  onStatusUpdate,
  onAssigneeUpdate,
  onDeleteAsset,
}: AssetTableProps) => {
  const [editingAssignee, setEditingAssignee] = useState<string | null>(null);
  const [assigneeValue, setAssigneeValue] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const handleStatusClick = (asset: Asset) => {
    const nextStatus: Record<"pending" | "received" | "implemented", "pending" | "received" | "implemented"> = {
      pending: "received",
      received: "implemented",
      implemented: "pending",
    };
    onStatusUpdate(asset.id, nextStatus[asset.status]);
  };

  const handleAssigneeEdit = (asset: Asset) => {
    setEditingAssignee(asset.id);
    setAssigneeValue(asset.assigned_to || "");
  };

  const handleAssigneeSave = (assetId: string) => {
    onAssigneeUpdate(assetId, assigneeValue);
    setEditingAssignee(null);
    setAssigneeValue("");
  };

  const filteredAssets = assets.filter(
    (asset) =>
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.file_path.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (asset.assigned_to?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
  );

  const formatTimestamp = (timestamp: string | null) => {
    if (!timestamp) return "—";
    return format(new Date(timestamp), "MMM d, HH:mm");
  };

  if (assets.length === 0) {
    return (
      <div className="command-border bg-card/80 backdrop-blur-sm p-12 rounded-sm text-center">
        <FileCode className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
        <h3 className="font-display text-muted-foreground mb-2">NO ASSETS TRACKED</h3>
        <p className="text-muted-foreground/60 text-sm">
          Import a .zip file structure to begin tracking assets
        </p>
      </div>
    );
  }

  return (
    <div className="command-border bg-card/80 backdrop-blur-sm rounded-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileCode className="w-5 h-5 text-primary" />
          <h2 className="font-display text-sm tracking-wider text-foreground">
            ASSET REGISTRY
          </h2>
          <span className="text-muted-foreground text-xs font-mono">
            [{assets.length} files]
          </span>
        </div>
        
        <Input
          placeholder="Search assets..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-xs bg-input border-border text-sm"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground font-display text-xs tracking-wider">
                ASSET NAME
              </TableHead>
              <TableHead className="text-muted-foreground font-display text-xs tracking-wider">
                FILE PATH
              </TableHead>
              <TableHead className="text-muted-foreground font-display text-xs tracking-wider">
                STATUS
              </TableHead>
              <TableHead className="text-muted-foreground font-display text-xs tracking-wider">
                ASSIGNED TO
              </TableHead>
              <TableHead className="text-muted-foreground font-display text-xs tracking-wider">
                <Clock className="w-3 h-3 inline mr-1" />
                TIMESTAMPS
              </TableHead>
              <TableHead className="text-muted-foreground font-display text-xs tracking-wider w-12">
                ACTIONS
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAssets.map((asset) => (
              <TableRow
                key={asset.id}
                className="border-border hover:bg-secondary/30 transition-colors"
              >
                <TableCell className="font-mono text-sm text-foreground">
                  {asset.name}
                </TableCell>
                <TableCell className="font-mono-path text-xs max-w-[300px] truncate" title={asset.file_path}>
                  {asset.file_path}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <div className="cursor-pointer flex items-center gap-1">
                        <StatusBadge
                          status={asset.status}
                          onClick={() => {}}
                        />
                        <ChevronDown className="w-3 h-3 text-muted-foreground" />
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-card border-border">
                      <DropdownMenuItem
                        onClick={() => onStatusUpdate(asset.id, "pending")}
                        className="text-destructive focus:text-destructive"
                      >
                        PENDING
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onStatusUpdate(asset.id, "received")}
                        className="text-warning focus:text-warning"
                      >
                        RECEIVED
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onStatusUpdate(asset.id, "implemented")}
                        className="text-success focus:text-success"
                      >
                        IMPLEMENTED
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
                <TableCell>
                  {editingAssignee === asset.id ? (
                    <Input
                      value={assigneeValue}
                      onChange={(e) => setAssigneeValue(e.target.value)}
                      onBlur={() => handleAssigneeSave(asset.id)}
                      onKeyDown={(e) => e.key === "Enter" && handleAssigneeSave(asset.id)}
                      autoFocus
                      className="h-7 text-xs bg-input border-border w-32"
                    />
                  ) : (
                    <button
                      onClick={() => handleAssigneeEdit(asset)}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                    >
                      <User className="w-3 h-3" />
                      {asset.assigned_to || "Unassigned"}
                    </button>
                  )}
                </TableCell>
                <TableCell className="text-xs">
                  <div className="space-y-1">
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
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredAssets.length === 0 && assets.length > 0 && (
        <div className="p-8 text-center text-muted-foreground text-sm">
          No assets match your search criteria
        </div>
      )}
    </div>
  );
};
