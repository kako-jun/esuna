/**
 * 天気予報ヘルパー
 */

export interface WeatherData {
  city: string;
  temperature: number;
  tempMax: number;
  tempMin: number;
  description: string;
  humidity: number;
  windSpeed: number;
}

export async function fetchWeather(city: string): Promise<WeatherData> {
  const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;

  if (!apiKey) {
    console.warn('OpenWeather API key not found, returning dummy data');
    return {
      city,
      temperature: 22,
      tempMax: 25,
      tempMin: 18,
      description: '晴れ',
      humidity: 60,
      windSpeed: 3,
    };
  }

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric&lang=ja`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      city: data.name,
      temperature: Math.round(data.main.temp),
      tempMax: Math.round(data.main.temp_max),
      tempMin: Math.round(data.main.temp_min),
      description: data.weather[0]?.description || '不明',
      humidity: data.main.humidity,
      windSpeed: Math.round(data.wind.speed * 10) / 10,
    };
  } catch (error) {
    console.error('Failed to fetch weather:', error);
    throw error;
  }
}

export function getCurrentTimeText(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const date = now.getDate();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const dayOfWeek = ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'][now.getDay()];

  const period = hours < 12 ? '午前' : '午後';
  const displayHours = hours % 12 || 12;

  return `今日は${year}年${month}月${date}日、${dayOfWeek}、${period}${displayHours}時${minutes}分です`;
}

export function getWeatherText(weather: WeatherData): string {
  return `${weather.city}の天気は${weather.description}、気温は${weather.temperature}度、最高気温${weather.tempMax}度、最低気温${weather.tempMin}度です`;
}

export function getGreeting(): string {
  const hour = new Date().getHours();

  if (hour < 5) {
    return 'おはようございます。まだ真夜中ですね';
  } else if (hour < 12) {
    return 'おはようございます';
  } else if (hour < 17) {
    return 'こんにちは';
  } else if (hour < 21) {
    return 'こんばんは';
  } else {
    return 'こんばんは。もう遅い時間ですね';
  }
}
