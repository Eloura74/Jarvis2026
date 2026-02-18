export interface FileItem {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  sizeFormatted: string;
  extension: string;
  type: string;
  modified: string;
}

export interface FileExplorerProps {
  isOpen: boolean;
  onClose: () => void;
}
