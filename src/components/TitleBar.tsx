type TitleBarProps = {
  isMaximized: boolean;
  onMinimize: () => void;
  onToggleMaximize: () => void;
  onClose: () => void;
};

export function TitleBar({
  isMaximized,
  onMinimize,
  onToggleMaximize,
  onClose,
}: TitleBarProps) {
  return (
    <div className="window-titlebar">
      <div className="window-titlebar-drag" data-tauri-drag-region onDoubleClick={onToggleMaximize}>
        <div className="window-title-group">
          <div className="window-title-icon" aria-hidden="true">
            <img src="/talentiq-icon.svg" alt="" />
          </div>
          <div className="window-title-copy">
            <strong>TalentIQ Desktop</strong>
            <span>AI resume screening workspace</span>
          </div>
        </div>
      </div>

      <div className="window-controls">
        <button type="button" className="window-control-button" onClick={onMinimize} aria-label="Minimize window">
          <span className="window-control-line" />
        </button>
        <button
          type="button"
          className="window-control-button"
          onClick={onToggleMaximize}
          aria-label={isMaximized ? "Restore window" : "Maximize window"}
        >
          <span className={`window-control-square ${isMaximized ? "window-control-square-restored" : ""}`} />
        </button>
        <button type="button" className="window-control-button window-control-close" onClick={onClose} aria-label="Close window">
          <span className="window-control-close-icon">x</span>
        </button>
      </div>
    </div>
  );
}
