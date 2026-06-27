'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

const activationCooldown = 900;
const activationSelector = 'button, input[type="button"], input[type="submit"], input[type="reset"], [role="button"]';

const lastElementActivation = new WeakMap<Element, number>();
const lastFormSubmit = new WeakMap<HTMLFormElement, number>();

const shouldBlockElementActivation = (element: Element) => {
  const now = Date.now();
  const lastActivation = lastElementActivation.get(element) ?? 0;
  lastElementActivation.set(element, now);
  return now - lastActivation < activationCooldown;
};

const shouldBlockFormSubmit = (form: HTMLFormElement) => {
  const now = Date.now();
  const lastSubmit = lastFormSubmit.get(form) ?? 0;
  lastFormSubmit.set(form, now);
  return now - lastSubmit < activationCooldown;
};

export const QueryProvider = ({ children }: React.PropsWithChildren) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            gcTime: 300_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;

      const target = event.target instanceof Element ? event.target.closest(activationSelector) : null;
      if (!target || !shouldBlockElementActivation(target)) return;

      event.preventDefault();
      event.stopPropagation();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.isComposing || (event.key !== 'Enter' && event.key !== ' ')) return;

      const targetElement = event.target instanceof Element ? event.target : null;
      const activationTarget = targetElement?.closest(activationSelector);

      if (activationTarget) {
        if (event.repeat) {
          event.preventDefault();
          event.stopPropagation();
        }
        return;
      }

      const form = targetElement?.closest('form');
      if (event.key === 'Enter' && form instanceof HTMLFormElement && event.repeat) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    const onSubmit = (event: SubmitEvent) => {
      if (event.defaultPrevented || !(event.target instanceof HTMLFormElement)) return;

      if (shouldBlockFormSubmit(event.target)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    document.addEventListener('click', onClick, true);
    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('submit', onSubmit, true);

    return () => {
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('keydown', onKeyDown, true);
      document.removeEventListener('submit', onSubmit, true);
    };
  }, []);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};
