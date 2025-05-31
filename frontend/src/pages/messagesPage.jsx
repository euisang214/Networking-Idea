import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks';
import { Navigate } from 'react-router-dom';
import MessagesAPI from '../api/messages';
import Card from '../components/common/card';
import Button from '../components/common/button';
import Input from '../components/common/input';
import Spinner from '../components/common/spinner';

const MessagesPage = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  if (!user) {
    return <Navigate to="/login" />;
  }

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.user._id);
    }
  }, [selectedConversation]);

  const fetchConversations = async () => {
    try {
      const conversationsData = await MessagesAPI.getConversations();
      setConversations(conversationsData);
      if (conversationsData.length > 0 && !selectedConversation) {
        setSelectedConversation(conversationsData[0]);
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (userId) => {
    try {
      const messagesData = await MessagesAPI.getConversation(userId);
      setMessages(messagesData.reverse()); // Reverse to show newest at bottom
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      setSending(true);
      const sentMessage = await MessagesAPI.sendMessage({
        recipientId: selectedConversation.user._id,
        content: newMessage.trim()
      });
      
      setMessages(prev => [...prev, sentMessage]);
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" text="Loading conversations..." />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
        <p className="text-gray-600">Communicate with professionals and candidates</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
        {/* Conversations List */}
        <Card className="lg:col-span-1">
          <div className="h-full flex flex-col">
            <div className="border-b border-gray-200 pb-4 mb-4">
              <h2 className="text-lg font-medium text-gray-900">Conversations</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-2">
              {conversations.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No conversations yet</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Start a conversation by booking a session
                  </p>
                </div>
              ) : (
                conversations.map((conversation) => (
                  <button
                    key={conversation._id}
                    onClick={() => setSelectedConversation(conversation)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedConversation?._id === conversation._id
                        ? 'bg-blue-50 border border-blue-200'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-700">
                          {conversation.user.firstName?.charAt(0)}{conversation.user.lastName?.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {conversation.user.firstName} {conversation.user.lastName}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {conversation.lastMessage?.content || 'No messages yet'}
                        </p>
                      </div>
                      {conversation.unreadCount > 0 && (
                        <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-xs text-white font-medium">
                            {conversation.unreadCount}
                          </span>
                        </div>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </Card>

        {/* Messages */}
        <Card className="lg:col-span-2">
          <div className="h-full flex flex-col">
            {selectedConversation ? (
              <>
                {/* Header */}
                <div className="border-b border-gray-200 pb-4 mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-700">
                        {selectedConversation.user.firstName?.charAt(0)}{selectedConversation.user.lastName?.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h2 className="text-lg font-medium text-gray-900">
                        {selectedConversation.user.firstName} {selectedConversation.user.lastName}
                      </h2>
                      <p className="text-sm text-gray-500 capitalize">
                        {selectedConversation.user.userType}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No messages yet</p>
                      <p className="text-sm text-gray-400 mt-2">
                        Send the first message to start the conversation
                      </p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message._id}
                        className={`flex ${
                          message.sender._id === user._id ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.sender._id === user._id
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p
                            className={`text-xs mt-1 ${
                              message.sender._id === user._id
                                ? 'text-blue-100'
                                : 'text-gray-500'
                            }`}
                          >
                            {formatTime(message.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Message Input */}
                <form onSubmit={handleSendMessage} className="flex space-x-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1"
                    disabled={sending}
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={!newMessage.trim() || sending}
                    isLoading={sending}
                  >
                    Send
                  </Button>
                </form>
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <p className="text-gray-500 text-lg">Select a conversation to start messaging</p>
                  <p className="text-gray-400 text-sm mt-2">
                    Choose from your conversations on the left
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default MessagesPage;