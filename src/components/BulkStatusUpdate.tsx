import { useState, useMemo } from "react";
import { Folder, FolderOpen, ChevronRight, ChevronDown, Check, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Asset {
  id: string;
  name: string;
  file_path: string;
  status: "pending" | "received" | "implemented";
}

interface BulkStatusUpdateProps {
  assets: Asset[];
  onBulkUpdate: (assetIds: string[], status: "pending" | "received" | "implemented") => void;
}

interface FolderNode {
  name: string;
  path: string;
  assets: Asset[];
  children: Map<string, FolderNode>;
}

export const BulkStatusUpdate = ({ assets, onBulkUpdate }: BulkStatusUpdateProps) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);

  // Build folder tree structure
  const folderTree = useMemo(() => {
    const root: FolderNode = { name: "root", path: "", assets: [], children: new Map() };

    assets.forEach((asset) => {
      const parts = asset.file_path.split("/").filter(Boolean);
      let current = root;

      // Navigate/create folder structure
      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        const pathSoFar = parts.slice(0, i + 1).join("/");
        
        if (!current.children.has(part)) {
          current.children.set(part, {
            name: part,
            path: pathSoFar,
            assets: [],
            children: new Map(),
          });
        }
        current = current.children.get(part)!;
      }

      // Add asset to the deepest folder
      current.assets.push(asset);
    });

    return root;
  }, [assets]);

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  const getAssetsInFolder = (node: FolderNode): Asset[] => {
    let all = [...node.assets];
    node.children.forEach((child) => {
      all = [...all, ...getAssetsInFolder(child)];
    });
    return all;
  };

  const toggleAsset = (assetId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(assetId)) {
      newSelected.delete(assetId);
    } else {
      newSelected.add(assetId);
    }
    setSelectedIds(newSelected);
  };

  const toggleFolderAssets = (node: FolderNode) => {
    const folderAssets = getAssetsInFolder(node);
    const allSelected = folderAssets.every((a) => selectedIds.has(a.id));
    
    const newSelected = new Set(selectedIds);
    folderAssets.forEach((asset) => {
      if (allSelected) {
        newSelected.delete(asset.id);
      } else {
        newSelected.add(asset.id);
      }
    });
    setSelectedIds(newSelected);
  };

  const getFolderSelectionState = (node: FolderNode): "none" | "partial" | "all" => {
    const folderAssets = getAssetsInFolder(node);
    if (folderAssets.length === 0) return "none";
    
    const selectedCount = folderAssets.filter((a) => selectedIds.has(a.id)).length;
    if (selectedCount === 0) return "none";
    if (selectedCount === folderAssets.length) return "all";
    return "partial";
  };

  const handleBulkUpdate = (status: "pending" | "received" | "implemented") => {
    onBulkUpdate(Array.from(selectedIds), status);
    setSelectedIds(new Set());
    setDialogOpen(false);
  };

  const renderFolderNode = (node: FolderNode, depth: number = 0): React.ReactNode => {
    const isExpanded = expandedFolders.has(node.path);
    const selectionState = getFolderSelectionState(node);
    const hasContent = node.assets.length > 0 || node.children.size > 0;

    if (!hasContent && depth > 0) return null;

    return (
      <div key={node.path || "root"}>
        {depth > 0 && (
          <div
            className="flex items-center gap-2 py-1.5 px-2 hover:bg-secondary/30 rounded-sm cursor-pointer transition-colors"
            style={{ paddingLeft: `${depth * 16}px` }}
          >
            <button
              onClick={() => toggleFolder(node.path)}
              className="p-0.5 hover:bg-secondary rounded-sm"
            >
              {isExpanded ? (
                <ChevronDown className="w-3 h-3 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-3 h-3 text-muted-foreground" />
              )}
            </button>
            
            <button
              onClick={() => toggleFolderAssets(node)}
              className={`w-4 h-4 border rounded-sm flex items-center justify-center transition-colors ${
                selectionState === "all"
                  ? "bg-primary border-primary"
                  : selectionState === "partial"
                  ? "bg-primary/50 border-primary"
                  : "border-muted-foreground/50"
              }`}
            >
              {selectionState === "all" && <Check className="w-3 h-3 text-primary-foreground" />}
              {selectionState === "partial" && <Minus className="w-3 h-3 text-primary-foreground" />}
            </button>
            
            {isExpanded ? (
              <FolderOpen className="w-4 h-4 text-warning" />
            ) : (
              <Folder className="w-4 h-4 text-warning" />
            )}
            
            <span className="font-mono text-sm text-foreground">{node.name}</span>
            <span className="text-xs text-muted-foreground">
              ({getAssetsInFolder(node).length})
            </span>
          </div>
        )}

        {(isExpanded || depth === 0) && (
          <>
            {/* Child folders */}
            {Array.from(node.children.values()).map((child) =>
              renderFolderNode(child, depth + 1)
            )}

            {/* Assets in this folder */}
            {node.assets.map((asset) => (
              <div
                key={asset.id}
                className="flex items-center gap-2 py-1 px-2 hover:bg-secondary/30 rounded-sm cursor-pointer transition-colors"
                style={{ paddingLeft: `${(depth + 1) * 16 + 20}px` }}
                onClick={() => toggleAsset(asset.id)}
              >
                <button
                  className={`w-4 h-4 border rounded-sm flex items-center justify-center transition-colors ${
                    selectedIds.has(asset.id)
                      ? "bg-primary border-primary"
                      : "border-muted-foreground/50"
                  }`}
                >
                  {selectedIds.has(asset.id) && (
                    <Check className="w-3 h-3 text-primary-foreground" />
                  )}
                </button>
                
                <span className="font-mono text-xs text-muted-foreground truncate">
                  {asset.name}
                </span>
                
                <span
                  className={`text-xs font-display tracking-wider ml-auto ${
                    asset.status === "pending"
                      ? "text-destructive"
                      : asset.status === "received"
                      ? "text-warning"
                      : "text-success"
                  }`}
                >
                  {asset.status.toUpperCase()}
                </span>
              </div>
            ))}
          </>
        )}
      </div>
    );
  };

  if (assets.length === 0) return null;

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground"
        >
          <Folder className="w-4 h-4 mr-2" />
          BULK UPDATE
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="font-display tracking-wider text-foreground flex items-center gap-2">
            <Folder className="w-5 h-5 text-primary" />
            BULK STATUS UPDATE
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Selection info */}
          <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-sm">
            <span className="text-sm text-muted-foreground">
              <span className="text-primary font-display">{selectedIds.size}</span> assets selected
            </span>
            
            {selectedIds.size > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" className="bg-primary text-primary-foreground">
                    SET STATUS
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-card border-border">
                  <DropdownMenuItem
                    onClick={() => handleBulkUpdate("pending")}
                    className="text-destructive focus:text-destructive"
                  >
                    PENDING
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleBulkUpdate("received")}
                    className="text-warning focus:text-warning"
                  >
                    RECEIVED
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleBulkUpdate("implemented")}
                    className="text-success focus:text-success"
                  >
                    IMPLEMENTED
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Folder tree */}
          <ScrollArea className="h-[400px] border border-border rounded-sm p-2">
            {renderFolderNode(folderTree)}
          </ScrollArea>

          {/* Quick select buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedIds(new Set(assets.map((a) => a.id)))}
              className="text-xs"
            >
              SELECT ALL
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedIds(new Set())}
              className="text-xs"
            >
              CLEAR
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setSelectedIds(new Set(assets.filter((a) => a.status === "pending").map((a) => a.id)))
              }
              className="text-xs text-destructive border-destructive/50"
            >
              SELECT PENDING
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setSelectedIds(new Set(assets.filter((a) => a.status === "received").map((a) => a.id)))
              }
              className="text-xs text-warning border-warning/50"
            >
              SELECT RECEIVED
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
