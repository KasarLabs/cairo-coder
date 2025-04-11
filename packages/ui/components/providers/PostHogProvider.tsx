'use client';

import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import { useEffect } from 'react';

export default function PostHogProviderClient({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;

    if (!posthogKey || !posthogHost) {
      console.log('PostHog credentials missing, rendering without PostHog');
      return;
    }

    posthog.init(posthogKey, {
      api_host: posthogHost,
      session_recording: {
        recordCrossOriginIframes: true,
      },
      capture_pageleave: false,
    });
  }, []);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
