import { Asset, TreeNode } from "./types";

/**
 * Builds a hierarchical tree structure from a flat array of assets.
 * Handles nested folder paths by splitting on '/' and creating intermediate nodes.
 * 
 * @param assets - Flat array of assets with folder paths
 * @returns Root TreeNode containing the entire folder hierarchy
 */
export function buildFolderTree(assets: Asset[]): TreeNode {
  // Create root node
  const root: TreeNode = {
    name: 'root',
    type: 'folder',
    path: '',
    children: [],
    depth: -1, // Root is at depth -1, first level is 0
  };

  // Sort assets by folder path for consistent ordering
  const sortedAssets = [...assets].sort((a, b) => {
    const folderA = a.folder || '';
    const folderB = b.folder || '';
    return folderA.localeCompare(folderB);
  });

  // Process each asset
  sortedAssets.forEach((asset) => {
    if (!asset.folder) {
      // Root-level file (no folder)
      root.children.push({
        name: asset.name,
        type: 'asset',
        path: asset.file_path,
        children: [],
        asset: asset,
        depth: 0,
      });
    } else {
      // Asset is in a folder - traverse/create the tree
      const folderParts = asset.folder.split('/').filter(part => part.length > 0);
      let currentNode = root;
      let currentPath = '';

      // Create or traverse folders
      folderParts.forEach((folderName, index) => {
        currentPath = currentPath ? `${currentPath}/${folderName}` : folderName;
        const depth = index;

        // Check if this folder already exists in children
        let folderNode = currentNode.children.find(
          (child) => child.type === 'folder' && child.name === folderName
        );

        if (!folderNode) {
          // Create new folder node
          folderNode = {
            name: folderName,
            type: 'folder',
            path: currentPath,
            children: [],
            depth: depth,
          };
          currentNode.children.push(folderNode);
        }

        currentNode = folderNode;
      });

      // Add the asset to the deepest folder
      currentNode.children.push({
        name: asset.name,
        type: 'asset',
        path: asset.file_path,
        children: [],
        asset: asset,
        depth: folderParts.length,
      });
    }
  });

  return root;
}

/**
 * Counts total number of assets in a tree node (recursively)
 */
export function countAssets(node: TreeNode): number {
  if (node.type === 'asset') {
    return 1;
  }
  
  return node.children.reduce((sum, child) => sum + countAssets(child), 0);
}

/**
 * Checks if a node has any child assets (recursively)
 */
export function hasAssets(node: TreeNode): boolean {
  if (node.type === 'asset') {
    return true;
  }
  
  return node.children.some(child => hasAssets(child));
}
