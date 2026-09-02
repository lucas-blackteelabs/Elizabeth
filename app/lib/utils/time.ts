const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const fmtDay = (s: string) => {
  const d = new Date(s);
  return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
};
export const fmtLongDay = (s: string) => {
  const d = new Date(s);
  return `${LONG[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
};
export const fmtTime = (s: string) => {
  const d = new Date(s);
  const h = d.getHours();
  const m = d.getMinutes();
  return `${h % 12 || 12}${m ? ':' + String(m).padStart(2, '0') : ''}${h >= 12 ? 'pm' : 'am'}`;
};
export const dayLabel = (day: string, today: string) => {
  const diff = Math.round((new Date(day).getTime() - new Date(today).getTime()) / 86400000);
  return diff === 0 ? 'Today' : diff === 1 ? 'Tomorrow' : LONG[new Date(day).getDay()];
};
export const greeting = (now: string) => {
  const h = new Date(now).getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};
export const KID_COLOURS = ['#6E56CF', '#1C9AA3', '#E8735A', '#3B8FE0', '#D9518E', '#5C9E31'];
