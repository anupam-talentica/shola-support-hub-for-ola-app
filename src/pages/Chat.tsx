import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { openAIService } from "@/services/openai";
import { 
  ArrowLeft, 
  Send, 
  Paperclip, 
  Bot, 
  User, 
  ThumbsUp, 
  ThumbsDown,
  FileText,
  X,
  Settings,
  Loader2
} from "lucide-react";

// Electric Scooter Knowledge Base
const scooterKnowledge = {
  battery: {
    keywords: ["battery", "charge", "charging", "range", "power", "dead", "drain", "percentage"],
    responses: [
      "For optimal battery performance, charge your electric scooter after each ride. Full charge typically takes 4-6 hours.",
      "Most electric scooters have a range of 15-25 km per charge, depending on terrain and rider weight.",
      "If your battery drains quickly, avoid overcharging and store in moderate temperatures (15-25°C).",
      "Red battery indicator means charge immediately. Avoid completely draining the battery."
    ]
  },
  rides: {
    keywords: ["ride", "book", "booking", "start", "end", "trip", "journey", "unlock", "lock"],
    responses: [
      "To start a ride, scan the QR code on the scooter and follow the app instructions.",
      "Always wear a helmet and follow traffic rules when riding your electric scooter.",
      "End your ride by parking in designated areas and locking the scooter through the app.",
      "If you face issues starting a ride, check your app permissions and internet connection."
    ]
  },
  payment: {
    keywords: ["payment", "money", "bill", "cost", "price", "refund", "wallet", "card", "pay"],
    responses: [
      "Payment is processed automatically after each ride based on time and distance.",
      "You can add money to your wallet or link a credit/debit card for seamless payments.",
      "For refund requests, contact our support team with your trip ID within 24 hours.",
      "Check your trip history in the app to view detailed payment breakdowns."
    ]
  },
  maintenance: {
    keywords: ["repair", "service", "broken", "fix", "maintenance", "issue", "problem", "defect"],
    responses: [
      "Report damaged scooters immediately through the app to ensure safety for all users.",
      "Regular maintenance includes checking tire pressure, brakes, and battery connections.",
      "If you encounter a mechanical issue during a ride, end the trip safely and report it.",
      "Our service team conducts regular inspections and maintenance on all scooters."
    ]
  },
  safety: {
    keywords: ["safety", "helmet", "accident", "emergency", "rules", "traffic", "speed"],
    responses: [
      "Always wear a helmet and protective gear when riding an electric scooter.",
      "Follow local traffic laws and ride in designated areas only.",
      "Maximum speed is limited to 25 km/h for safety. Avoid riding in bad weather.",
      "In case of emergency, contact local authorities first, then report through our app."
    ]
  },
  account: {
    keywords: ["account", "profile", "login", "password", "phone", "verification", "register"],
    responses: [
      "Create your account using your phone number and complete OTP verification.",
      "Keep your profile information updated for better service and security.",
      "If you forgot your password, use the 'Forgot Password' option on the login screen.",
      "For account security, don't share your login credentials with others."
    ]
  }
};

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  file?: {
    name: string;
    size: string;
    type: string;
  };
  rating?: 'up' | 'down';
}

interface UnresolvedQuery {
  id: string;
  originalMessage: string;
  query: string;
  userEmail: string;
  timestamp: Date;
}

