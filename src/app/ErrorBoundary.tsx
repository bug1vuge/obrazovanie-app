import { Component, type ErrorInfo, type ReactNode } from 'react';

interface State {
  error: Error | null;
}

/** Last line of defence: shows a friendly screen instead of a blank page. */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled UI error', error, info.componentStack);
  }

  override render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="card max-w-md p-6 text-center">
          <p className="font-display text-lg">Что-то пошло не так</p>
          <p className="muted mt-2 text-sm">
            Обновите страницу. Если ошибка повторяется — сбросьте демо-данные в профиле.
          </p>
          <button
            type="button"
            className="on-primary mt-4 rounded-full bg-primary px-5 py-2.5 text-sm font-medium"
            onClick={() => window.location.reload()}
          >
            Обновить
          </button>
        </div>
      </div>
    );
  }
}
