import { AlertTriangle, Info, CheckCircle, XCircle } from '@/components/icons';
import { cn } from '@/lib/utils';

interface AlertProps {
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  className?: string;
}

const icons = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
};

const styles = {
  info: 'bg-blue-50 text-blue-800 border-blue-200',
  success: 'bg-green-50 text-green-800 border-green-200',
  warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
  error: 'bg-red-50 text-red-800 border-red-200',
};

export function Alert({ type, message, className }: AlertProps) {
  const Icon = icons[type];
  return (
    <div className={cn('flex items-center gap-2 rounded-lg border p-3 text-sm', styles[type], className)}>
      <Icon className="h-4 w-4 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
}
