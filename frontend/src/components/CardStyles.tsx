import type { CSSProperties, MouseEvent } from 'react';

export const cardStyles = {
  base: {
    borderRadius: 'var(--radius-lg)',
    transition: 'all var(--motion-duration-base) var(--motion-easing-standard)',
  } as CSSProperties,

  hoverable: {
    cursor: 'pointer',
    position: 'relative' as const,
  } as CSSProperties,

  character: {
    display: 'flex',
    flexDirection: 'column',
    borderColor: 'var(--color-info)',
    borderRadius: 'var(--radius-lg)',
  } as CSSProperties,

  organization: {
    display: 'flex',
    flexDirection: 'column',
    borderColor: 'var(--color-success)',
    backgroundColor: 'var(--color-bg-base)',
    borderRadius: 'var(--radius-lg)',
  } as CSSProperties,

  project: {
    height: '100%',
    borderRadius: 'var(--radius-sm) var(--radius-xl) var(--radius-xl) var(--radius-sm)',
    overflow: 'hidden',
    background: 'var(--color-bg-container)',
    boxShadow: 'var(--shadow-card)',
    transition: 'all var(--motion-duration-base) var(--motion-easing-standard)',
    border: '1px solid var(--color-border-light)',
    borderLeft: '6px solid var(--color-primary)',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
  } as CSSProperties,

  newProjectBook: {
    height: '100%',
    borderRadius: 'var(--radius-sm) var(--radius-xl) var(--radius-xl) var(--radius-sm)',
    overflow: 'hidden',
    background: 'var(--color-bg-container)',
    boxShadow: 'var(--shadow-card)',
    border: '1px solid var(--color-border-light)',
    borderLeft: '6px solid var(--color-primary)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    transition: 'all var(--motion-duration-base) var(--motion-easing-standard)',
    position: 'relative',
  } as CSSProperties,

  bookshelf: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: 'var(--space-lg)',
    padding: 'var(--space-lg) 0',
  } as CSSProperties,

  body: {
    padding: 'var(--space-md)',
    display: 'flex',
    flexDirection: 'column' as const,
  } as CSSProperties,

  description: {
    marginTop: 'var(--space-sm)',
    maxHeight: 200,
    overflow: 'hidden' as const,
  } as CSSProperties,

  ellipsis: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  } as CSSProperties,

  ellipsisMultiline: (lines = 2) =>
    ({
      display: '-webkit-box',
      WebkitLineClamp: lines,
      WebkitBoxOrient: 'vertical' as const,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    }) as CSSProperties,
};

const getHoverShadow = (): string => 'var(--shadow-elevated)';

export const cardHoverHandlers = {
  onMouseEnter: (e: MouseEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    target.style.transform = 'translateY(-4px)';
    target.style.boxShadow = getHoverShadow();
  },
  onMouseLeave: (e: MouseEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    target.style.transform = 'translateY(0)';
    target.style.boxShadow = 'var(--shadow-card)';
  },
};

export const gridConfig = {
  gutter: [16, 16] as [number, number],
  xs: 24,
  sm: 12,
  lg: 8,
  xl: 6,
};

export const characterGridConfig = {
  gutter: 0,
  xs: 24,
  sm: 12,
  md: 12,
  lg: 6,
  xl: 6,
  xxl: 5,
};

export const textStyles = {
  label: {
    fontSize: 'var(--font-size-xs)',
    color: 'var(--color-text-tertiary)',
  } as CSSProperties,

  value: {
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-text-primary)',
  } as CSSProperties,

  description: {
    fontSize: 'var(--font-size-xs)',
    color: 'var(--color-text-tertiary)',
    lineHeight: 1.6,
  } as CSSProperties,
};
