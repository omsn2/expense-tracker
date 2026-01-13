import { useState, useEffect } from 'react';
import { HiDownload, HiUpload, HiBell, HiCheckCircle } from 'react-icons/hi';

export default function Settings() {
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
    const [restoring, setRestoring] = useState(false);

    useEffect(() => {
        // Check notification permission
        if ('Notification' in window) {
            setNotificationPermission(Notification.permission);
            setNotificationsEnabled(localStorage.getItem('notificationsEnabled') === 'true');
        }
    }, []);

    const handleExport = async (type: string) => {
        try {
            const response = await fetch(`/api/export/${type}/csv`);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${type}_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (e) {
            alert('Failed to export data');
        }
    };

    const handleBackup = async () => {
        try {
            const response = await fetch('/api/backup');
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `finance_backup_${new Date().toISOString().replace(/:/g, '-').split('.')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (e) {
            alert('Failed to create backup');
        }
    };

    const handleRestore = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const confirmed = confirm(
            'This will restore data from the backup file. Do you want to clear existing data first?\n\n' +
            'Click OK to clear existing data, or Cancel to merge with existing data.'
        );

        setRestoring(true);
        try {
            const text = await file.text();
            const backup = JSON.parse(text);

            const response = await fetch('/api/restore', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    data: backup.data,
                    clearExisting: confirmed
                })
            });

            const result = await response.json();
            if (result.success) {
                alert(
                    `Backup restored successfully!\n\n` +
                    `Expenses: ${result.restored.expenses}\n` +
                    `Income: ${result.restored.income}\n` +
                    `Budgets: ${result.restored.budgets}\n` +
                    `Recurring: ${result.restored.recurring}\n` +
                    `Todos: ${result.restored.todos}`
                );
                window.location.reload();
            } else {
                alert('Failed to restore backup');
            }
        } catch (e) {
            alert('Failed to restore backup. Please check the file format.');
        } finally {
            setRestoring(false);
            event.target.value = '';
        }
    };

    const requestNotificationPermission = async () => {
        if (!('Notification' in window)) {
            alert('This browser does not support notifications');
            return;
        }

        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);

        if (permission === 'granted') {
            setNotificationsEnabled(true);
            localStorage.setItem('notificationsEnabled', 'true');

            // Show test notification
            new Notification('Finance Tracker', {
                body: 'Notifications enabled! You\'ll receive reminders for budgets, bills, and todos.',
                icon: '/icon-192.png'
            });

            // Start checking for notifications
            checkNotifications();
        }
    };

    const toggleNotifications = () => {
        if (!notificationsEnabled && notificationPermission !== 'granted') {
            requestNotificationPermission();
        } else {
            const newState = !notificationsEnabled;
            setNotificationsEnabled(newState);
            localStorage.setItem('notificationsEnabled', newState.toString());

            if (newState) {
                checkNotifications();
            }
        }
    };

    const checkNotifications = async () => {
        try {
            const response = await fetch('/api/notifications');
            const data = await response.json();

            if (data.notifications && data.notifications.length > 0) {
                // Show up to 3 notifications
                data.notifications.slice(0, 3).forEach((notif: any, index: number) => {
                    setTimeout(() => {
                        new Notification(notif.title, {
                            body: notif.message,
                            icon: '/icon-192.png',
                            tag: `${notif.type}-${notif.data.id}`,
                            requireInteraction: notif.priority === 'high'
                        });
                    }, index * 1000);
                });
            }
        } catch (e) {
            console.error('Failed to check notifications:', e);
        }
    };

    // Check notifications periodically if enabled
    useEffect(() => {
        if (notificationsEnabled && notificationPermission === 'granted') {
            checkNotifications();
            const interval = setInterval(checkNotifications, 60 * 60 * 1000); // Every hour
            return () => clearInterval(interval);
        }
    }, [notificationsEnabled, notificationPermission]);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
                <p className="text-sm text-gray-500 mt-1">
                    Export data, manage backups, and configure notifications
                </p>
            </div>

            {/* Export Section */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                    <HiDownload className="w-6 h-6 text-blue-600" />
                    <h3 className="text-lg font-semibold">Export Data</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                    Download your data as CSV files for use in Excel, Google Sheets, or other applications.
                </p>
                <div className="grid sm:grid-cols-3 gap-3">
                    <button
                        onClick={() => handleExport('expenses')}
                        className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                        <HiDownload className="w-5 h-5" />
                        Export Expenses
                    </button>
                    <button
                        onClick={() => handleExport('income')}
                        className="bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                    >
                        <HiDownload className="w-5 h-5" />
                        Export Income
                    </button>
                    <button
                        onClick={() => handleExport('budgets')}
                        className="bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                    >
                        <HiDownload className="w-5 h-5" />
                        Export Budgets
                    </button>
                </div>
            </div>

            {/* Backup & Restore Section */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                    <HiUpload className="w-6 h-6 text-orange-600" />
                    <h3 className="text-lg font-semibold">Backup & Restore</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                    Create a complete backup of all your data (expenses, income, budgets, recurring, todos) or restore from a previous backup.
                </p>
                <div className="grid sm:grid-cols-2 gap-3">
                    <button
                        onClick={handleBackup}
                        className="bg-orange-600 text-white px-4 py-3 rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
                    >
                        <HiDownload className="w-5 h-5" />
                        Download Full Backup
                    </button>
                    <label className="bg-gray-600 text-white px-4 py-3 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 cursor-pointer">
                        <HiUpload className="w-5 h-5" />
                        {restoring ? 'Restoring...' : 'Restore from Backup'}
                        <input
                            type="file"
                            accept=".json"
                            onChange={handleRestore}
                            disabled={restoring}
                            className="hidden"
                        />
                    </label>
                </div>
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-xs text-yellow-800">
                        <strong>Note:</strong> Backups include all your financial data. Store them securely and never share them publicly.
                    </p>
                </div>
            </div>

            {/* Notifications Section */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                    <HiBell className="w-6 h-6 text-indigo-600" />
                    <h3 className="text-lg font-semibold">Smart Reminders</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                    Get browser notifications for budget alerts, upcoming bills, and overdue todos.
                </p>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">Enable Notifications</span>
                            {notificationPermission === 'granted' && notificationsEnabled && (
                                <HiCheckCircle className="w-5 h-5 text-green-600" />
                            )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                            {notificationPermission === 'denied'
                                ? 'Notifications blocked. Please enable them in your browser settings.'
                                : notificationPermission === 'granted'
                                    ? 'You\'ll receive reminders for budgets, bills, and todos'
                                    : 'Click to enable browser notifications'}
                        </p>
                    </div>
                    <button
                        onClick={toggleNotifications}
                        disabled={notificationPermission === 'denied'}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notificationsEnabled ? 'bg-blue-600' : 'bg-gray-300'
                            } ${notificationPermission === 'denied' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                                }`}
                        />
                    </button>
                </div>

                {notificationsEnabled && notificationPermission === 'granted' && (
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="font-medium text-blue-900 mb-2">You'll be notified about:</h4>
                        <ul className="text-sm text-blue-800 space-y-1">
                            <li>• Budget alerts when you approach or exceed limits</li>
                            <li>• Upcoming recurring bills (1 day before due)</li>
                            <li>• Overdue or due-today todos</li>
                        </ul>
                        <p className="text-xs text-blue-700 mt-3">
                            Notifications are checked every hour while the app is open.
                        </p>
                    </div>
                )}
            </div>

            {/* App Info */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold mb-3">About</h3>
                <div className="space-y-2 text-sm text-gray-600">
                    <p><strong>Version:</strong> 1.0.0</p>
                    <p><strong>Features:</strong> Budget Management, Recurring Expenses, Income Tracking, Export/Backup, Smart Reminders</p>
                    <p><strong>Storage:</strong> All data is stored locally on your device</p>
                </div>
            </div>
        </div>
    );
}
