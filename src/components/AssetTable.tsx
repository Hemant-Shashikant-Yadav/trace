import { useState, useMemo } from "react";
import { FileCode, Clock, User, ChevronDown, Trash2, Filter, ArrowUpDown, ChevronRight } from "lucide-react";
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";

interface Asset {
  id: string;
  project_id: string;
  name: string;
  file_path: string;
  folder: string | null;
  status: "pending" | "received" | "implemented";
  assigned_to: string | null;
  received_at: string | null;
  implemented_at: string | null;
  revision_count: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface AssetTableProps {
  assets: Asset[];
  onStatusUpdate: (assetId: string, status: "pending" | "received" | "implemented") => void;
  onAssigneeUpdate: (assetId: string, assignedTo: string) => void;
  onDeleteAsset: (assetId: string) => void;
}

type SortOption = "folder" | "date" | "status" | "cycles";

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

export const AssetTable = ({
  assets,
  onStatusUpdate,
  onAssigneeUpdate,
  onDeleteAsset,
}: AssetTableProps) => {
  const [editingAssignee, setEditingAssignee] = useState<string | null>(null);
  const [assigneeValue, setAssigneeValue] = useState("");
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesValue, setNotesValue] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showOnlyMyTasks, setShowOnlyMyTasks] = useState(false);
  const [showHighChurn, setShowHighChurn] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("folder");
  const [userEmail, setUserEmail] = useState<string>("");

  // Get current user email for "My Tasks" filter
  useState(() => {
    import("@/integrations/supabase/client").then(({ supabase }) => {
      supabase.auth.getUser().then(({ data }) => {
        if (data.user?.email) {
          setUserEmail(data.user.email);
        }
      });
    });
  });

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

  const handleNotesEdit = (asset: Asset) => {
    setEditingNotes(asset.id);
    setNotesValue(asset.notes || "");
  };

  const handleNotesSave = async (assetId: string) => {
    // Update notes via supabase
    const { supabase } = await import("@/integrations/supabase/client");
    await supabase
      .from("assets")
      .update({ notes: notesValue || null })
      .eq("id", assetId);
    
    setEditingNotes(null);
    setNotesValue("");
  };

  const formatTimestamp = (timestamp: string | null) => {
    if (!timestamp) return "—";
    return format(new Date(timestamp), "MMM d, HH:mm");
  };

  // Filter and sort assets
  const processedAssets = useMemo(() => {
    let filtered = assets.filter(
      (asset) =>
        asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.file_path.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (asset.assigned_to?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
    );

    // Apply "My Tasks" filter
    if (showOnlyMyTasks && userEmail) {
      filtered = filtered.filter(
        (asset) => asset.assigned_to?.toLowerCase() === userEmail.toLowerCase()
      );
    }

    // Apply "High Churn" filter
    if (showHighChurn) {
      filtered = filtered.filter((asset) => asset.revision_count > 2);
    }

    // Sort assets
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "folder":
          return (a.folder || "").localeCompare(b.folder || "");
        case "date":
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        case "status": {
          // Rework -> Pending -> Received -> Implemented
          const priority = (asset: Asset) => {
            if (asset.status === "pending" && asset.revision_count > 0) return 0; // Rework
            if (asset.status === "pending") return 1;
            if (asset.status === "received") return 2;
            return 3; // implemented
          };
          return priority(a) - priority(b);
        }
        case "cycles":
          return b.revision_count - a.revision_count;
        default:
          return 0;
      }
    });

    return sorted;
  }, [assets, searchTerm, showOnlyMyTasks, showHighChurn, sortBy, userEmail]);

  // Group assets by folder
  const groupedAssets = useMemo(() => {
    const groups: Record<string, Asset[]> = {};
    
    processedAssets.forEach((asset) => {
      const folderKey = asset.folder || "_root_";
      if (!groups[folderKey]) {
        groups[folderKey] = [];
      }
      groups[folderKey].push(asset);
    });

    return groups;
  }, [processedAssets]);

  // Render a single asset row
  const renderAssetRow = (asset: Asset) => (
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
      <TableCell>
        {editingNotes === asset.id ? (
          <Input
            value={notesValue}
            onChange={(e) => setNotesValue(e.target.value)}
            onBlur={() => handleNotesSave(asset.id)}
            onKeyDown={(e) => e.key === "Enter" && handleNotesSave(asset.id)}
            autoFocus
            className="h-7 text-xs bg-input border-border w-40"
          />
        ) : (
          <button
            onClick={() => handleNotesEdit(asset)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors truncate max-w-[150px] text-left"
            title={asset.notes || "Add notes..."}
          >
            {asset.notes || "—"}
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
  );

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

      {/* Toolbar - Filters & Sorting */}
      <div className="p-4 border-b border-border bg-secondary/30">
        <div className="flex flex-wrap items-center gap-4">
          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                id="my-tasks"
                checked={showOnlyMyTasks}
                onCheckedChange={setShowOnlyMyTasks}
              />
              <Label htmlFor="my-tasks" className="text-xs font-display cursor-pointer">
                SHOW ONLY MY TASKS
              </Label>
            </div>
            
            <div className="flex items-center gap-2">
              <Switch
                id="high-churn"
                checked={showHighChurn}
                onCheckedChange={setShowHighChurn}
              />
              <Label htmlFor="high-churn" className="text-xs font-display cursor-pointer">
                HIGH CHURN (&gt;2 CYCLES)
              </Label>
            </div>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 ml-auto">
            <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-border text-xs font-display"
                >
                  SORT: {sortBy.toUpperCase()}
                  <ChevronDown className="w-3 h-3 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-card border-border">
                <DropdownMenuItem onClick={() => setSortBy("folder")}>
                  Folder Name (A-Z)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("date")}>
                  Date Modified (Latest First)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("status")}>
                  Status Priority
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("cycles")}>
                  Cycles (High to Low)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Folder-Grouped Assets */}
      <div className="overflow-x-auto">
        {Object.keys(groupedAssets).length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            No assets match your filters
          </div>
        ) : (
          <Accordion type="multiple" defaultValue={Object.keys(groupedAssets)} className="w-full">
            {Object.entries(groupedAssets).map(([folderKey, folderAssets]) => (
              <AccordionItem key={folderKey} value={folderKey} className="border-border">
                <AccordionTrigger className="px-4 py-3 hover:bg-secondary/20 transition-colors">
                  <div className="flex items-center gap-2 text-left">
                    <ChevronRight className="w-4 h-4 text-primary" />
                    <span className="font-mono text-sm text-foreground">
                      {folderKey === "_root_" ? "Root Files" : folderKey}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      ({folderAssets.length} {folderAssets.length === 1 ? "item" : "items"})
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
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
                          NOTES
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
                      {folderAssets.map((asset) => renderAssetRow(asset))}
                    </TableBody>
                  </Table>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>
    </div>
  );
};
