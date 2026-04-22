import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

// База данных хранит время в UTC, а интерфейс должен показывать московское
export const MOSCOW_TZ = 'Europe/Moscow';

export const toMoscowTime = (date) => {
  if (!date) return null;
  return dayjs.utc(date).tz(MOSCOW_TZ);
};

export const formatMoscowDate = (date, format = 'DD.MM.YYYY') => {
  const moscowTime = toMoscowTime(date);
  return moscowTime ? moscowTime.format(format) : '—';
};

export const formatMoscowTime = (date, format = 'HH:mm:ss') => {
  const moscowTime = toMoscowTime(date);
  return moscowTime ? moscowTime.format(format) : '—';
};

export const formatMoscowDateTime = (date, format = 'DD.MM.YYYY HH:mm') => {
  const moscowTime = toMoscowTime(date);
  return moscowTime ? moscowTime.format(format) : '—';
};

export const getCurrentMoscowISO = () => {
  return dayjs().tz(MOSCOW_TZ).toISOString();
};

// Сравнение в UTC обязательно — иначе из-за разницы часовых поясов длительность искажается
export const calculateSessionCost = (startTime, endTime, pricePerHour) => {
  if (!startTime || !endTime || !pricePerHour) return 0;

  const start = dayjs.utc(startTime);
  const end = dayjs.utc(endTime);
  const durationMinutes = end.diff(start, 'minute', true);
  const pricePerMinute = pricePerHour / 60;

  return Math.ceil(durationMinutes * pricePerMinute);
};