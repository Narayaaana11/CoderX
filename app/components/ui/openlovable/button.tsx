import { cloneElement, forwardRef, isValidElement } from 'react';
import { classNames } from '~/utils/classNames';

type ButtonVariant = 'default' | 'ghost' | 'outline';
type ButtonSize = 'default' | 'sm' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: boolean;
}

const variantClass: Record<ButtonVariant, string> = {
  default: 'bg-bolt-elements-button-primary-background text-bolt-elements-button-primary-text hover:brightness-95',
  ghost: 'bg-transparent text-bolt-elements-textPrimary hover:bg-bolt-elements-item-backgroundActive',
  outline:
    'bg-transparent border border-bolt-elements-borderColor text-bolt-elements-textPrimary hover:bg-bolt-elements-item-backgroundActive',
};

const sizeClass: Record<ButtonSize, string> = {
  default: 'h-10 px-4 text-sm',
  sm: 'h-8 px-3 text-xs',
  lg: 'h-11 px-5 text-sm',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'default', size = 'default', type = 'button', asChild = false, children, ...props },
  ref,
) {
  const classes = classNames(
    'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-theme disabled:opacity-50 disabled:cursor-not-allowed',
    variantClass[variant],
    sizeClass[size],
    className,
  );

  if (asChild && isValidElement(children)) {
    const typedChild = children as React.ReactElement<{ className?: string }>;
    const childClassName = typedChild.props.className;

    return cloneElement(typedChild, {
      ...(props as object),
      className: classNames(classes, childClassName),
    });
  }

  return (
    <button ref={ref} type={type} className={classes} {...props}>
      {children}
    </button>
  );
});
