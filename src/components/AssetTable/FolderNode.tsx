import React, { useState } from "react";
import { ChevronRight, ChevronDown, Folder, FolderOpen, FileCode } from "lucide-react";
import { TreeNode } from "./types";
import { AssetRow } from "./AssetRow";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { countAssets } from "./buildFolderTree";

interface FolderNodeProps {
  node: TreeNode;
  depth: number;
  onStatusUpdate: (assetId: string, status: "pending" | "received" | "implemented") => void;
  onAssigneeUpdate: (assetId: string, assignedTo: string) => void;
  onDeleteAsset: (assetId: string) => void;
}

export const FolderNode = React.memo(
  ({ node, depth, onStatusUpdate, onAssigneeUpdate, onDeleteAsset }: FolderNodeProps) => {
    const [isExpanded, setIsExpanded] = useState(true);

    // If this is an asset node, render the AssetRow
    if (node.type === 'asset' && node.asset) {
      return (
        <AssetRow
          asset={node.asset}
          onStatusUpdate={onStatusUpdate}
          onAssigneeUpdate={onAssigneeUpdate}
          onDeleteAsset={onDeleteAsset}
        />
      );
    }

    // This is a folder node
    const assetCount = countAssets(node);
    const hasChildren = node.children.length > 0;

    if (!hasChildren) {
      return null; // Don't render empty folders
    }

    const indentStyle = {
      paddingLeft: `${depth * 16}px`,
    };

    return (
      <div className="folder-node">
        {/* Folder Header */}
        <div
          className="folder-header flex items-center gap-2 px-4 py-3 hover:bg-secondary/20 transition-colors cursor-pointer border-b border-border"
          style={indentStyle}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {/* Expand/Collapse Icon */}
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          )}

          {/* Folder Icon */}
          {isExpanded ? (
            <FolderOpen className="w-4 h-4 text-primary flex-shrink-0" />
          ) : (
            <Folder className="w-4 h-4 text-primary flex-shrink-0" />
          )}

          {/* Folder Name */}
          <span className="font-mono text-sm text-foreground font-medium">
            {node.name}
          </span>

          {/* Asset Count */}
          <span className="text-muted-foreground text-xs">
            ({assetCount} {assetCount === 1 ? "item" : "items"})
          </span>
        </div>

        {/* Folder Contents (when expanded) */}
        {isExpanded && hasChildren && (
          <div className="folder-contents">
            {/* Separate folders and assets */}
            {(() => {
              const folders = node.children.filter(child => child.type === 'folder');
              const assets = node.children.filter(child => child.type === 'asset');

              return (
                <>
                  {/* Render sub-folders first (recursively) */}
                  {folders.map((childNode) => (
                    <FolderNode
                      key={childNode.path}
                      node={childNode}
                      depth={depth + 1}
                      onStatusUpdate={onStatusUpdate}
                      onAssigneeUpdate={onAssigneeUpdate}
                      onDeleteAsset={onDeleteAsset}
                    />
                  ))}

                  {/* Render assets in this folder */}
                  {assets.length > 0 && (
                    <div className="assets-in-folder">
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
                              TIMESTAMPS
                            </TableHead>
                            <TableHead className="text-muted-foreground font-display text-xs tracking-wider w-12">
                              ACTIONS
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {assets.map((assetNode) => (
                            <FolderNode
                              key={assetNode.path}
                              node={assetNode}
                              depth={depth + 1}
                              onStatusUpdate={onStatusUpdate}
                              onAssigneeUpdate={onAssigneeUpdate}
                              onDeleteAsset={onDeleteAsset}
                            />
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}
      </div>
    );
  },
  // Custom comparison function for memo optimization
  (prevProps, nextProps) => {
    // Only re-render if node reference changed or depth changed
    // Since we rebuild the tree when assets change, referential equality works here
    return (
      prevProps.node === nextProps.node &&
      prevProps.depth === nextProps.depth
    );
  }
);

FolderNode.displayName = "FolderNode";
