import { Sun, Moon, Monitor } from 'lucide-react';

const ThemeToggle = ({ theme, onThemeChange }) => {
    const themes = [
        { id: 'light', icon: Sun, label: 'Light' },
        { id: 'system', icon: Monitor, label: 'System' },
        { id: 'dark', icon: Moon, label: 'Dark' },
    ];

    return (
        <div className="flex items-center gap-1 p-1 bg-gray-200 dark:bg-zinc-700 rounded-lg">
            {themes.map(({ id, icon: Icon, label }) => (
                <button
                    key={id}
                    onClick={() => onThemeChange(id)}
                    className={`p-2 rounded-md transition-all ${theme === id
                            ? 'bg-white dark:bg-zinc-600 shadow-sm text-gray-900 dark:text-white'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                        }`}
                    title={label}
                >
                    <Icon className="w-4 h-4" />
                </button>
            ))}
        </div>
    );
};

export default ThemeToggle;
