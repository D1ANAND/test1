'use client';
import { useState, FormEvent, useEffect } from 'react';
import { Send, Bot, Crown, Gift } from 'lucide-react';

interface Message {
  type: 'user' | 'bot';
  content: string;
}

interface ApiResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

interface UserStats {
  isPremium: boolean;
  dailyMessageCount: number;
  lastRewardDate: string;
  totalTokensEarned: number;
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userStats, setUserStats] = useState<UserStats>({
    isPremium: false,
    dailyMessageCount: 0,
    lastRewardDate: new Date().toISOString().split('T')[0],
    totalTokensEarned: 0
  });
  const [showRewardNotification, setShowRewardNotification] = useState(false);

  const DAILY_MESSAGE_LIMIT = 100;
  const TOKENS_PER_COMPLETION = 0.1;

  useEffect(() => {
    const initializeStorage = async () => {
      if (typeof window !== 'undefined' && 'chrome' in window) {
        try {
          chrome.storage.local.get(['userStats'], (result) => {
            if (result.userStats) {
              const savedStats = result.userStats;
              const today = new Date().toISOString().split('T')[0];
              
              if (savedStats.lastRewardDate !== today) {
                setUserStats({
                  ...savedStats,
                  dailyMessageCount: 0,
                  lastRewardDate: today
                });
              } else {
                setUserStats(savedStats);
              }
            }
          });
        } catch (error) {
          console.error('Storage initialization failed:', error);
        }
      }
    };

    initializeStorage();
  }, []);

  useEffect(() => {
    const saveStats = async () => {
      if (typeof window !== 'undefined' && 'chrome' in window) {
        try {
          chrome.storage.local.set({ userStats });
        } catch (error) {
          console.error('Failed to save stats:', error);
        }
      }
    };

    saveStats();
  }, [userStats]);

  const handlePremiumPurchase = async () => {
    try {
      // Implement your payment gateway here
      setUserStats(prev => ({
        ...prev,
        isPremium: true
      }));
      alert('Welcome to Premium! You can now earn tokens for chat completions.');
    } catch (error) {
      console.error('Payment failed:', error);
    }
  };

  const checkAndRewardTokens = () => {
    if (!userStats.isPremium) return;

    const today = new Date().toISOString().split('T')[0];
    if (userStats.dailyMessageCount < DAILY_MESSAGE_LIMIT) {
      const newTokens = TOKENS_PER_COMPLETION;
      setUserStats(prev => ({
        ...prev,
        dailyMessageCount: prev.dailyMessageCount + 1,
        totalTokensEarned: prev.totalTokensEarned + newTokens,
        lastRewardDate: today
      }));
      setShowRewardNotification(true);
      setTimeout(() => setShowRewardNotification(false), 3000);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { type: 'user', content: input };
    setMessages([...messages, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('https://chatapi.akash.network/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_AKASH_API_KEY}`
        },
        body: JSON.stringify({
          model: 'Meta-Llama-3-1-8B-Instruct-FP8',
          messages: [
            ...messages.map(msg => ({
              role: msg.type === 'user' ? 'user' : 'assistant',
              content: msg.content
            })),
            { role: 'user', content: input }
          ]
        })
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const data: ApiResponse = await response.json();
      const botMessage: Message = { 
        type: 'bot', 
        content: data.choices[0].message.content 
      };
      setMessages(prev => [...prev, botMessage]);
      checkAndRewardTokens();
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = { 
        type: 'bot', 
        content: 'Sorry, I encountered an error. Please try again.' 
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen max-h-[600px] w-[400px] bg-gray-900">
      {/* Header with Premium Status */}
      <div className="bg-[#FF414D] p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bot className="w-6 h-6 text-white" />
            <h1 className="text-xl font-bold text-white">Akash Network Chat</h1>
          </div>
          {userStats.isPremium ? (
            <div className="flex items-center space-x-2">
              <Crown className="w-5 h-5 text-yellow-400" />
              <span className="text-sm text-white">Premium</span>
            </div>
          ) : (
            <button
              onClick={handlePremiumPurchase}
              className="px-3 py-1 text-sm bg-yellow-500 text-white rounded-full hover:bg-yellow-600"
            >
              Get Premium
            </button>
          )}
        </div>
        {userStats.isPremium && (
          <div className="mt-2 text-sm text-white flex justify-between items-center">
            <span>Daily Messages: {userStats.dailyMessageCount}/{DAILY_MESSAGE_LIMIT}</span>
            <span>Tokens Earned: {userStats.totalTokensEarned.toFixed(2)}</span>
          </div>
        )}
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 relative">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.type === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                message.type === 'user'
                  ? 'bg-[#FF414D] text-white'
                  : 'bg-gray-800 text-gray-100'
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-800 text-gray-100 p-3 rounded-lg">
              Thinking...
            </div>
          </div>
        )}
        
        {/* Reward Notification */}
        {showRewardNotification && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-white px-4 py-2 rounded-full flex items-center space-x-2 animate-bounce">
            <Gift className="w-4 h-4" />
            <span>+{TOKENS_PER_COMPLETION} tokens earned!</span>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-800">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 p-2 rounded-lg bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-[#FF414D]"
          />
          <button
            type="submit"
            className="p-2 bg-[#FF414D] rounded-lg text-white hover:bg-[#ff5c66] transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}