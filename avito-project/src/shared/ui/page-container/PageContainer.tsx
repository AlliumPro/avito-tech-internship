import type { PropsWithChildren } from 'react';

type PageContainerProps = PropsWithChildren<{
  title: string;
}>;

export function PageContainer({ title, children }: PageContainerProps) {
  return (
    <main>
      <h1>{title}</h1>
      <section>{children}</section>
    </main>
  );
}
