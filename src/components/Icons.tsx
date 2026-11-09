import type { ReactNode, SVGProps } from 'react';

export type IconName =
  | 'sparkles'
  | 'shield'
  | 'lock'
  | 'trash'
  | 'check'
  | 'arrowRight'
  | 'arrowUp'
  | 'arrowDown'
  | 'upload'
  | 'fileText'
  | 'mail'
  | 'download'
  | 'key'
  | 'eye'
  | 'eyeOff'
  | 'alert'
  | 'x'
  | 'chevronDown'
  | 'external'
  | 'server'
  | 'spinner'
  | 'info'
  | 'user'
  | 'link'
  | 'refresh'
  | 'plus';

const ICONS: Record<IconName, ReactNode> = {
  sparkles: (
    <>
      <path d="M12 3.2l1.7 4.3 4.3 1.7-4.3 1.7L12 15.2l-1.7-4.3L6 9.2l4.3-1.7L12 3.2Z" />
      <path d="M18.2 15.2l.8 2.1 2.1.8-2.1.8-.8 2.1-.8-2.1-2.1-.8 2.1-.8.8-2.1Z" />
    </>
  ),
  shield: <path d="M12 3.2l7 3v5.2c0 4.3-2.9 7.3-7 9.4-4.1-2.1-7-5.1-7-9.4V6.2l7-3Z" />,
  lock: (
    <>
      <rect x="4.5" y="10" width="15" height="10.5" rx="2.2" />
      <path d="M8.2 10V7.4a3.8 3.8 0 0 1 7.6 0V10" />
      <path d="M12 14.3v2.4" />
    </>
  ),
  trash: (
    <>
      <path d="M4 7h16" />
      <path d="M9.2 7V4.8h5.6V7" />
      <path d="M6.4 7l.9 12.2h9.4L17.6 7" />
      <path d="M10.2 11v4.6M13.8 11v4.6" />
    </>
  ),
  check: <path d="M4.8 12.4l4.3 4.2L19.2 6.4" />,
  arrowRight: (
    <>
      <path d="M4.5 12h15" />
      <path d="M13.5 6l6 6-6 6" />
    </>
  ),
  arrowUp: (
    <>
      <path d="M12 19.5v-15" />
      <path d="M6 10.5l6-6 6 6" />
    </>
  ),
  arrowDown: (
    <>
      <path d="M12 4.5v15" />
      <path d="M6 13.5l6 6 6-6" />
    </>
  ),
  upload: (
    <>
      <path d="M12 16.5V4.2" />
      <path d="M7 9.2l5-5 5 5" />
      <path d="M4.2 16.2v3.1a1.5 1.5 0 0 0 1.5 1.5h12.6a1.5 1.5 0 0 0 1.5-1.5v-3.1" />
    </>
  ),
  fileText: (
    <>
      <path d="M14 3.5H7.2A1.2 1.2 0 0 0 6 4.7v14.6a1.2 1.2 0 0 0 1.2 1.2h9.6a1.2 1.2 0 0 0 1.2-1.2V7l-4-3.5Z" />
      <path d="M14 3.5V7h4" />
      <path d="M9 12h6M9 15.2h6M9 8.8h1.8" />
    </>
  ),
  mail: (
    <>
      <rect x="3.2" y="5.2" width="17.6" height="13.6" rx="2.2" />
      <path d="M3.8 6.8L12 12.8l8.2-6" />
    </>
  ),
  download: (
    <>
      <path d="M12 3.8v11.8" />
      <path d="M7.2 10.8l4.8 4.8 4.8-4.8" />
      <path d="M4.2 20.2h15.6" />
    </>
  ),
  key: (
    <>
      <circle cx="8" cy="8" r="4.2" />
      <path d="M11 11l8.6 8.6" />
      <path d="M15.6 15.6l2-2M18.2 18.2l2-2" />
    </>
  ),
  eye: (
    <>
      <path d="M2.6 12S6 6.2 12 6.2 21.4 12 21.4 12 18 17.8 12 17.8 2.6 12 2.6 12Z" />
      <circle cx="12" cy="12" r="2.9" />
    </>
  ),
  eyeOff: (
    <>
      <path d="M3.2 3.8l17 16.4" />
      <path d="M9.7 6.6A9.9 9.9 0 0 1 12 6.2c6 0 9.4 5.8 9.4 5.8a16.2 16.2 0 0 1-2.6 3.3" />
      <path d="M6.3 8.1A16.3 16.3 0 0 0 2.6 12S6 17.8 12 17.8a9.7 9.7 0 0 0 4.1-.9" />
    </>
  ),
  alert: (
    <>
      <path d="M12 3.8L21 19.6H3L12 3.8Z" />
      <path d="M12 9.2v4.2" />
      <circle cx="12" cy="16.5" r="0.6" fill="currentColor" stroke="none" />
    </>
  ),
  x: (
    <>
      <path d="M6 6l12 12" />
      <path d="M18 6L6 18" />
    </>
  ),
  chevronDown: <path d="M6 9.4l6 6 6-6" />,
  external: (
    <>
      <path d="M13.8 4.2H19.8V10.2" />
      <path d="M19.8 4.2L10.6 13.4" />
      <path d="M17.2 13.8v4.9a1.3 1.3 0 0 1-1.3 1.3H4.7a1.3 1.3 0 0 1-1.3-1.3V7.5a1.3 1.3 0 0 1 1.3-1.3h4.9" />
    </>
  ),
  server: (
    <>
      <rect x="3.4" y="4.2" width="17.2" height="6.2" rx="1.6" />
      <rect x="3.4" y="13.6" width="17.2" height="6.2" rx="1.6" />
      <path d="M7 7.3h.01M7 16.7h.01" />
    </>
  ),
  spinner: <path d="M12 3a9 9 0 1 0 9 9" />,
  info: (
    <>
      <circle cx="12" cy="12" r="8.8" />
      <path d="M12 10.8v5.2" />
      <circle cx="12" cy="7.9" r="0.6" fill="currentColor" stroke="none" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8.2" r="3.6" />
      <path d="M4.8 20.2c.8-3.4 3.6-5.2 7.2-5.2s6.4 1.8 7.2 5.2" />
    </>
  ),
  link: (
    <>
      <path d="M10.2 13.8a4.2 4.2 0 0 0 6 0l2.2-2.2a4.2 4.2 0 0 0-6-6l-1.2 1.2" />
      <path d="M13.8 10.2a4.2 4.2 0 0 0-6 0l-2.2 2.2a4.2 4.2 0 0 0 6 6l1.2-1.2" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 11.2A8.2 8.2 0 0 0 5.8 6.1L3.8 8" />
      <path d="M3.8 3.8V8h4.2" />
      <path d="M4 12.8a8.2 8.2 0 0 0 14.2 5.1l2-1.9" />
      <path d="M20.2 20.2V16h-4.2" />
    </>
  ),
  plus: (
    <>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </>
  ),
};

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName;
}

export function Icon({ name, className = 'h-4 w-4', ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      {...props}
    >
      {ICONS[name]}
    </svg>
  );
}
