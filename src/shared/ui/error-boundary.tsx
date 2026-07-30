'use client';

import { Component, type ReactNode, useContext } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { I18nContext } from '@/i18n';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

const FALLBACK = { somethingWentWrong: 'Something went wrong', unexpectedError: 'An unexpected error occurred. Please try again.', tryAgain: 'Try again' };

function ErrorFallback({ onReset }: { onReset: () => void }) {
  const ctx = useContext(I18nContext);
  const t = ctx?.t ?? ((key: string) => FALLBACK[key as keyof typeof FALLBACK] || key);
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-red-200 bg-red-50 p-8 text-center">
      <AlertTriangle className="h-12 w-12 text-red-500" />
      <h2 className="mt-4 text-lg font-semibold text-gray-900">{t('common.somethingWentWrong')}</h2>
      <p className="mt-2 text-sm text-gray-600">
        {t('common.unexpectedError')}
      </p>
      <Button
        onClick={onReset}
        className="mt-4"
      >
        {t('common.tryAgain')}
      </Button>
    </div>
  );
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback onReset={() => this.setState({ hasError: false, error: null })} />;
    }

    return this.props.children;
  }
}
