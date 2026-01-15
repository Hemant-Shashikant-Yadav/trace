import { useState, useMemo, useCallback, useEffect } from "react";
import { FileCode, ArrowUpDown, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Asset, SortOption } from "./AssetTable/types";
import { buildFolderTree } from "./AssetTable/buildFolderTree";
import { FolderNode } from "./AssetTable/FolderNode";

interface AssetTableProps {
  assets: Asset[];
  projectId: string;
  projectOwnerId: string;
  currentUserId: string;
  onStatusUpdate: (assetId: string, status: "pending" | "received" | "implemented") => void;
  onAssigneeUpdate: (assetId: string, assignedTo: string) => void;
  onDeleteAsset: (assetId: string) => void;
}

export const AssetTable = ({
  assets,
  projectId,
  projectOwnerId,
  currentUserId,
  onStatusUpdate,
  onAssigneeUpdate,
  onDeleteAsset,
}: AssetTableProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showOnlyMyTasks, setShowOnlyMyTasks] = useState(false);
  const [showHighChurn, setShowHighChurn] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("folder");
  const [userEmail, setUserEmail] = useState<string>("");

  // Get current user email for "My Tasks" filter
  useEffect(() => {
    import("@/integrations/supabase/client").then(({ supabase }) => {
      supabase.auth.getUser().then(({ data }) => {
        if (data.user?.email) {
          setUserEmail(data.user.email);
        }
      });
    });
  }, []);

  // Stable callbacks for memoization
  const handleStatusUpdate = useCallback((assetId: string, status: "pending" | "received" | "implemented") => {
    onStatusUpdate(assetId, status);
  }, [onStatusUpdate]);

  const handleAssigneeUpdate = useCallback((assetId: string, assignedTo: string) => {
    onAssigneeUpdate(assetId, assignedTo);
  }, [onAssigneeUpdate]);

  const handleDeleteAsset = useCallback((assetId: string) => {
    onDeleteAsset(assetId);
  }, [onDeleteAsset]);

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

  // Build folder tree from processed assets
  const folderTree = useMemo(() => {
    return buildFolderTree(processedAssets);
  }, [processedAssets]);

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

      {/* Recursive Folder Tree */}
      <div className="folder-tree-container overflow-x-auto">
        {folderTree.children.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            No assets match your filters
          </div>
        ) : (
          <div className="w-full">
            {folderTree.children.map((node) => (
              <FolderNode
                key={node.path}
                node={node}
                depth={0}
                projectId={projectId}
                projectOwnerId={projectOwnerId}
                currentUserId={currentUserId}
                onStatusUpdate={handleStatusUpdate}
                onAssigneeUpdate={handleAssigneeUpdate}
                onDeleteAsset={handleDeleteAsset}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
