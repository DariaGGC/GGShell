import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

// Московский часовой пояс
export const MOSCOW_TZ = 'Europe/Moscow';

// Преобразование UTC -> Москва
export const toMoscowTime = (date) => {
  if (!date) return null;
  return dayjs.utc(date).tz(MOSCOW_TZ);
};

// Форматирование даты в московском времени
export const formatMoscowDate = (date, format = 'DD.MM.YYYY') => {
  const moscowTime = toMoscowTime(date);
  return moscowTime ? moscowTime.format(format) : '—';
};

// Форматирование времени
export const formatMoscowTime = (date, format = 'HH:mm:ss') => {
  const moscowTime = toMoscowTime(date);
  return moscowTime ? moscowTime.format(format) : '—';
};

// Форматирование даты и времени
export const formatMoscowDateTime = (date, format = 'DD.MM.YYYY HH:mm') => {
  const moscowTime = toMoscowTime(date);
  return moscowTime ? moscowTime.format(format) : '—';
};

// Получить текущее московское время в ISO формате
export const getCurrentMoscowISO = () => {
  return dayjs().tz(MOSCOW_TZ).toISOString();
};

// Рассчитать стоимость сессии
export const calculateSessionCost = (startTime, endTime, pricePerHour) => {
  if (!startTime || !endTime || !pricePerHour) {
    console.warn('calculateSessionCost: missing params', { startTime, endTime, pricePerHour });
    return 0;
  }
  
  // ВАЖНО: Оба времени в UTC, сравниваем их напрямую без конвертации
  const start = dayjs.utc(startTime);
  const end = dayjs.utc(endTime);
  
  // Разница в минутах
  const durationMinutes = end.diff(start, 'minute', true);
  
  // Стоимость за минуту
  const pricePerMinute = pricePerHour / 60;
  
  // Итоговая стоимость
  const totalCost = Math.ceil(durationMinutes * pricePerMinute);
  
  console.log('📊 Расчёт стоимости (UTC):', {
    startUTC: start.format(),
    endUTC: end.format(),
    durationMinutes: durationMinutes.toFixed(2),
    pricePerHour,
    pricePerMinute: pricePerMinute.toFixed(2),
    totalCost
  });
  
  return totalCost;
};