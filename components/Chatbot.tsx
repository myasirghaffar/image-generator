import React, { useState, useEffect, useRef, FormEvent } from 'react';
import type { Chat } from '@google/genai';
import type { ChatMessage } from '../types';
import { createChat, isApiKeyConfigured } from '../services/geminiService';
import { getUserFriendlyErrorMessage } from '../services/errorHandler';
import { SendIcon, UserIcon, BotIcon } from './IconComponents';

export const Chatbot: React.FC = () => {
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isApiReady, setIsApiReady] = useState<boolean>(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isApiKeyConfigured()) {
      setIsApiReady(false);
      setMessages([
        { role: 'model', text: "Configuration needed. Please set the API_KEY environment variable to use the chatbot." }
      ]);
      return;
    }

    try {
      setChat(createChat());
      setMessages([
        { role: 'model', text: "Hello! I'm Gemini. How can I help you today?" }
      ]);
    } catch (error) {
      setIsApiReady(false);
      const friendlyErrorMessage = getUserFriendlyErrorMessage(error);
      setMessages([
        { role: 'model', text: `❌ ${friendlyErrorMessage}` }
      ]);
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentMessage.trim() || isLoading || !chat || !isApiReady) return;

    const userMessageText = currentMessage;
    const userMessage: ChatMessage = { role: 'user', text: userMessageText };
    setMessages((prev) => [...prev, userMessage]);
    setCurrentMessage('');
    setIsLoading(true);

    try {
      const response = await chat.sendMessage({ message: userMessageText });
      const modelMessage: ChatMessage = { role: 'model', text: response.text };
      setMessages((prev) => [...prev, modelMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const friendlyErrorMessage = getUserFriendlyErrorMessage(error);
      const errorMessage: ChatMessage = { 
        role: 'model', 
        text: `❌ ${friendlyErrorMessage}` 
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const MessageBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
    const isUser = message.role === 'user';
    return (
      <div className={`flex items-start gap-3 my-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
        {!isUser && (
          <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg">
            <BotIcon className="w-6 h-6 text-white" />
          </div>
        )}
        <div
          className={`max-w-xl p-4 rounded-2xl shadow-md ${
            isUser
              ? 'bg-gradient-to-br from-fuchsia-600 to-purple-600 text-white rounded-br-lg'
              : 'bg-gray-700 text-white rounded-bl-lg'
          }`}
        >
          <p className="text-white whitespace-pre-wrap break-words">{message.text}</p>
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
        {messages.map((msg, index) => (
          <MessageBubble key={index} message={msg} />
        ))}
        {isLoading && (
            <div className="flex items-start gap-3 my-4 justify-start">
                 <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
                    <BotIcon className="w-6 h-6 text-white" />
                 </div>
                <div className="bg-gray-700 rounded-2xl rounded-bl-lg p-4 flex items-center space-x-2">
                   <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse delay-0"></span>
                   <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse delay-200"></span>
                   <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse delay-400"></span>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-6 border-t border-white/10">
        <form onSubmit={handleSendMessage} className="flex items-center gap-4">
          <input
            type="text"
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            placeholder={!isApiReady ? "API Key not configured" : "Type your message..."}
            className="flex-grow bg-gray-900/50 border border-white/20 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition disabled:opacity-50"
            disabled={isLoading || !isApiReady}
          />
          <button
            type="submit"
            disabled={isLoading || !currentMessage.trim() || !isApiReady}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold p-3 rounded-lg transition-all duration-300 transform hover:scale-110 disabled:bg-gray-500 disabled:cursor-not-allowed disabled:transform-none"
          >
            <SendIcon className="w-6 h-6" />
          </button>
        </form>
      </div>
    </div>
  );
};