
import React from 'react';
import { Role, ChatMessage as ChatMessageProps } from '../types';
import { BotIcon } from './icons/BotIcon';
import { UserIcon } from './icons/UserIcon';

const ChatMessage: React.FC<ChatMessageProps> = ({ role, content }) => {
  const isUser = role === Role.USER;

  return (
    <div className={`flex items-start gap-4 my-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center">
          <BotIcon className="w-6 h-6 text-white" />
        </div>
      )}
      <div
        className={`max-w-md lg:max-w-2xl px-5 py-3 rounded-2xl shadow-md ${
          isUser
            ? 'bg-blue-600 text-white rounded-br-none'
            : 'bg-gray-700 text-gray-200 rounded-bl-none'
        }`}
      >
        <p className="whitespace-pre-wrap">{content}</p>
      </div>
       {isUser && (
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center">
          <UserIcon className="w-6 h-6 text-white" />
        </div>
      )}
    </div>
  );
};

export default ChatMessage;
