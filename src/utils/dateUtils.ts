export interface WeekPeriod {
  start: Date;
  end: Date;
}

export function getCurrentWednesdayWeek(): WeekPeriod {
  const now = new Date();
  const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  
  let daysToLastWednesday;
  if (currentDay >= 3) { // Wednesday (3) to Saturday (6)
    daysToLastWednesday = currentDay - 3;
  } else { // Sunday (0) to Tuesday (2)
    daysToLastWednesday = currentDay + 4; // Go back to previous week's Wednesday
  }
  
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - daysToLastWednesday);
  weekStart.setHours(0, 0, 0, 0);
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6); // Add 6 days to get to Tuesday
  weekEnd.setHours(23, 59, 59, 999);
  
  return {
    start: weekStart,
    end: weekEnd
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
