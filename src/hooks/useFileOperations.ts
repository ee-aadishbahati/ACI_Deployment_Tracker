import { useCallback } from 'react';

export interface FileDownloadOptions {
  filename?: string;
  mimeType?: string;
}

export interface FileUploadOptions {
  accept?: string;
  multiple?: boolean;
}

export function useFileOperations() {
  const downloadFile = useCallback((
    data: any, 
    defaultFilename: string, 
    options: FileDownloadOptions = {}
  ) => {
    const { 
      filename = defaultFilename, 
      mimeType = 'application/json' 
    } = options;
    
    const dataStr = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: mimeType });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }, []);

  const uploadFile = useCallback((
    onFileSelect: (file: File) => void,
    options: FileUploadOptions = {}
  ) => {
    const { accept = '.json', multiple = false } = options;
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.multiple = multiple;
    input.style.display = 'none';
    
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        if (multiple) {
          Array.from(files).forEach(onFileSelect);
        } else {
          onFileSelect(files[0]);
        }
      }
    };
    
    document.body.appendChild(input);
    input.click();
    document.body.removeChild(input);
  }, []);

  const readFileAsText = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === 'string') {
          resolve(result);
        } else {
          reject(new Error('Failed to read file as text'));
        }
      };
      reader.onerror = () => reject(new Error('Error reading file'));
      reader.readAsText(file);
    });
  }, []);

  return {
    downloadFile,
    uploadFile,
    readFileAsText
  };
}
