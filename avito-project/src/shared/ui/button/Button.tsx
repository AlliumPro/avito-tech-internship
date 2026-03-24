import type { ButtonHTMLAttributes, PropsWithChildren, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import styles from './Button.module.css';

type ButtonVariant = 'primary' | 'secondary';
type ButtonSize = 'default' | 'edit';

type BaseProps = PropsWithChildren<{
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
  to?: string;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
}>;

type ButtonProps = BaseProps & ButtonHTMLAttributes<HTMLButtonElement>;

const getClassName = (
  variant: ButtonVariant,
  size: ButtonSize,
  fullWidth: boolean,
  className?: string,
): string => {
  const classes = [styles.button, variant === 'primary' ? styles.primary : styles.secondary];

  if (size === 'edit') {
    classes.push(styles.editSize);
  }

  if (fullWidth) {
    classes.push(styles.fullWidth);
  }

  if (className) {
    classes.push(className);
  }

  return classes.join(' ');
};

export function Button({
  variant = 'primary',
  size = 'default',
  fullWidth = false,
  className,
  to,
  startIcon,
  endIcon,
  children,
  type = 'button',
  ...buttonProps
}: ButtonProps) {
  const resolvedClassName = getClassName(variant, size, fullWidth, className);

  const content = (
    <>
      {startIcon && <span className={styles.iconWrap}>{startIcon}</span>}
      <span>{children}</span>
      {endIcon && <span className={styles.iconWrap}>{endIcon}</span>}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={resolvedClassName}>
        {content}
      </Link>
    );
  }

  return (
    <button type={type} className={resolvedClassName} {...buttonProps}>
      {content}
    </button>
  );
}
