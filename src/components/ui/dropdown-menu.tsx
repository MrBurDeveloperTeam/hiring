import * as React from 'react';
import { ChevronDown } from 'lucide-react';

interface DropdownMenuContextBooks {
    open: boolean;
    setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const DropdownMenuContext = React.createContext<DropdownMenuContextBooks | undefined>(undefined);

export const DropdownMenu: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [open, setOpen] = React.useState(false);
    const containerRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <DropdownMenuContext.Provider value={{ open, setOpen }}>
            <div className="relative inline-block text-left" ref={containerRef}>
                {children}
            </div>
        </DropdownMenuContext.Provider>
    );
};

export const DropdownMenuTrigger: React.FC<{ asChild?: boolean; children: React.ReactNode; className?: string }> = ({
    asChild,
    children,
    className
}) => {
    const context = React.useContext(DropdownMenuContext);
    if (!context) throw new Error('DropdownMenuTrigger must be used within DropdownMenu');

    const handleClick = (e: React.MouseEvent) => {
        // e.stopPropagation(); // Optional
        context.setOpen(prev => !prev);
    };

    if (asChild && React.isValidElement(children)) {
        return React.cloneElement(children as React.ReactElement<any>, {
            onClick: handleClick,
            // Merge classNames if needed, but simple clone is okay for now
        });
    }

    return (
        <button type="button" onClick={handleClick} className={className}>
            {children}
        </button>
    );
};

export const DropdownMenuContent: React.FC<{
    children: React.ReactNode;
    align?: 'start' | 'end';
    className?: string; // Allow overriding classes
}> = ({ children, align = 'start', className = '' }) => {
    const context = React.useContext(DropdownMenuContext);
    if (!context) throw new Error('DropdownMenuContent must be used within DropdownMenu');

    if (!context.open) return null;

    const alignClass = align === 'end' ? 'right-0' : 'left-0';

    return (
        <div
            className={`absolute ${alignClass} z-50 mt-2 min-w-[8rem] overflow-hidden rounded-md border border-gray-200 bg-white shadow-md animate-in fade-in zoom-in-95 data-[side=bottom]:slide-in-from-top-2 ${className}`}
        >
            <div className="p-1">{children}</div>
        </div>
    );
};

export const DropdownMenuItem: React.FC<{
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
}> = ({ children, onClick, className = '' }) => {
    const context = React.useContext(DropdownMenuContext);
    if (!context) throw new Error('DropdownMenuItem must be used within DropdownMenu');

    const handleClick = () => {
        if (onClick) onClick();
        context.setOpen(false); // Auto-close
    };

    return (
        <div
            onClick={handleClick}
            className={`relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-gray-100 hover:text-gray-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 ${className}`}
        >
            {children}
        </div>
    );
};
