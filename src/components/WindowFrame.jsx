const WindowControls = ({ onClose }) => {
    return (
        <div id="window-controls">
            <div className="close" onClick={onClose} title="Close" />
            <div className="minimize" onClick={onClose} title="Minimize" />
            <div className="maximize" title="Maximize" />
        </div>
    );
};

const WindowFrame = ({ children, title = "R2 Uploader" }) => {
    return (
        <div className="window w-full max-w-4xl mx-auto">
            <div id="window-header">
                {/* Window controls hidden on mobile */}
                <div className="hidden sm:block">
                    <WindowControls onClose={() => window.close()} />
                </div>
                <h2 className="font-bold text-sm text-center flex-1 text-gray-600 dark:text-white font-georama">
                    {title}
                </h2>
                <div className="w-16 hidden sm:block" /> {/* Spacer for centering */}
            </div>
            <div className="flex-1 bg-white dark:bg-[#1e1e1e] overflow-y-auto max-h-[70vh] sm:max-h-[600px] custom-scrollbar">
                <div className="p-4 sm:p-6">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default WindowFrame;
