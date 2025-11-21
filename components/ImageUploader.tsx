import React, { useState, useCallback, useRef } from 'react';
import { convertFileToBase64 } from '../utils/fileUtils';
import { UploadIcon } from './icons/UploadIcon';

interface ImageUploaderProps {
  title: string;
  onImageUpload: (base64: string) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ title, onImageUpload }) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(async (file: File | null) => {
    if (file && file.type.startsWith('image/')) {
      const base64 = await convertFileToBase64(file);
      const mimeType = base64.split(';')[0].split(':')[1];
      const data = base64.split(',')[1];
      onImageUpload(JSON.stringify({mimeType, data}));
      setImagePreview(base64);
    }
  }, [onImageUpload]);

  const onFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    handleFileChange(file || null);
  };

  const onDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    handleFileChange(file || null);
  };

  const onAreaClick = (e: React.MouseEvent<HTMLLabelElement, MouseEvent>) => {
    // Prevent the label's default behavior if a file is already selected,
    // to avoid confusion. Let the user use a separate "clear" button if needed.
    if ((e.target as HTMLElement).tagName === 'IMG') {
        e.preventDefault();
    }
    fileInputRef.current?.click();
  };


  return (
    <div>
      <h3 className="text-lg font-semibold mb-2 text-gray-300">{title}</h3>
      <label
        htmlFor={`file-upload-${title.replace(/\s+/g, '-')}`}
        onClick={onAreaClick}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`
          relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer
          transition-colors duration-300 ease-in-out
          ${isDragging ? 'border-indigo-400 bg-gray-700' : 'border-gray-600 bg-gray-800 hover:bg-gray-700/50'}
        `}
      >
        {imagePreview ? (
          <img src={imagePreview} alt="Preview" className="object-contain h-full w-full rounded-lg p-2" />
        ) : (
          <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
            <UploadIcon className="w-10 h-10 mb-3 text-gray-500" />
            <p className="mb-2 text-sm text-gray-400">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500">PNG, JPG, or WEBP</p>
          </div>
        )}
        <input
          id={`file-upload-${title.replace(/\s+/g, '-')}`}
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/png, image/jpeg, image/webp"
          onChange={onFileSelected}
        />
      </label>
    </div>
  );
};
