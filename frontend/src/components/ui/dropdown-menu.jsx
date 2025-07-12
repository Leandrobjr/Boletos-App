import * as React from "react";

const DropdownMenuContext = React.createContext();

export function DropdownMenu({ children }) {
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef(null);
  const contentRef = React.useRef(null);

  const value = React.useMemo(
    () => ({ open, setOpen, triggerRef, contentRef }),
    [open]
  );

  return (
    <DropdownMenuContext.Provider value={value}>
      <div className="relative inline-block">{children}</div>
    </DropdownMenuContext.Provider>
  );
}

export function DropdownMenuTrigger({ asChild = false, children }) {
  const { open, setOpen, triggerRef } = React.useContext(DropdownMenuContext);
  const child = React.Children.only(children);
  return React.cloneElement(child, {
    ref: triggerRef,
    onClick: (e) => {
      setOpen(!open);
      if (child.props.onClick) child.props.onClick(e);
    },
    'aria-haspopup': 'menu',
    'aria-expanded': open,
  });
}

export function DropdownMenuContent({ children }) {
  const { open, setOpen, triggerRef, contentRef } = React.useContext(DropdownMenuContext);
  React.useEffect(() => {
    function handleClickOutside(event) {
      if (
        contentRef.current &&
        !contentRef.current.contains(event.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open, setOpen, contentRef, triggerRef]);

  if (!open) return null;
  return (
    <div
      ref={contentRef}
      className="absolute z-[9999] mt-2 min-w-[7rem] max-w-[7.5rem] rounded-xl border border-gray-200 bg-white shadow-2xl focus:outline-none p-1.5 right-0"
      role="menu"
    >
      {children}
    </div>
  );
}

export function DropdownMenuItem({ children, onClick, disabled = false }) {
  return (
    <button
      type="button"
      className={`w-full text-center px-2 text-[0.85rem] font-medium border border-gray-200 bg-lime-600 text-white whitespace-normal break-words leading-tight flex items-center justify-center hover:bg-lime-700 focus:bg-lime-700 transition-colors duration-150 rounded-lg focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      role="menuitem"
      style={{ height: '2.1rem', minHeight: '2.1rem', maxHeight: '2.1rem', maxWidth: '7.5rem', whiteSpace: 'normal', textAlign: 'center', overflow: 'hidden' }}
    >
      <span className="block w-full text-center leading-tight break-words whitespace-normal" style={{ fontSize: '0.85rem', lineHeight: '1.1' }}>{children}</span>
    </button>
  );
} 