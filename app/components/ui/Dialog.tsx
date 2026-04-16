import React, { cloneElement, createContext, memo, useContext, type ReactNode } from 'react';
import { classNames } from '~/utils/classNames';
import { IconButton } from './IconButton';

const DialogOpenContext = createContext(false);

interface DialogRootProps {
  open: boolean;
  children: ReactNode;
}

export const DialogRoot = memo(({ open, children }: DialogRootProps) => {
  return <DialogOpenContext.Provider value={open}>{children}</DialogOpenContext.Provider>;
});

interface DialogCloseProps {
  children: React.ReactElement;
  onClick?: (event: React.UIEvent) => void;
}

export const DialogClose = memo(({ children, onClick }: DialogCloseProps) => {
  const childOnClick = (children.props as { onClick?: (event: React.UIEvent) => void }).onClick;

  return cloneElement(children, {
    onClick: (event: React.UIEvent) => {
      childOnClick?.(event);
      onClick?.(event);
    },
  });
});

interface DialogButtonProps {
  type: 'primary' | 'secondary' | 'danger';
  children: ReactNode;
  onClick?: (event: React.UIEvent) => void;
}

export const DialogButton = memo(({ type, children, onClick }: DialogButtonProps) => {
  return (
    <button
      className={classNames(
        'inline-flex h-[35px] items-center justify-center rounded-lg px-4 text-sm leading-none focus:outline-none',
        {
          'bg-bolt-elements-button-primary-background text-bolt-elements-button-primary-text hover:bg-bolt-elements-button-primary-backgroundHover':
            type === 'primary',
          'bg-bolt-elements-button-secondary-background text-bolt-elements-button-secondary-text hover:bg-bolt-elements-button-secondary-backgroundHover':
            type === 'secondary',
          'bg-bolt-elements-button-danger-background text-bolt-elements-button-danger-text hover:bg-bolt-elements-button-danger-backgroundHover':
            type === 'danger',
        },
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
});

export const DialogTitle = memo(({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={classNames(
        'px-5 py-4 flex items-center justify-between border-b border-bolt-elements-borderColor text-lg font-semibold leading-6 text-bolt-elements-textPrimary',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
});

interface DialogDescriptionProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
}

export const DialogDescription = memo(({ className, children, asChild = false, ...props }: DialogDescriptionProps) => {
  if (asChild && React.isValidElement(children)) {
    const typedChild = children as React.ReactElement<{ className?: string }>;

    return cloneElement(typedChild, {
      ...props,
      className: classNames('px-5 py-4 text-bolt-elements-textPrimary text-md', className, typedChild.props.className),
    });
  }

  return (
    <div className={classNames('px-5 py-4 text-bolt-elements-textPrimary text-md', className)} {...props}>
      {children}
    </div>
  );
});

interface DialogProps {
  children: ReactNode | ReactNode[];
  className?: string;
  onBackdrop?: (event: React.UIEvent) => void;
  onClose?: (event: React.UIEvent) => void;
}

export const Dialog = memo(({ className, children, onBackdrop, onClose }: DialogProps) => {
  const open = useContext(DialogOpenContext);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-max">
      <div className="bg-black/50 fixed inset-0 z-max" onClick={onBackdrop} />
      <div
        role="dialog"
        aria-modal="true"
        className={classNames(
          'fixed top-[50%] left-[50%] z-max max-h-[85vh] w-[90vw] max-w-[450px] translate-x-[-50%] translate-y-[-50%] border border-bolt-elements-borderColor rounded-lg bg-bolt-elements-background-depth-2 shadow-lg focus:outline-none overflow-hidden',
          className,
        )}
      >
        {children}
        <IconButton icon="i-ph:x" className="absolute top-[10px] right-[10px]" onClick={onClose} />
      </div>
    </div>
  );
});
