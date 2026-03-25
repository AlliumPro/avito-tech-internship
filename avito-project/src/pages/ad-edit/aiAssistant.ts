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

type OllamaGenerateResponse = {
  response?: string;
  error?: string;
};

const OLLAMA_BASE_URL =
  (import.meta.env.VITE_OLLAMA_BASE_URL as string | undefined)?.trim() ||
  'http://127.0.0.1:11434';
const OLLAMA_MODEL =
  (import.meta.env.VITE_OLLAMA_MODEL as string | undefined)?.trim() ||
  'gemma3:1b';
const OLLAMA_TIMEOUT_MS = Number(
  (import.meta.env.VITE_OLLAMA_TIMEOUT_MS as string | undefined) || '30000',
);

const CATEGORY_LABELS: Record<Category, string> = {
  auto: 'Авто',
  electronics: 'Электроника',
  real_estate: 'Недвижимость',
};

const PARAM_LABELS: Record<string, string> = {
  brand: 'Бренд',
  model: 'Модель',
  yearOfManufacture: 'Год выпуска',
  transmission: 'КПП',
  mileage: 'Пробег',
  enginePower: 'Мощность двигателя',
  type: 'Тип',
  condition: 'Состояние',
  color: 'Цвет',
  address: 'Адрес',
  area: 'Площадь',
  floor: 'Этаж',
};

const humanizeValue = (value: string | number): string => {
  if (typeof value === 'number') {
    return String(value);
  }

  const map: Record<string, string> = {
    automatic: 'автоматическая',
    manual: 'механическая',
    phone: 'телефон',
    laptop: 'ноутбук',
    misc: 'другое',
    flat: 'квартира',
    house: 'дом',
    room: 'комната',
    new: 'новый',
    used: 'б/у',
  };

  return map[value] ?? value;
};

const buildItemContext = (
  input: AiSuggestionInput,
  options?: {
    includePrice?: boolean;
  },
): string => {
  const params = Object.entries(input.params)
    .map(([key, value]) => `- ${PARAM_LABELS[key] ?? key}: ${humanizeValue(value)}`)
    .join('\n');

  const includePrice = options?.includePrice ?? true;

  return [
    `Категория: ${CATEGORY_LABELS[input.category]}`,
    `Название: ${input.title}`,
    ...(includePrice ? [`Цена: ${input.price} руб.`] : []),
    `Описание: ${input.description?.trim() || 'не заполнено'}`,
    'Характеристики:',
    params || '- не заполнены',
  ].join('\n');
};

const requestOllama = async (prompt: string): Promise<string> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), OLLAMA_TIMEOUT_MS);

  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        stream: false,
        prompt,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Ollama вернула ${response.status}: ${text || 'ошибка без текста'}`);
    }

    const data = (await response.json()) as OllamaGenerateResponse;

    if (data.error) {
      throw new Error(data.error);
    }

    const output = data.response?.trim();

    if (!output) {
      throw new Error('Ollama вернула пустой ответ.');
    }

    return output;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('AI-запрос превысил таймаут. Попробуйте еще раз.');
    }

    if (error instanceof TypeError) {
      throw new Error(
        'Не удалось подключиться к Ollama. Проверьте, что Ollama запущена на localhost:11434.',
      );
    }

    throw error;
  } finally {
    clearTimeout(timer);
  }
};

class OllamaAiAssistant implements AiAssistant {
  async generateDescription(input: AiSuggestionInput): Promise<string> {
    const prompt = [
      'Ты помощник по улучшению текста объявления на русском языке.',
      'Перепиши описание так, чтобы оно было информативным, честным и продающим.',
      'Сохрани факты, не выдумывай характеристики и состояние.',
      'Не используй markdown, эмодзи и списки.',
      'Сделай ответ чуть более развернутым: 5-7 предложений на русском языке.',
      'Структура: краткое позиционирование товара, состояние, ключевые характеристики, сценарии использования, аккуратный финальный призыв.',
      'Ответ только готовым текстом описания, без заголовков и списков.',
      '',
      buildItemContext(input, { includePrice: true }),
    ].join('\n');

    return requestOllama(prompt);
  }

  async estimatePrice(input: AiSuggestionInput): Promise<number | null> {
    const prompt = [
      'Ты оцениваешь рыночную цену объявления в рублях.',
      'Оцени по категории, параметрам, состоянию и описанию.',
      'Цена из карточки может быть завышена или занижена. НЕ копируй и НЕ повторяй цену из карточки.',
      'Верни ответ строго в формате: PRICE: <целое_число_в_рублях>.',
      'Без валюты, без пробелов в числе, без любых пояснений.',
      '',
      buildItemContext(input, { includePrice: false }),
    ].join('\n');

    const output = await requestOllama(prompt);
    const match = output.match(/PRICE\s*:\s*(-?\d+[\d.,]*)/i);
    const numericPart = match?.[1];

    if (!numericPart) {
      throw new Error('Не удалось распознать цену из ответа AI.');
    }

    const parsed = Number(numericPart.replace(',', '.'));

    if (!Number.isFinite(parsed)) {
      throw new Error('AI вернул некорректную цену.');
    }

    if (Math.round(parsed) === Math.round(input.price)) {
      throw new Error('AI вернул текущую цену из карточки. Попробуйте еще раз.');
    }

    return Math.max(0, Math.round(parsed));
  }
}

export const createAiAssistant = (): AiAssistant => {
  return new OllamaAiAssistant();
};
