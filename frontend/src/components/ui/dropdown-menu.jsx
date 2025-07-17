import * as React from "react";
import ReactDOM from "react-dom";

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

  return (
    <div
      ref={contentRef}
      className={`mt-1 min-w-[5rem] w-max flex flex-col focus:outline-none transition-all duration-200 ease-out ${open ? 'dropdown-expand' : 'dropdown-collapse'}`}
      role="menu"
      style={{
        position: 'static',
        opacity: open ? 1 : 0,
        height: open ? 'auto' : 0,
        overflow: 'hidden',
        pointerEvents: open ? 'auto' : 'none',
        border: 'none',
        boxShadow: 'none',
        padding: 0,
        background: 'none',
      }}
    >
      {open && children}
    </div>
  );
}

export function DropdownMenuItem({ children, onClick, disabled = false }) {
  return (
    <button
      type="button"
      className={`w-full h-5 text-center px-2 py-0 text-[9px] text-red-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      role="menuitem"
      style={{ lineHeight: 1 }}
    >
      {children}
    </button>
  );
} 