'use client';

import React from 'react';
import { GovernanceOverTimeShared } from '@/components/governance-over-time-shared';

export default function GovernanceOverTime() {
  return (
    <GovernanceOverTimeShared
      containerClassName="w-full max-w-full px-0"
      watermark
      loadingLabel="Loading governance graph..."
    />
  );
}

