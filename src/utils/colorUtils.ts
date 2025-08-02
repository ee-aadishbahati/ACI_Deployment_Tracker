export type ColorType = 'priority' | 'status' | 'category';
export type PriorityLevel = 'High' | 'Medium' | 'Low';
export type StatusType = 'Pass' | 'Fail' | 'Partial' | 'T.B.E.' | 'Defer' | 'R.I.';
export type CategoryType = 'must-have' | 'should-have' | 'none';

interface ColorMapping {
  text: string;
  bg: string;
  border?: string;
}

const colorMappings: Record<ColorType, Record<string, ColorMapping>> = {
  priority: {
    High: { text: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
    Medium: { text: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' },
    Low: { text: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
    default: { text: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' }
  },
  status: {
    Pass: { text: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
    Fail: { text: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
    Partial: { text: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' },
    'T.B.E.': { text: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    Defer: { text: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
    'R.I.': { text: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
    default: { text: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' }
  },
  category: {
    'must-have': { text: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
    'should-have': { text: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' },
    none: { text: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' },
    default: { text: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' }
  }
};

export function getColorClasses(
  type: ColorType, 
  value?: string, 
  includeBorder: boolean = false
): string {
  const mapping = colorMappings[type];
  const colors = mapping[value || 'default'] || mapping.default;
  
  const classes = [colors.text, colors.bg];
  if (includeBorder && colors.border) {
    classes.push(colors.border);
  }
  
  return classes.join(' ');
}

export function getPriorityColor(priority?: PriorityLevel): string {
  return getColorClasses('priority', priority);
}

export function getStatusColor(status?: StatusType): string {
  return getColorClasses('status', status);
}

export function getCategoryColor(category?: CategoryType, includeBorder: boolean = false): string {
  return getColorClasses('category', category, includeBorder);
}

export function getProgressColor(percentage: number): string {
  if (percentage >= 90) return 'text-green-600 bg-green-50';
  if (percentage >= 70) return 'text-yellow-600 bg-yellow-50';
  if (percentage >= 40) return 'text-orange-600 bg-orange-50';
  return 'text-red-600 bg-red-50';
}
