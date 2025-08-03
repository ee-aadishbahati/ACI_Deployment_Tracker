export interface WeekPeriod {
  start: Date;
  end: Date;
}

export function getCurrentWednesdayWeek(): WeekPeriod {
  const now = new Date();
  const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  
  let daysToLastWednesday;
  if (currentDay >= 3) {
    daysToLastWednesday = currentDay - 3;
  } else {
    daysToLastWednesday = currentDay + 4; // (7 - 3) + currentDay
  }
  
  const lastWednesday = new Date(now);
  lastWednesday.setDate(now.getDate() - daysToLastWednesday);
  lastWednesday.setHours(0, 0, 0, 0);
  
  const nextTuesday = new Date(lastWednesday);
  nextTuesday.setDate(lastWednesday.getDate() + 6);
  nextTuesday.setHours(23, 59, 59, 999);
  
  return {
    start: lastWednesday,
    end: nextTuesday
  };
}

export function isDateInCurrentWeek(dateString: string): boolean {
  const date = new Date(dateString);
  const currentWeek = getCurrentWednesdayWeek();
  
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
  const week = getCurrentWednesdayWeek();
  const startFormatted = formatCompletionDate(week.start.toISOString());
  const endFormatted = formatCompletionDate(week.end.toISOString());
  
  return `${startFormatted} - ${endFormatted}`;
}
