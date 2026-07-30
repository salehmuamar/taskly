export const statusBadgeStyles: Record<string, { bg: string; text: string }> = {
  TODO: { bg: 'rgba(148,163,184,0.15)', text: '#94a3b8' },
  IN_PROGRESS: { bg: 'rgba(96,165,250,0.15)', text: '#93c5fd' },
  IN_REVIEW: { bg: 'rgba(251,191,36,0.15)', text: '#fde047' },
  DONE: { bg: 'rgba(52,211,153,0.15)', text: '#6ee7b7' },
  CANCELLED: { bg: 'rgba(248,113,113,0.15)', text: '#fca5a5' },
  PLANNING: { bg: 'rgba(148,163,184,0.15)', text: '#94a3b8' },
  ACTIVE: { bg: 'rgba(52,211,153,0.15)', text: '#6ee7b7' },
  ON_HOLD: { bg: 'rgba(251,191,36,0.15)', text: '#fde047' },
  COMPLETED: { bg: 'rgba(96,165,250,0.15)', text: '#93c5fd' },
  ARCHIVED: { bg: 'rgba(148,163,184,0.10)', text: '#64748b' },
};

export const priorityBadgeStyles: Record<string, { bg: string; text: string }> = {
  URGENT: { bg: 'rgba(239,68,68,0.15)', text: '#fca5a5' },
  HIGH: { bg: 'rgba(249,115,22,0.15)', text: '#fdba74' },
  MEDIUM: { bg: 'rgba(234,179,8,0.15)', text: '#fde047' },
  LOW: { bg: 'rgba(34,197,94,0.15)', text: '#86efac' },
};

export const statusColors: Record<string, string> = {
  TODO: 'bg-gray-100 text-gray-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  IN_REVIEW: 'bg-yellow-100 text-yellow-700',
  DONE: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
  PLANNING: 'bg-gray-100 text-gray-700',
  ACTIVE: 'bg-green-100 text-green-700',
  ON_HOLD: 'bg-yellow-100 text-yellow-700',
  COMPLETED: 'bg-blue-100 text-blue-700',
  ARCHIVED: 'bg-gray-100 text-gray-500',
};

export const priorityColors: Record<string, string> = {
  URGENT: 'bg-red-100 text-red-700',
  HIGH: 'bg-orange-100 text-orange-700',
  MEDIUM: 'bg-yellow-100 text-yellow-700',
  LOW: 'bg-green-100 text-green-700',
};

export const statusDots: Record<string, string> = {
  TODO: 'bg-gray-400',
  IN_PROGRESS: 'bg-blue-500',
  IN_REVIEW: 'bg-yellow-500',
  DONE: 'bg-green-500',
  CANCELLED: 'bg-red-500',
};

export const priorityDots: Record<string, string> = {
  URGENT: 'bg-red-500',
  HIGH: 'bg-orange-500',
  MEDIUM: 'bg-yellow-500',
  LOW: 'bg-green-500',
};
