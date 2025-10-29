import React, { useState, useRef, FormEvent, useEffect } from 'react';
import { ImageStudioMessage } from '../types';
import { generateImage, editImage, isApiKeyConfigured } from '../services/geminiService';
import { 
  UploadIcon, 
  MagicWandIcon, 
  UserIcon, 
  BotIcon, 
  PaperclipIcon, 
  DownloadIcon, 
  SparklesIcon 
} from './IconComponents';
import { LoadingSpinner } from './LoadingSpinner';

export const ImageStudio: React.FC = () => {
  const [messages, setMessages] = useState<ImageStudioMessage[]>([]);
  const [prompt, setPrompt] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isApiReady, setIsApiReady] = useState<boolean>(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isApiKeyConfigured()) {
      setIsApiReady(false);
      setMessages([{
        id: 'api-error',
        role: 'model',
        text: "Configuration needed. Please set the API_KEY environment variable to use the Image Studio."
      }]);
      return;
    }

    if (messages.length === 0) {
      setMessages([
        {
          id: 'initial',
          role: 'model',
          text: "Welcome to the Image Studio! Describe the image you want to create, or upload an image to edit.",
        }
      ]);
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setImageFile(event.target.files[0]);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading || !isApiReady) return;

    const userMessage: ImageStudioMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: prompt,
      originalImageUrl: imageFile ? URL.createObjectURL(imageFile) : undefined,
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);
    const currentPrompt = prompt;
    const currentImageFile = imageFile;
    setPrompt('');
    setImageFile(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }

    try {
      let imageUrl: string;
      if (currentImageFile) {
        imageUrl = await editImage(currentPrompt, currentImageFile);
      } else {
        imageUrl = await generateImage(currentPrompt);
      }

      const modelMessage: ImageStudioMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        imageUrl: imageUrl,
        text: `Here's an image based on your prompt: "${currentPrompt}"`,
        originalImageUrl: currentImageFile ? URL.createObjectURL(currentImageFile) : undefined,
      };
      setMessages(prev => [...prev, modelMessage]);

    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to generate image: ${errorMessage}`);
      const errorModelMessage: ImageStudioMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: `Sorry, I couldn't generate the image. Error: ${errorMessage}`,
      };
      setMessages(prev => [...prev, errorModelMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadImage = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const MessageBubble: React.FC<{ message: ImageStudioMessage }> = ({ message }) => {
    const isUser = message.role === 'user';
    
    return (
      <div className={`flex items-start gap-3 my-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
        {!isUser && (
          <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg">
            <BotIcon className="w-6 h-6 text-white" />
          </div>
        )}
        <div className={`max-w-xl p-4 rounded-2xl shadow-md ${ isUser ? 'bg-gradient-to-br from-fuchsia-600 to-purple-600 text-white rounded-br-lg' : 'bg-gray-700 text-white rounded-bl-lg' }`}>
            {message.text && <p className="mb-2 text-white whitespace-pre-wrap break-words">{message.text}</p>}
            {message.originalImageUrl && !message.imageUrl && (
              <div className="mt-2">
                <p className="text-sm text-gray-300 mb-1">Editing this image:</p>
                <img src={message.originalImageUrl} alt="user uploaded content" className="rounded-lg w-full max-w-xs h-auto max-h-[50vh]" />
              </div>
            )}
            {message.imageUrl && (
              <div className="relative group">
                <img src={message.imageUrl} alt={message.text || 'generated image'} className="rounded-lg w-full max-w-sm h-auto max-h-[70vh]" />
                 <button onClick={() => downloadImage(message.imageUrl!, `${message.text?.replace(/\s/g, '_') || 'generated_image'}.png`)} className="absolute bottom-2 right-2 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <DownloadIcon className="w-5 h-5" />
                 </button>
              </div>
            )}
        </div>
        {isUser && (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-fuchsia-600 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg">
            <UserIcon className="w-6 h-6 text-white" />
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="flex flex-col flex-grow bg-black/20 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
      <div className="flex-grow p-6 overflow-y-auto overflow-x-hidden hide-scrollbar">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {isLoading && (
            <div className="flex items-start gap-3 my-4 justify-start">
                 <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
                    <BotIcon className="w-6 h-6 text-white" />
                 </div>
                <div className="bg-gray-700 rounded-2xl rounded-bl-lg p-4 flex items-center space-x-2">
                   <p className="mr-2 text-sm text-gray-300">Generating...</p>
                   <LoadingSpinner />
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-6 border-t border-white/10">
        {error && <p className="text-red-400 text-sm mb-2 text-center">{error}</p>}
        {imageFile && (
          <div className="mb-2 flex items-center gap-2 bg-gray-900/50 p-2 rounded-lg">
            <img src={URL.createObjectURL(imageFile)} alt="preview" className="w-12 h-12 rounded object-cover" />
            <button onClick={handleRemoveImage} className="ml-auto text-gray-400 hover:text-white p-1 text-2xl leading-none">&times;</button>
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex items-center gap-4">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            ref={fileInputRef}
            className="hidden"
            disabled={!isApiReady}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-3 bg-gray-900/50 border border-white/20 rounded-lg text-white hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            title={imageFile ? "Change image" : "Upload image to edit"}
            disabled={!isApiReady}
          >
            {imageFile ? <PaperclipIcon className="w-6 h-6 text-purple-400" /> : <UploadIcon className="w-6 h-6" />}
          </button>
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={!isApiReady ? "API Key not configured" : (imageFile ? "Describe how to edit the image..." : "Describe the image to generate...")}
            className="flex-grow min-w-0 bg-gray-900/50 border border-white/20 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition disabled:opacity-50"
            disabled={isLoading || !isApiReady}
          />
          <button
            type="submit"
            disabled={isLoading || !prompt.trim() || !isApiReady}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold p-3 rounded-lg transition-all duration-300 transform hover:scale-110 disabled:bg-gray-500 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
          >
            {imageFile ? <MagicWandIcon className="w-6 h-6" /> : <SparklesIcon className="w-6 h-6" />}
            <span className="hidden sm:inline">{imageFile ? "Edit" : "Generate"}</span>
          </button>
        </form>
      </div>
    </div>
  );
};