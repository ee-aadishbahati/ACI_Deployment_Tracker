import { Component, ErrorInfo, ReactNode } from 'react';
import { ErrorHandler, ErrorType } from '../../utils/ErrorHandler';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
    hasError: boolean;
    error?: Error;
    errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        const appError = ErrorHandler.createError(
            ErrorType.UNKNOWN_ERROR,
            'React component error boundary triggered',
            { 
                errorInfo, 
                componentStack: errorInfo.componentStack,
                errorBoundary: true
            },
            error
        );
        
        ErrorHandler.logError(appError);
        
        this.setState({ errorInfo });
        
        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }
    }

    private handleRetry = () => {
        this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    };

    private handleRefresh = () => {
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            return this.props.fallback || (
                <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                    <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
                        <div className="text-red-600 text-center mb-4">
                            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900 text-center mb-4">
                            Something went wrong
                        </h2>
                        <p className="text-gray-600 text-center mb-6">
                            The application encountered an unexpected error. Please try refreshing the page or contact support if the problem persists.
                        </p>
                        
                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm">
                                <details>
                                    <summary className="cursor-pointer font-medium text-red-800">
                                        Error Details (Development)
                                    </summary>
                                    <div className="mt-2 text-red-700">
                                        <p className="font-medium">{this.state.error.message}</p>
                                        {this.state.error.stack && (
                                            <pre className="mt-2 text-xs overflow-auto">
                                                {this.state.error.stack}
                                            </pre>
                                        )}
                                    </div>
                                </details>
                            </div>
                        )}
                        
                        <div className="flex space-x-3">
                            <button
                                onClick={this.handleRetry}
                                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                            >
                                Try Again
                            </button>
                            <button
                                onClick={this.handleRefresh}
                                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
                            >
                                Refresh Page
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
