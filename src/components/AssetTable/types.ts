// Shared types for AssetTable components

export interface Asset {
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

export interface TreeNode {
  name: string;           // Folder name or asset name
  type: 'folder' | 'asset';
  path: string;           // Full path
  children: TreeNode[];   // Sub-folders or assets
  asset?: Asset;          // Only populated if type === 'asset'
  depth: number;          // Nesting level (0 = root)
}

export type SortOption = "folder" | "date" | "status" | "cycles";
