export interface WeekPeriod {
  start: Date;
  end: Date;
}

export function getCurrentTuesdayWeek(): WeekPeriod {
  const now = new Date();
  const currentDay = now.getDay();
  
  let daysToLastTuesday = currentDay - 2;
  if (daysToLastTuesday < 0) {
    daysToLastTuesday += 7;
  }
  
  const lastTuesday = new Date(now);
  lastTuesday.setDate(now.getDate() - daysToLastTuesday);
  lastTuesday.setHours(0, 0, 0, 0);
  
  const nextMonday = new Date(lastTuesday);
  nextMonday.setDate(lastTuesday.getDate() + 6);
  nextMonday.setHours(23, 59, 59, 999);
  
  return {
    start: lastTuesday,
    end: nextMonday
  };
}

export function isDateInCurrentWeek(dateString: string): boolean {
  const date = new Date(dateString);
  const currentWeek = getCurrentTuesdayWeek();
  
  return date >= currentWeek.start && date <= currentWeek.end;
}

export function formatCompletionDate(dateString: string): string {
  const date = new Date(dateString);
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  
  const day = date.getDate().toString().padStart(2, '0');
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  
  return `${day} ${month} ${year}`;
}

export function formatWeekRange(): string {
  const week = getCurrentTuesdayWeek();
  const startFormatted = formatCompletionDate(week.start.toISOString());
  const endFormatted = formatCompletionDate(week.end.toISOString());
  
  return `${startFormatted} - ${endFormatted}`;
}
