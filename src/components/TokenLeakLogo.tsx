import type { ComponentProps } from "react";

type Props = ComponentProps<"svg"> & {
  title?: string;
};

export function TokenLeakLogo({ title = "TokenLeak", ...props }: Props) {
  return (
    <svg
      viewBox="0 0 32 32"
      width="24"
      height="24"
      role="img"
      aria-label={title}
      {...props}
    >
      <path
        d="M16 2c5.6 0 10 4.4 10 10 0 6.4-7.2 9.9-9.3 17.2-.3 1-1.2 1.8-2.2 1.8s-2-.7-2.2-1.8C10.2 21.9 6 18.4 6 12 6 6.4 10.4 2 16 2Z"
        fill="currentColor"
      />
      <path
        d="M20.5 12.4c0 3-2.1 5.3-4.7 5.3S11.1 15.4 11.1 12.4c0-2.3 1.5-4 3.5-4.7.3-.1.6.3.4.6-.3.5-.5 1.1-.5 1.8 0 1.9 1.3 3.3 3 3.3.9 0 1.7-.4 2.3-1.1.2-.2.6-.1.7.1.1.3 0 .6 0 .9Z"
        fill="white"
        opacity="0.95"
      />
    </svg>
  );
}

