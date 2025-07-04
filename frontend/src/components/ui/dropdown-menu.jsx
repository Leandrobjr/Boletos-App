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
      className="absolute z-50 mt-2 min-w-[10rem] rounded-md border bg-white shadow-lg focus:outline-none"
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
      className={`w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      role="menuitem"
    >
      {children}
    </button>
  );
} 