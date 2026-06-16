import path from "path";

const ALLOWED_DOCUMENT_EXTENSIONS = new Set([".pdf", ".doc", ".docx"]);

export const validateFileType = (filename: string): boolean => {
  const ext = path.extname(filename).toLowerCase();
  return ALLOWED_DOCUMENT_EXTENSIONS.has(ext);
};

export const getFileType = (filename: string): string => {
  return path.extname(filename).toLowerCase();
};
