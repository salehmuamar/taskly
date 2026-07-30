interface AvatarProps {
  src?: string | null;
  name?: string;
  className?: string;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function hashColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    'bg-indigo-500', 'bg-violet-500', 'bg-purple-500', 'bg-blue-500',
    'bg-teal-500', 'bg-emerald-500', 'bg-orange-500', 'bg-rose-500',
  ];
  return colors[Math.abs(hash) % colors.length];
}

export function Avatar({ src, name = '', className = '' }: AvatarProps) {
  const sizeClass = className || 'h-8 w-8';

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${sizeClass} rounded-full object-cover ring-2 ring-white dark:ring-slate-900`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} rounded-full flex items-center justify-center text-white text-xs font-semibold ring-2 ring-white dark:ring-slate-900 ${hashColor(name)}`}
      title={name}
    >
      {getInitials(name || '?')}
    </div>
  );
}
