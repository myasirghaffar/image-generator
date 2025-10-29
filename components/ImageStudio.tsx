import React, { useState, useRef, useCallback } from 'react';
import { generateImage, editImage } from '../services/geminiService';
import { UploadIcon, SparklesIcon, MagicWandIcon } from './IconComponents';
import { LoadingSpinner } from './LoadingSpinner';

export const ImageStudio: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [resultImageUrl, setResultImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
        setResultImageUrl(null); // Clear previous result when new image is uploaded
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAction = useCallback(async (action: 'generate' | 'edit') => {
    if (!prompt.trim()) {
      setError('Please enter a prompt.');
      return;
    }
    if (action === 'edit' && !imageFile) {
      setError('Please upload an image to edit.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResultImageUrl(null);

    try {
      let newImageUrl: string;
      if (action === 'generate') {
        newImageUrl = await generateImage(prompt);
      } else {
        newImageUrl = await editImage(prompt, imageFile!);
      }
      setResultImageUrl(newImageUrl);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [prompt, imageFile]);

  return (
    <div className="flex flex-col lg:flex-row gap-8 h-full">
      {/* Left Panel - Controls & Input */}
      <div className="w-full lg:w-1/3 bg-black/20 backdrop-blur-md border border-white/10 p-6 rounded-2xl shadow-2xl flex flex-col">
        <h2 className="text-2xl font-bold mb-4 text-purple-400">Image Controls</h2>
        
        {/* Prompt Input */}
        <div className="mb-6">
          <label htmlFor="prompt" className="block text-sm font-medium text-gray-300 mb-2">
            Your Creative Prompt
          </label>
          <textarea
            id="prompt"
            rows={4}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., A cat wearing a spacesuit on Mars, cinematic lighting"
            className="w-full bg-gray-900/50 border border-white/20 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
          />
        </div>

        {/* File Upload */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Upload Image (for editing)
          </label>
          <div 
            className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-purple-500 hover:bg-purple-500/10 transition-all duration-300"
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadIcon className="mx-auto h-12 w-12 text-gray-500" />
            <p className="mt-2 text-sm text-gray-400">
              {imageFile ? imageFile.name : 'Click to upload or drag and drop'}
            </p>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
        </div>
        
        {/* Action Buttons */}
        <div className="space-y-4 mt-auto">
          <button
            onClick={() => handleAction('generate')}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/50 transform hover:-translate-y-1 disabled:bg-gray-500 disabled:shadow-none disabled:transform-none"
          >
            <SparklesIcon className="w-5 h-5" />
            Generate
          </button>
          <button
            onClick={() => handleAction('edit')}
            disabled={isLoading || !imageFile}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-orange-500 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-pink-500/50 transform hover:-translate-y-1 disabled:bg-gray-500 disabled:shadow-none disabled:transform-none disabled:cursor-not-allowed"
          >
            <MagicWandIcon className="w-5 h-5" />
            Edit
          </button>
        </div>
        {error && <p className="text-red-400 mt-4 text-sm">{error}</p>}
      </div>

      {/* Right Panel - Image Display */}
      <div className="w-full lg:w-2/3 bg-black/20 backdrop-blur-md border border-white/10 p-6 rounded-2xl shadow-2xl flex items-center justify-center relative min-h-[400px] lg:min-h-0">
        {isLoading && (
          <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center z-10 rounded-2xl">
            <LoadingSpinner />
            <p className="mt-4 text-purple-300 text-lg font-semibold">Gemini is creating magic...</p>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full h-full">
          <div className="flex flex-col items-center justify-center bg-black/30 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-2 text-gray-400">Original</h3>
            <div className="w-full h-full flex items-center justify-center aspect-square">
              {imageUrl ? (
                <img src={imageUrl} alt="Uploaded" className="max-w-full max-h-full object-contain rounded-md" />
              ) : (
                <div className="text-gray-500 text-center">Upload an image to see it here</div>
              )}
            </div>
          </div>
          <div className="flex flex-col items-center justify-center bg-black/30 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-2 text-gray-400">Result</h3>
            <div className="w-full h-full flex items-center justify-center aspect-square">
              {resultImageUrl ? (
                <img src={resultImageUrl} alt="Generated" className="max-w-full max-h-full object-contain rounded-md" />
              ) : (
                <div className="text-gray-500 text-center">Your generated or edited image will appear here</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};