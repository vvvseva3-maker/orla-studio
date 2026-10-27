/* =========================================================================
   ПОГОДА И СОВЕТ ФОТОГРАФА
   Данные: Open-Meteo (https://open-meteo.com), без ключа, прогноз на 16 дней.
   Здесь только запросы и «мозг» рекомендаций — отрисовка в main.js.
   ========================================================================= */

(function () {
  const cfg = window.SITE_CONFIG || {};
  const key = cfg.weatherApiKey;
  const FORECAST_URL = key ? 'https://customer-api.open-meteo.com/v1/forecast' : 'https://api.open-meteo.com/v1/forecast';
  const GEO_URL = key ? 'https://customer-geocoding-api.open-meteo.com/v1/search' : 'https://geocoding-api.open-meteo.com/v1/search';
  const FORECAST_DAYS = 16;

  const cache = new Map(); // чтобы не запрашивать одну и ту же локацию дважды

  /** Прогноз: текущая погода + почасовой на 16 дней в местном времени локации */
  async function getForecast(lat, lng) {
    const id = `${lat.toFixed(3)},${lng.toFixed(3)}`;
    if (cache.has(id)) return cache.get(id);
    const params = new URLSearchParams({
      latitude: lat, longitude: lng,
      current: 'temperature_2m,apparent_temperature,cloud_cover,wind_speed_10m,precipitation,weather_code',
      hourly: 'temperature_2m,cloud_cover,wind_speed_10m,precipitation_probability,weather_code',
      timezone: 'auto', forecast_days: FORECAST_DAYS, wind_speed_unit: 'kmh'
    });
    if (key) params.set('apikey', key);
    const res = await fetch(`${FORECAST_URL}?${params}`);
    if (!res.ok) throw new Error('weather ' + res.status);
    const data = await res.json();
    cache.set(id, data);
    return data;
  }

  /** Поиск города по названию (для поля «Другой город») */
  async function searchPlace(query) {
    const params = new URLSearchParams({ name: query, count: 5, language: 'ru', format: 'json' });
    if (key) params.set('apikey', key);
    const res = await fetch(`${GEO_URL}?${params}`);
    if (!res.ok) throw new Error('geocoding ' + res.status);
    const data = await res.json();
    return (data.results || []).map((r) => ({
      name: r.name,
      detail: [r.admin1, r.country].filter(Boolean).join(', '),
      lat: r.latitude, lng: r.longitude, tz: r.timezone
    }));
  }

  /** Погода в конкретный час: localHour — строка 'YYYY-MM-DDTHH:00' местного времени */
  function atHour(data, localHour) {
    const i = data.hourly.time.indexOf(localHour);
    if (i < 0) return null;
    const h = data.hourly;
    return {
      temp: h.temperature_2m[i], cloud: h.cloud_cover[i], wind: h.wind_speed_10m[i],
      rain: h.precipitation_probability[i], code: h.weather_code[i]
    };
  }

  /** Есть ли прогноз на эту дату */
  function covers(data, isoDate) {
    return data.hourly.time.some((t) => t.startsWith(isoDate));
  }

  /* Коды погоды WMO → описание и тип иконки */
  const CODES = {
    0: ['Ясно', 'sun'], 1: ['Почти ясно', 'sun'], 2: ['Переменная облачность', 'part'], 3: ['Пасмурно', 'cloud'],
    45: ['Туман', 'fog'], 48: ['Изморозь и туман', 'fog'],
    51: ['Лёгкая морось', 'rain'], 53: ['Морось', 'rain'], 55: ['Сильная морось', 'rain'],
    56: ['Ледяная морось', 'rain'], 57: ['Ледяная морось', 'rain'],
    61: ['Небольшой дождь', 'rain'], 63: ['Дождь', 'rain'], 65: ['Сильный дождь', 'rain'],
    66: ['Ледяной дождь', 'rain'], 67: ['Ледяной дождь', 'rain'],
    71: ['Небольшой снег', 'snow'], 73: ['Снег', 'snow'], 75: ['Сильный снег', 'snow'], 77: ['Снежная крупа', 'snow'],
    80: ['Ливень', 'rain'], 81: ['Ливень', 'rain'], 82: ['Сильный ливень', 'rain'],
    85: ['Снегопад', 'snow'], 86: ['Сильный снегопад', 'snow'],
    95: ['Гроза', 'storm'], 96: ['Гроза с градом', 'storm'], 99: ['Гроза с градом', 'storm']
  };
  const describe = (code) => CODES[code] || ['—', 'cloud'];

  /**
   * Совет фотографа по погоде.
   * Возвращает заголовок, текст и ключ одежды для блока «Что надеть»
   * (sun | cloud | wind | rain | cold).
   */
  function advise(w) {
    const kind = describe(w.code)[1];
    const wet = kind === 'rain' || kind === 'storm' || w.rain >= 60;
    let title, text, outfit;

    if (kind === 'storm') {
      title = 'Гроза — лучше перенести';
      text = 'На улице снимать небезопасно. Предложу студию или другой день, а свободную дату подберём здесь же.';
      outfit = 'rain';
    } else if (wet) {
      title = 'Вероятен дождь';
      text = 'Можно снять атмосферную историю: прозрачный зонт, мокрый асфальт, отражения огней. Или уйти в кафе и студию.';
      outfit = 'rain';
    } else if (kind === 'fog') {
      title = 'Туман — редкая удача';
      text = 'Фон растворяется, кадры получаются как картины. Отлично для портретов и love story у воды.';
      outfit = 'cloud';
    } else if (w.cloud >= 80) {
      title = 'Пасмурно — мягкий свет';
      text = 'Небо работает как огромный софтбокс: без резких теней, кожа выглядит ровно. Идеально для портретов.';
      outfit = 'cloud';
    } else if (w.cloud >= 30) {
      title = 'Облака — драматичное небо';
      text = 'На закате облака подсветятся розовым и оранжевым. Хороший день и для портретов, и для пейзажа.';
      outfit = 'sun';
    } else {
      title = 'Ясно — идеально для улицы';
      text = 'Снимаем в золотой час: тёплый свет, длинные тени, сияющие волосы. Днём солнце жёсткое — уйдём в тень.';
      outfit = 'sun';
    }

    const notes = [];
    if (w.wind >= 30) { notes.push('Сильный ветер: соберите волосы или возьмите летящее платье — оно будет красиво развеваться.'); if (!wet) outfit = 'wind'; }
    if (w.temp <= 8) { notes.push('Холодно: тёплое пальто, плед между кадрами и горячий чай в термосе.'); if (!wet) outfit = 'cold'; }
    if (w.temp >= 28) notes.push('Жарко: снимаем рано утром или вечером, возьмите воду.');

    return { title, text, notes, outfit };
  }

  window.Weather = { getForecast, searchPlace, atHour, covers, describe, advise, FORECAST_DAYS };
})();
