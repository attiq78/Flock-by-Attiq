import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageCircle, 
  X, 
  Send, 
  Bot, 
  User, 
  ShoppingBag, 
  Package, 
  HelpCircle,
  TrendingUp,
  BarChart3,
  Search,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  data?: any;
}

interface ProductRecommendation {
  _id: string;
  name: string;
  price: number;
  images: string[];
  category: string;
  rating: number;
}

interface OrderInfo {
  _id: string;
  orderNumber: string;
  orderStatus: string;
  paymentStatus: string;
  total: number;
  createdAt: string;
}

const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { getCartItemCount, cart } = useCart();

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Welcome message
      addBotMessage("Hello! I'm your AI assistant. I can help you with:\n\n• Product recommendations\n• Order tracking\n• General questions\n• Business analytics\n\nHow can I assist you today?");
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const addMessage = (type: 'user' | 'bot', content: string, data?: any) => {
    const message: Message = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
      data
    };
    setMessages(prev => [...prev, message]);
  };

  const addBotMessage = (content: string, data?: any) => {
    setIsTyping(true);
    setTimeout(() => {
      addMessage('bot', content, data);
      setIsTyping(false);
    }, 1000);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage = inputValue.trim();
    addMessage('user', userMessage);
    setInputValue('');

    // Process the message
    await processUserMessage(userMessage);
  };

  const processUserMessage = async (message: string) => {
    const lowerMessage = message.toLowerCase();

    // Product recommendations
    if (lowerMessage.includes('recommend') || lowerMessage.includes('suggest') || lowerMessage.includes('product')) {
      await handleProductRecommendation(lowerMessage);
    }
    // Order tracking
    else if (lowerMessage.includes('order') || lowerMessage.includes('track') || lowerMessage.includes('status')) {
      await handleOrderTracking(lowerMessage);
    }
    // Business analytics
    else if (lowerMessage.includes('analytics') || lowerMessage.includes('stats') || lowerMessage.includes('revenue') || lowerMessage.includes('sales')) {
      handleBusinessAnalytics();
    }
    // FAQ and general help
    else if (lowerMessage.includes('help') || lowerMessage.includes('faq') || lowerMessage.includes('support')) {
      handleFAQ();
    }
    // Cart information
    else if (lowerMessage.includes('cart') || lowerMessage.includes('basket')) {
      handleCartInfo();
    }
    // Contact information
    else if (lowerMessage.includes('contact') || lowerMessage.includes('phone') || lowerMessage.includes('email')) {
      handleContactInfo();
    }
    // Greeting
    else if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      addBotMessage("Hello! How can I help you today? I can assist with product recommendations, order tracking, or answer any questions you might have.");
    }
    // Default response
    else {
      addBotMessage("I understand you're looking for help. I can assist you with:\n\n• Product recommendations\n• Order tracking\n• Business analytics\n• General questions\n\nCould you be more specific about what you need?");
    }
  };

  const handleProductRecommendation = async (message: string) => {
    try {
      // Extract category or product type from message
      let category = '';
      let searchTerm = '';
      
      if (message.includes('electronics') || message.includes('phone') || message.includes('laptop')) {
        category = 'Electronics';
      } else if (message.includes('fashion') || message.includes('clothes') || message.includes('shirt')) {
        category = 'Fashion';
      } else if (message.includes('accessories') || message.includes('watch') || message.includes('bag')) {
        category = 'Accessories';
      } else if (message.includes('sports') || message.includes('fitness') || message.includes('gym')) {
        category = 'Sports';
      } else if (message.includes('home') || message.includes('furniture') || message.includes('decor')) {
        category = 'Home';
      } else {
        // Try to extract search term from the message
        const words = message.split(' ').filter(word => 
          !['recommend', 'suggest', 'product', 'show', 'find', 'search', 'for', 'me', 'a', 'an', 'the'].includes(word.toLowerCase())
        );
        if (words.length > 0) {
          searchTerm = words.join(' ');
        }
      }

      let apiUrl = '/api/products?limit=3';
      if (category) {
        apiUrl += `&category=${category}`;
      } else if (searchTerm) {
        apiUrl += `&search=${encodeURIComponent(searchTerm)}`;
      }

      const response = await fetch(apiUrl);
      const data = await response.json();

      if (data.success && data.data.length > 0) {
        const products = data.data;
        let responseText = `Here are some great ${category || searchTerm || 'product'} recommendations for you:\n\n`;
        
        products.forEach((product: ProductRecommendation, index: number) => {
          responseText += `${index + 1}. **${product.name}**\n`;
          responseText += `   Price: $${product.price}\n`;
          responseText += `   Category: ${product.category}\n`;
          responseText += `   Rating: ${product.rating}/5 ⭐\n\n`;
        });

        responseText += "Would you like to see more products or need help with anything else?";
        addBotMessage(responseText, { type: 'products', data: products });
      } else {
        addBotMessage("I'd be happy to recommend products! Could you tell me what type of products you're interested in? For example, electronics, fashion, accessories, sports, or home items?");
      }
    } catch (error) {
      addBotMessage("I'm having trouble fetching product recommendations right now. Please try again later or browse our products page directly.");
    }
  };

  const handleOrderTracking = async (message: string) => {
    if (!user) {
      addBotMessage("To track your orders, please log in to your account first. You can then view all your orders and their current status.");
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/orders', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.length > 0) {
          const orders = data.data.slice(0, 3); // Show last 3 orders
          let responseText = "Here are your recent orders:\n\n";
          
          orders.forEach((order: OrderInfo) => {
            responseText += `**Order #${order.orderNumber}**\n`;
            responseText += `Status: ${order.orderStatus}\n`;
            responseText += `Payment: ${order.paymentStatus}\n`;
            responseText += `Total: $${order.total}\n`;
            responseText += `Date: ${new Date(order.createdAt).toLocaleDateString()}\n\n`;
          });

          responseText += "You can view all your orders in the Orders section. Is there anything specific about your orders you'd like to know?";
          addBotMessage(responseText, { type: 'orders', data: orders });
        } else {
          addBotMessage("You don't have any orders yet. Start shopping to place your first order!");
        }
      } else {
        addBotMessage("I'm having trouble accessing your orders right now. Please try logging in again or contact support if the issue persists.");
      }
    } catch (error) {
      addBotMessage("I'm experiencing technical difficulties. Please try again later or contact our support team.");
    }
  };

  const handleBusinessAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        addBotMessage("Please log in to view business analytics.");
        return;
      }

      const response = await fetch('/api/analytics', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const analytics = data.data;
          setAnalyticsData(analytics);
          setShowAnalytics(true);
          const responseText = `Here are the current business analytics:\n\n**Key Metrics:**\n• Total Orders: ${analytics.overview.totalOrders}\n• Total Revenue: $${analytics.overview.totalRevenue.toLocaleString()}\n• Total Users: ${analytics.overview.totalUsers}\n• Total Products: ${analytics.overview.totalProducts}\n• Average Order Value: $${analytics.overview.averageOrderValue}\n\n**Top Categories:**\n${analytics.categories.map((cat: any) => `• ${cat.name}: ${cat.orders} orders ($${cat.revenue})`).join('\n')}\n\nWould you like to see more detailed analytics?`;
          addBotMessage(responseText, { type: 'analytics', data: analytics });
        } else {
          addBotMessage("I'm having trouble fetching analytics data right now. Please try again later.");
        }
      } else {
        addBotMessage("I'm having trouble accessing analytics data. Please make sure you're logged in and try again.");
      }
    } catch (error) {
      console.error('Analytics error:', error);
      addBotMessage("I'm experiencing technical difficulties. Please try again later.");
    }
  };

  const handleFAQ = () => {
    const faqText = `**Frequently Asked Questions:**\n\n**Q: How do I track my order?**\nA: You can track your order by going to the Orders section or asking me!\n\n**Q: What payment methods do you accept?**\nA: We accept credit/debit cards and cash on delivery.\n\n**Q: How long does shipping take?**\nA: Standard shipping takes 3-5 business days. Express shipping is available.\n\n**Q: Can I return items?**\nA: Yes, we offer a 30-day return policy for most items.\n\n**Q: Do you offer free shipping?**\nA: Yes, free shipping on orders over $50!\n\nIs there anything else you'd like to know?`;
    addBotMessage(faqText);
  };

  const handleCartInfo = () => {
    const cartCount = getCartItemCount();
    if (cartCount > 0) {
      addBotMessage(`You have ${cartCount} item${cartCount > 1 ? 's' : ''} in your cart. You can view your cart by clicking the cart icon in the header. Would you like me to help you with anything related to your cart?`);
    } else {
      addBotMessage("Your cart is currently empty. Would you like me to recommend some products for you?");
    }
  };

  const handleContactInfo = () => {
    const contactText = `**Contact Information:**\n\n📞 **Phone:** +1 (555) 123-4567\n📧 **Email:** support@flockbyattiq.com\n📍 **Address:** 123 Commerce Street, Business City, BC 12345\n\n**Business Hours:**\nMonday - Friday: 9:00 AM - 6:00 PM\nSaturday: 10:00 AM - 4:00 PM\nSunday: Closed\n\nIs there anything specific you'd like to contact us about?`;
    addBotMessage(contactText);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      {/* Chatbot Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110"
        title="AI Assistant"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {/* Chatbot Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-96 h-[600px] bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col max-h-[calc(100vh-8rem)]">
          {/* Header */}
          <div className="bg-purple-600 text-white p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bot className="h-5 w-5" />
              <span className="font-semibold">AI Assistant</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.type === 'user'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    {message.type === 'bot' && <Bot className="h-4 w-4 mt-1 flex-shrink-0 text-gray-600" />}
                    {message.type === 'user' && <User className="h-4 w-4 mt-1 flex-shrink-0 text-white" />}
                    <div className="flex-1">
                      <div className={`whitespace-pre-wrap text-sm ${
                        message.type === 'user' ? 'text-white' : 'text-gray-900'
                      }`}>{message.content}</div>
                      <div className={`text-xs mt-1 ${
                        message.type === 'user' ? 'text-purple-100' : 'text-gray-500'
                      }`}>
                        {formatTime(message.timestamp)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-900 p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Bot className="h-4 w-4 text-gray-600" />
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Analytics Modal */}
          {showAnalytics && (
            <div className="absolute inset-0 bg-white rounded-lg p-4 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2 text-gray-900" />
                  Business Analytics
                </h3>
                <button
                  onClick={() => setShowAnalytics(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                {analyticsData ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <div className="text-2xl font-bold text-blue-600">{analyticsData.overview?.totalOrders || 0}</div>
                        <div className="text-sm text-blue-800 font-medium">Total Orders</div>
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                        <div className="text-2xl font-bold text-green-600">${(analyticsData.overview?.totalRevenue || 0).toLocaleString()}</div>
                        <div className="text-sm text-green-800 font-medium">Total Revenue</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                        <div className="text-2xl font-bold text-purple-600">${analyticsData.overview?.averageOrderValue || 0}</div>
                        <div className="text-sm text-purple-800 font-medium">Avg Order Value</div>
                      </div>
                      <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                        <div className="text-2xl font-bold text-orange-600">{analyticsData.overview?.totalUsers || 0}</div>
                        <div className="text-sm text-orange-800 font-medium">Total Users</div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Top Categories</h4>
                      <div className="space-y-2">
                        {(analyticsData.categories || []).map((category: any, index: number) => (
                          <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded border border-gray-200">
                            <span className="font-medium text-gray-900">{category.name}</span>
                            <div className="text-right">
                              <div className="text-sm font-semibold text-gray-900">{category.orders} orders</div>
                              <div className="text-xs text-gray-600">${category.revenue}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Recent Orders</h4>
                      <div className="space-y-2">
                        {(analyticsData.recentOrders || []).map((order: any, index: number) => (
                          <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded border border-gray-200">
                            <div>
                              <div className="font-medium text-gray-900">{order.orderNumber}</div>
                              <div className="text-sm text-gray-600">{order.customer}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-gray-900">${order.amount}</div>
                              <div className={`text-xs px-2 py-1 rounded ${
                                order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {order.status}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading analytics data...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Input */}
          {!showAnalytics && (
            <div className="p-4 border-t border-gray-200">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm text-gray-900 placeholder-gray-500"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim()}
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white p-2 rounded-lg transition-colors"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default Chatbot;
