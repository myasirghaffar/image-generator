import React, { useState } from 'react';
import { ImageStudio } from './components/ImageStudio';
import { Chatbot } from './components/Chatbot';
import { BotIcon, ImageIcon } from './components/IconComponents';

type Tab = 'studio' | 'chat';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('studio');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'studio':
        return <ImageStudio />;
      case 'chat':
        return <Chatbot />;
      default:
        return null;
    }
  };

  // FIX: Changed icon type from JSX.Element to React.ReactElement to resolve namespace error.
  const TabButton = ({ tabName, label, icon }: { tabName: Tab; label: string; icon: React.ReactElement }) => (
    <button
      onClick={() => setActiveTab(tabName)}
      className={`flex items-center justify-center gap-2 w-full px-4 py-3 text-sm font-medium rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-purple-500 ${
        activeTab === tabName ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-lg shadow-purple-500/30' : 'bg-white/10 text-gray-300 hover:bg-white/20'
      }`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="min-h-screen text-white flex flex-col font-sans">
      <header className="bg-black/30 backdrop-blur-sm shadow-lg sticky top-0 z-10 border-b border-white/10">
        <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center">
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500 mb-4 sm:mb-0">
            Gemini Creative Suite
          </h1>
          <nav className="w-full sm:w-auto grid grid-cols-2 gap-2">
            <TabButton tabName="studio" label="Image Studio" icon={<ImageIcon className="w-5 h-5" />} />
            <TabButton tabName="chat" label="Chatbot" icon={<BotIcon className="w-5 h-5" />} />
          </nav>
        </div>
      </header>
      <main className="flex-grow container mx-auto p-4">
        {renderTabContent()}
      </main>
       <footer className="bg-transparent text-center p-4 text-sm text-gray-400">
            <p>Powered by Google Gemini</p>
        </footer>
    </div>
  );
};

export default App;