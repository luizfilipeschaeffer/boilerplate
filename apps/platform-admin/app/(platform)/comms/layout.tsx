import type { ReactNode } from "react";

export default function CommsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="-mx-4 -mt-4 -mb-4 flex min-h-0 flex-1 flex-col overflow-hidden md:-mx-6 md:-mt-6 md:-mb-6">
      {children}
    </div>
  );
}
