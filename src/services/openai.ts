import OpenAI from 'openai';

interface CachedResponse {
  response: string;
  timestamp: number;
}

class OpenAIService {
  private client: OpenAI | null = null;
  private apiKey: string | null = null;
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private readonly CACHE_KEY = 'scooter_chat_cache';
  private readonly USAGE_KEY = 'openai_usage_count';

  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
    this.client = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true
    });
  }

  private getCacheKey(query: string): string {
    return `${this.CACHE_KEY}_${btoa(query.toLowerCase().trim())}`;
  }

  private getFromCache(query: string): string | null {
    try {
      const cacheKey = this.getCacheKey(query);
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsedCache: CachedResponse = JSON.parse(cached);
        if (Date.now() - parsedCache.timestamp < this.CACHE_DURATION) {
          return parsedCache.response;
        }
        localStorage.removeItem(cacheKey);
      }
    } catch (error) {
      console.warn('Cache read error:', error);
    }
    return null;
  }

  private saveToCache(query: string, response: string) {
    try {
      const cacheKey = this.getCacheKey(query);
      const cacheData: CachedResponse = {
        response,
        timestamp: Date.now()
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Cache save error:', error);
    }
  }

  private incrementUsage() {
    try {
      const current = parseInt(localStorage.getItem(this.USAGE_KEY) || '0');
      localStorage.setItem(this.USAGE_KEY, (current + 1).toString());
    } catch (error) {
      console.warn('Usage tracking error:', error);
    }
  }

  getUsageCount(): number {
    try {
      return parseInt(localStorage.getItem(this.USAGE_KEY) || '0');
    } catch {
      return 0;
    }
  }

  private isScooterRelated(query: string): boolean {
    const scooterKeywords = [
      'scooter', 'battery', 'charge', 'ride', 'payment', 'booking', 'speed',
      'maintenance', 'repair', 'helmet', 'safety', 'unlock', 'lock', 'trip',
      'range', 'motor', 'brake', 'wheel', 'tire', 'account', 'app', 'qr code'
    ];
    
    const lowercaseQuery = query.toLowerCase();
    return scooterKeywords.some(keyword => lowercaseQuery.includes(keyword));
  }

  async getResponse(userQuery: string, retryCount = 0): Promise<string> {
    // Pre-filter non-scooter queries
    if (!this.isScooterRelated(userQuery)) {
      return "I'm sorry, I can only help you with electric scooter related questions. Please ask about battery, rides, payments, maintenance, safety, or account issues.";
    }

    // Check cache first
    const cachedResponse = this.getFromCache(userQuery);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Check if API key is set
    if (!this.client || !this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const completion = await this.client.chat.completions.create({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          {
            role: 'system',
            content: 'You are an expert electric scooter support assistant with comprehensive knowledge of all major brands (OLA, Ather, TVS, Bajuj, etc.). Provide accurate, detailed, and helpful responses about battery management, maintenance schedules, troubleshooting, safety, payments, and account issues. Be concise but thorough. For non-scooter questions, politely decline and redirect to scooter-related topics.'
          },
          {
            role: 'user',
            content: userQuery
          }
        ],
        max_tokens: 300,
        temperature: 0.6
      });

      const response = completion.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response. Please try again.";
      
      // Cache the response and increment usage
      this.saveToCache(userQuery, response);
      this.incrementUsage();
      
      return response;
    } catch (error) {
      console.error('OpenAI API error:', error);
      
      // Retry once on failure
      if (retryCount < 1) {
        return this.getResponse(userQuery, retryCount + 1);
      }
      
      throw error;
    }
  }
}

export const openAIService = new OpenAIService();