const Chat = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showFeedbackForm, setShowFeedbackForm] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [isAIEnabled, setIsAIEnabled] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load chat history and API key from localStorage
  useEffect(() => {
    const savedMessages = localStorage.getItem('chatHistory');
    if (savedMessages) {
      const parsed = JSON.parse(savedMessages);
      setMessages(parsed.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      })));
    }

    // Check for saved API key
    const savedApiKey = localStorage.getItem('openai_api_key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
      setIsAIEnabled(true);
      openAIService.setApiKey(savedApiKey);
    }

    // Add welcome message if no history
    if (!savedMessages) {
      const welcomeMessage: Message = {
        id: Date.now().toString(),
        text: `Hello! I'm your Electric Scooter Support Assistant${savedApiKey ? ' powered by AI' : ''}. I can help you with battery issues, ride problems, payments, maintenance, safety guidelines, and account management. How can I assist you today?`,
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, []);

  // Save messages to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('chatHistory', JSON.stringify(messages));
    }
  }, [messages]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Smart pattern matching function
  const findBestResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    // Check for non-scooter related queries
    const nonScooterKeywords = [
      'weather', 'news', 'sports', 'movies', 'food', 'restaurant', 'hotel', 
      'flight', 'train', 'bus', 'taxi', 'cab', 'movie', 'game', 'music'
    ];
    
    const hasNonScooterKeyword = nonScooterKeywords.some(keyword => 
      lowerMessage.includes(keyword)
    );
    
    if (hasNonScooterKeyword) {
      return "Sorry, I can only help with electric scooter related questions. Please ask me about battery, rides, payments, maintenance, safety, or account issues.";
    }

    // Find matching category and response
    let bestMatch = { category: '', score: 0, responses: [] as string[] };
    
    Object.entries(scooterKnowledge).forEach(([category, data]) => {
      const matchingKeywords = data.keywords.filter(keyword => 
        lowerMessage.includes(keyword)
      );
      
      const score = matchingKeywords.length;
      if (score > bestMatch.score) {
        bestMatch = { category, score, responses: data.responses };
      }
    });

    if (bestMatch.score > 0) {
      // Return random response from the best matching category
      return bestMatch.responses[Math.floor(Math.random() * bestMatch.responses.length)];
    }

    // Default response for scooter-related but unmatched queries
    return "I understand you're asking about electric scooters. Could you please be more specific? I can help with battery issues, ride problems, payments, maintenance, safety guidelines, or account management.";
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() && !selectedFile) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: 'user',
      timestamp: new Date(),
      file: selectedFile ? {
        name: selectedFile.name,
        size: (selectedFile.size / 1024).toFixed(1) + ' KB',
        type: selectedFile.type
      } : undefined
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText("");
    setSelectedFile(null);
    setIsTyping(true);

    try {
      let botResponse: string;
      
      if (isAIEnabled) {
        // Try OpenAI first
        try {
          botResponse = await openAIService.getResponse(userMessage.text);
        } catch (error) {
          console.error('OpenAI error, falling back to pattern matching:', error);
          botResponse = findBestResponse(userMessage.text);
          toast({
            title: "AI temporarily unavailable",
            description: "Switched to basic responses. Check your API key.",
            variant: "destructive"
          });
        }
      } else {
        // Use pattern matching
        botResponse = findBestResponse(userMessage.text);
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botResponse,
        sender: 'bot',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error generating response:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm sorry, I encountered an error. Please try again.",
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSaveApiKey = () => {
    if (!apiKey.trim()) {
      toast({
        title: "API Key Required",
        description: "Please enter your OpenAI API key",
        variant: "destructive"
      });
      return;
    }

    localStorage.setItem('openai_api_key', apiKey);
    openAIService.setApiKey(apiKey);
    setIsAIEnabled(true);
    setShowSettings(false);
    
    toast({
      title: "API Key Saved",
      description: "AI responses are now enabled!",
    });
  };

  const handleDisableAI = () => {
    localStorage.removeItem('openai_api_key');
    setApiKey("");
    setIsAIEnabled(false);
    setShowSettings(false);
    
    toast({
      title: "AI Disabled",
      description: "Switched to basic pattern matching responses",
    });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select a file smaller than 5MB",
          variant: "destructive"
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleRating = (messageId: string, rating: 'up' | 'down') => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, rating } : msg
    ));

    if (rating === 'down') {
      setShowFeedbackForm(messageId);
    } else {
      toast({
        title: "Thank you!",
        description: "Your feedback helps us improve our service."
      });
    }
  };

  const handleSubmitFeedback = () => {
    if (!feedbackText.trim() || !userEmail.trim()) {
      toast({
        title: "Please fill all fields",
        description: "Both query and email are required",
        variant: "destructive"
      });
      return;
    }

    const unresolvedQuery: UnresolvedQuery = {
      id: Date.now().toString(),
      originalMessage: messages.find(m => m.id === showFeedbackForm)?.text || "",
      query: feedbackText,
      userEmail: userEmail,
      timestamp: new Date()
    };

    // Save to localStorage
    const existingQueries = JSON.parse(localStorage.getItem('unresolvedQueries') || '[]');
    existingQueries.push(unresolvedQuery);
    localStorage.setItem('unresolvedQueries', JSON.stringify(existingQueries));

    toast({
      title: "Query submitted successfully!",
      description: "Our team will review your query and get back to you soon."
    });

    setShowFeedbackForm(null);
    setFeedbackText("");
    setUserEmail("");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b bg-card px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-3 flex-1">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <Bot className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-semibold">Electric Scooter Support</h1>
            <p className="text-sm text-muted-foreground">
              {isAIEnabled ? `AI Assistant (${openAIService.getUsageCount()} queries)` : 'Basic Assistant'}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setShowSettings(true)}>
          <Settings className="h-4 w-4" />
        </Button>
        <Badge variant="outline" className="ml-auto">Online</Badge>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex gap-3 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex gap-3 max-w-[80%] ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.sender === 'user' ? 'bg-primary' : 'bg-secondary'
              }`}>
                {message.sender === 'user' ? 
                  <User className="h-4 w-4 text-primary-foreground" /> : 
                  <Bot className="h-4 w-4 text-secondary-foreground" />
                }
              </div>
              <div className={`rounded-lg px-4 py-2 ${
                message.sender === 'user' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-card border'
              }`}>
                <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                {message.file && (
                  <div className="mt-2 p-2 bg-muted rounded flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <div className="text-xs">
                      <p className="font-medium">{message.file.name}</p>
                      <p className="text-muted-foreground">{message.file.size}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  <span>{message.timestamp.toLocaleTimeString()}</span>
                  {message.sender === 'bot' && (
                    <div className="flex gap-1 ml-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleRating(message.id, 'up')}
                      >
                        <ThumbsUp className={`h-3 w-3 ${message.rating === 'up' ? 'fill-current text-success' : ''}`} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleRating(message.id, 'down')}
                      >
                        <ThumbsDown className={`h-3 w-3 ${message.rating === 'down' ? 'fill-current text-destructive' : ''}`} />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex gap-3">
            <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
              <Bot className="h-4 w-4 text-secondary-foreground" />
            </div>
            <div className="bg-card border rounded-lg px-4 py-2">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Selected File Preview */}
      {selectedFile && (
        <div className="px-4 py-2 border-t bg-muted/30">
          <div className="flex items-center gap-2 text-sm">
            <FileText className="h-4 w-4" />
            <span className="font-medium">{selectedFile.name}</span>
            <span className="text-muted-foreground">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 ml-auto"
              onClick={() => setSelectedFile(null)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t bg-card px-4 py-3">
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <Input
            placeholder="Ask about battery, rides, payments, maintenance..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-1"
          />
          <Button onClick={handleSendMessage} disabled={!inputText.trim() && !selectedFile}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.txt"
        />
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>AI Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isAIEnabled ? (
                <>
                  <div>
                    <label className="text-sm font-medium">OpenAI API Key:</label>
                    <Input
                      type="password"
                      placeholder="sk-..."
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Your API key is stored locally and never shared. Get yours from openai.com
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSaveApiKey} className="flex-1">
                      Enable AI
                    </Button>
                    <Button variant="outline" onClick={() => setShowSettings(false)}>
                      Cancel
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <p className="text-sm">✅ AI is enabled</p>
                    <p className="text-xs text-muted-foreground">
                      Queries used: {openAIService.getUsageCount()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Estimated cost: ~${(openAIService.getUsageCount() * 0.0001).toFixed(4)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="destructive" onClick={handleDisableAI} className="flex-1">
                      Disable AI
                    </Button>
                    <Button variant="outline" onClick={() => setShowSettings(false)}>
                      Close
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Feedback Form Modal */}
      {showFeedbackForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Submit Your Query</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Your specific question or issue:</label>
                <Textarea
                  placeholder="Describe your question in detail..."
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  className="mt-1"
                  rows={3}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Your email for follow-up:</label>
                <Input
                  placeholder="your-email@example.com"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="mt-1"
                  type="email"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSubmitFeedback} className="flex-1">
                  Submit Query
                </Button>
                <Button variant="outline" onClick={() => setShowFeedbackForm(null)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Chat;