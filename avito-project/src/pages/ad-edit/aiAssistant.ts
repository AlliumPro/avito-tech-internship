type Category = 'auto' | 'electronics' | 'real_estate';

export type AiSuggestionInput = {
  category: Category;
  title: string;
  description?: string;
  price: number;
  params: Record<string, string | number>;
};

export type AiAssistant = {
  generateDescription: (input: AiSuggestionInput) => Promise<string>;
  estimatePrice: (input: AiSuggestionInput) => Promise<number | null>;
};

class PlaceholderAiAssistant implements AiAssistant {
  async generateDescription(input: AiSuggestionInput): Promise<string> {
    void input;
    throw new Error('AI-помощник пока не подключен. Добавьте реализацию Ollama в aiAssistant.ts.');
  }

  async estimatePrice(input: AiSuggestionInput): Promise<number | null> {
    void input;
    throw new Error('AI-помощник пока не подключен. Добавьте реализацию Ollama в aiAssistant.ts.');
  }
}

export const createAiAssistant = (): AiAssistant => {
  return new PlaceholderAiAssistant();
};
