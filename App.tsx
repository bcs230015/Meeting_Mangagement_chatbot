
import React, { useState, useEffect, useRef } from 'react';
import { Chat } from '@google/genai';
import { ChatMessage, Role } from './types';
import { initializeChat, sendMessage } from './services/geminiService';
import ChatInput from './components/ChatInput';
import ChatMessageComponent from './components/ChatMessage';
import { BotIcon } from './components/icons/BotIcon';

const App: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const chatRef = useRef<Chat | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatRef.current = initializeChat();
    setMessages([{ 
        role: Role.MODEL, 
        content: "Hello! I'm your AI assistant for booking meeting rooms. How can I help you today? \nFor example, you can say: 'Book a room for 5 people tomorrow at 10 AM'." 
    }]);
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (message: string) => {
    if (!chatRef.current) return;

    const userMessage: ChatMessage = { role: Role.USER, content: message };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setIsLoading(true);

    try {
      const botResponse = await sendMessage(chatRef.current, message);
      const modelMessage: ChatMessage = { role: Role.MODEL, content: botResponse };
      setMessages((prevMessages) => [...prevMessages, modelMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: ChatMessage = {
        role: Role.MODEL,
        content: "I'm sorry, I encountered an error. Please try again.",
      };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white font-sans">
      <header className="p-4 border-b border-gray-700 shadow-lg bg-gray-800">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
            <BotIcon className="w-8 h-8 text-indigo-400" />
            <h1 className="text-xl font-bold tracking-wider">Meeting Room AI Assistant</h1>
        </div>
      </header>

      <main ref={chatContainerRef} className="flex-grow p-4 md:p-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {messages.map((msg, index) => (
            <ChatMessageComponent key={index} role={msg.role} content={msg.content} />
          ))}
          {isLoading && (
            <div className="flex items-start gap-4 my-6 justify-start">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center">
                <BotIcon className="w-6 h-6 text-white" />
              </div>
              <div className="max-w-md lg:max-w-2xl px-5 py-3 rounded-2xl shadow-md bg-gray-700 text-gray-200 rounded-bl-none">
                <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="p-4 bg-gray-800/50 backdrop-blur-sm border-t border-gray-700">
        <div className="max-w-4xl mx-auto">
          <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
        </div>
      </footer>
    </div>
  );
};

export default App;
