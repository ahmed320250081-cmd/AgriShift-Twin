import { HourlyWeatherPoint, WeatherForecast } from '../types/farm';
import { OWAINAT_CENTER } from '../utils/agronomy';

function buildClimatologyFallback(): WeatherForecast {
  const hours: HourlyWeatherPoint[] = [
    { timeIso: '00:00', hourLabel: '00:00', tempC: 21.4, humidityPct: 28, windKmh: 11, solarWm2: 0, et0MmHr: 0.08 },
    { timeIso: '03:00', hourLabel: '03:00', tempC: 18.8, humidityPct: 33, windKmh: 9, solarWm2: 0, et0MmHr: 0.05 },
    { timeIso: '06:00', hourLabel: '06:00', tempC: 20.1, humidityPct: 30, windKmh: 12, solarWm2: 140, et0MmHr: 0.14 },
    { timeIso: '09:00', hourLabel: '09:00', tempC: 29.6, humidityPct: 19, windKmh: 19, solarWm2: 610, et0MmHr: 0.48 },
    { timeIso: '12:00', hourLabel: '12:00', tempC: 37.8, humidityPct: 13, windKmh: 26, solarWm2: 915, et0MmHr: 0.84 },
    { timeIso: '15:00', hourLabel: '15:00', tempC: 40.4, humidityPct: 11, windKmh: 31, solarWm2: 780, et0MmHr: 0.89 },
    { timeIso: '18:00', hourLabel: '18:00', tempC: 32.5, humidityPct: 16, windKmh: 22, solarWm2: 120, et0MmHr: 0.36 },
    { timeIso: '21:00', hourLabel: '21:00', tempC: 25.2, humidityPct: 24, windKmh: 14, solarWm2: 0, et0MmHr: 0.12 },
  ];

  return {
    latitude: OWAINAT_CENTER.lat,
    longitude: OWAINAT_CENTER.lng,
    source: 'climatology-fallback',
    fetchedAt: new Date().toISOString(),
    currentTempC: 36.2,
    currentWindKmh: 24,
    currentHumidityPct: 14,
    currentSolarWm2: 865,
    dailyMaxTempC: 40.4,
    dailyMinTempC: 18.8,
    hourly: hours,
  };
}

export async function fetchOwainatWeather(): Promise<WeatherForecast> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 4500);

  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${OWAINAT_CENTER.lat}&longitude=${OWAINAT_CENTER.lng}` +
      `&current=temperature_2m,relative_humidity_2m,wind_speed_10m,shortwave_radiation` +
      `&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,shortwave_radiation,et0_fao_evapotranspiration` +
      `&daily=temperature_2m_max,temperature_2m_min&timezone=Africa%2FCairo&forecast_days=1`;

    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      throw new Error(`Open-Meteo HTTP ${res.status}`);
    }
    const data = await res.json();

    const times: string[] = data?.hourly?.time ?? [];
    const temps: number[] = data?.hourly?.temperature_2m ?? [];
    const rhs: number[] = data?.hourly?.relative_humidity_2m ?? [];
    const winds: number[] = data?.hourly?.wind_speed_10m ?? [];
    const solars: number[] = data?.hourly?.shortwave_radiation ?? [];
    const et0s: number[] = data?.hourly?.et0_fao_evapotranspiration ?? [];

    const hourly: HourlyWeatherPoint[] = [];
    for (let i = 0; i < times.length; i += 3) {
      const iso = times[i];
      const hourLabel = iso.slice(11, 16) || `${String(i).padStart(2, '0')}:00`;
      hourly.push({
        timeIso: iso,
        hourLabel,
        tempC: Number((temps[i] ?? 28).toFixed(1)),
        humidityPct: Math.round(rhs[i] ?? 18),
        windKmh: Math.round(winds[i] ?? 16),
        solarWm2: Math.round(solars[i] ?? 0),
        et0MmHr: Number((et0s[i] ?? 0.3).toFixed(2)),
      });
    }

    return {
      latitude: OWAINAT_CENTER.lat,
      longitude: OWAINAT_CENTER.lng,
      source: 'open-meteo',
      fetchedAt: new Date().toISOString(),
      currentTempC: Number((data?.current?.temperature_2m ?? 34.0).toFixed(1)),
      currentWindKmh: Math.round(data?.current?.wind_speed_10m ?? 18),
      currentHumidityPct: Math.round(data?.current?.relative_humidity_2m ?? 16),
      currentSolarWm2: Math.round(data?.current?.shortwave_radiation ?? 640),
      dailyMaxTempC: Number((data?.daily?.temperature_2m_max?.[0] ?? 38.5).toFixed(1)),
      dailyMinTempC: Number((data?.daily?.temperature_2m_min?.[0] ?? 18.2).toFixed(1)),
      hourly: hourly.length > 0 ? hourly : buildClimatologyFallback().hourly,
    };
  } catch {
    return buildClimatologyFallback();
  } finally {
    window.clearTimeout(timer);
  }
}
