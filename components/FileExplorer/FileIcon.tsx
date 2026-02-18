import React from "react";
import {
  Folder,
  File,
  FileText,
  FileImage,
  FileCode,
  FileVideo,
  FileAudio,
} from "lucide-react";
import { FileItem } from "./types";

interface FileIconProps {
  item: FileItem;
}

export const FileIcon: React.FC<FileIconProps> = ({ item }) => {
  if (item.isDirectory) return <Folder size={20} className="text-cyan-400" />;

  switch (item.type) {
    case "image":
      return <FileImage size={20} className="text-green-400" />;
    case "video":
      return <FileVideo size={20} className="text-purple-400" />;
    case "audio":
      return <FileAudio size={20} className="text-pink-400" />;
    case "code":
      return <FileCode size={20} className="text-blue-400" />;
    case "text":
      return <FileText size={20} className="text-gray-400" />;
    default:
      return <File size={20} className="text-gray-500" />;
  }
};
