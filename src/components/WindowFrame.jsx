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
                <WindowControls onClose={() => window.close()} />
                <h2 className="font-bold text-sm text-center flex-1 text-gray-600 dark:text-white font-georama">
                    {title}
                </h2>
                <div className="w-16" /> {/* Spacer for centering */}
            </div>
            <div className="p-6 bg-white dark:bg-[#1e1e1e]">
                {children}
            </div>
        </div>
    );
};

export default WindowFrame;
