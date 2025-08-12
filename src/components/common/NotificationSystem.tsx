import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Info, X, AlertCircle } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    duration?: number;
    persistent?: boolean;
    actions?: Array<{
        label: string;
        onClick: () => void;
        variant?: 'primary' | 'secondary';
    }>;
}

interface NotificationContextType {
    notifications: Notification[];
    addNotification: (notification: Omit<Notification, 'id'>) => string;
    removeNotification: (id: string) => void;
    clearAll: () => void;
    updateNotification: (id: string, updates: Partial<Notification>) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
        const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newNotification = { ...notification, id };
        
        setNotifications(prev => [...prev, newNotification]);
        
        if (!notification.persistent && notification.duration !== 0) {
            setTimeout(() => {
                removeNotification(id);
            }, notification.duration || 5000);
        }
        
        return id;
    }, []);

    const removeNotification = useCallback((id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    const clearAll = useCallback(() => {
        setNotifications([]);
    }, []);

    const updateNotification = useCallback((id: string, updates: Partial<Notification>) => {
        setNotifications(prev => prev.map(n => 
            n.id === id ? { ...n, ...updates } : n
        ));
    }, []);

    return (
        <NotificationContext.Provider value={{
            notifications,
            addNotification,
            removeNotification,
            clearAll,
            updateNotification
        }}>
            {children}
            <NotificationContainer />
        </NotificationContext.Provider>
    );
}

function NotificationContainer() {
    const { notifications, removeNotification } = useNotifications();

    return (
        <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
            {notifications.map(notification => (
                <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onClose={() => removeNotification(notification.id)}
                />
            ))}
        </div>
    );
}

function NotificationItem({ notification, onClose }: { 
    notification: Notification; 
    onClose: () => void; 
}) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), 50);
        return () => clearTimeout(timer);
    }, []);

    const getIcon = () => {
        switch (notification.type) {
            case 'success': return <CheckCircle className="h-5 w-5 text-green-600" />;
            case 'error': return <AlertCircle className="h-5 w-5 text-red-600" />;
            case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
            case 'info': return <Info className="h-5 w-5 text-blue-600" />;
        }
    };

    const getBackgroundColor = () => {
        switch (notification.type) {
            case 'success': return 'bg-green-50 border-green-200';
            case 'error': return 'bg-red-50 border-red-200';
            case 'warning': return 'bg-yellow-50 border-yellow-200';
            case 'info': return 'bg-blue-50 border-blue-200';
        }
    };

    const getTextColor = () => {
        switch (notification.type) {
            case 'success': return 'text-green-800';
            case 'error': return 'text-red-800';
            case 'warning': return 'text-yellow-800';
            case 'info': return 'text-blue-800';
        }
    };

    return (
        <div className={`
            w-full border rounded-lg p-4 shadow-lg transition-all duration-300 transform
            ${getBackgroundColor()}
            ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        `}>
            <div className="flex items-start">
                <div className="flex-shrink-0">
                    {getIcon()}
                </div>
                <div className="ml-3 flex-1">
                    <h3 className={`text-sm font-medium ${getTextColor()}`}>
                        {notification.title}
                    </h3>
                    <p className={`mt-1 text-sm ${getTextColor()} opacity-90`}>
                        {notification.message}
                    </p>
                    
                    {notification.actions && notification.actions.length > 0 && (
                        <div className="mt-3 flex space-x-2">
                            {notification.actions.map((action, index) => (
                                <button
                                    key={index}
                                    onClick={action.onClick}
                                    className={`
                                        px-3 py-1 text-xs font-medium rounded transition-colors
                                        ${action.variant === 'primary' 
                                            ? 'bg-blue-600 text-white hover:bg-blue-700' 
                                            : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                                        }
                                    `}
                                >
                                    {action.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <div className="ml-4 flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within NotificationProvider');
    }
    return context;
}
