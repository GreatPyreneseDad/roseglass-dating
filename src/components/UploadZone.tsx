'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

interface UploadZoneProps {
  onImagesSelected: (files: File[]) => void;
  maxImages?: number;
  label?: string;
}

export function UploadZone({
  onImagesSelected,
  maxImages = 10,
  label = "Profile Screenshots"
}: UploadZoneProps) {
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newImages = [...images, ...acceptedFiles].slice(0, maxImages);
    setImages(newImages);

    const newPreviews = newImages.map(file => URL.createObjectURL(file));
    setPreviews(prev => {
      prev.forEach(url => URL.revokeObjectURL(url));
      return newPreviews;
    });

    onImagesSelected(newImages);
  }, [images, maxImages, onImagesSelected]);

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    URL.revokeObjectURL(previews[index]);
    setPreviews(prev => prev.filter((_, i) => i !== index));
    onImagesSelected(newImages);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    maxFiles: maxImages - images.length,
    disabled: images.length >= maxImages
  });

  return (
    <div className="space-y-4">
      <label className="text-sm font-medium text-gray-700">{label}</label>

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? "border-rose-500 bg-rose-50" : "border-gray-300 hover:border-rose-400"}
          ${images.length >= maxImages && "opacity-50 cursor-not-allowed"}`}
      >
        <input {...getInputProps()} />
        <div className="mx-auto h-12 w-12 text-4xl">📸</div>
        <p className="mt-2 text-sm text-gray-600">
          {isDragActive
            ? "Drop images here..."
            : `Drag & drop screenshots, or click to select (${images.length}/${maxImages})`}
        </p>
      </div>

      {previews.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {previews.map((preview, index) => (
            <div key={index} className="relative group">
              <img
                src={preview}
                alt={`Screenshot ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg border"
              />
              <button
                onClick={() => removeImage(index)}
                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full
                  opacity-0 group-hover:opacity-100 transition-opacity text-xs"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
