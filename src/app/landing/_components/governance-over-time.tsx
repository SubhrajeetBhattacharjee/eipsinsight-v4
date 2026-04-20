'use client';

import React from 'react';
import { PageHeader } from '@/components/header';
import { GovernanceOverTimeShared } from '@/components/governance-over-time-shared';

export default function GovernanceOverTime() {
  return (
    <>
      <PageHeader
        indicator={{ icon: 'chart', label: 'Analytics' }}
        title="Governance Over Time"
        description="How Ethereum proposals have evolved across categories and lifecycle stages since inception."
        sectionId="governance-over-time"
        className="bg-slate-100/40 dark:bg-slate-950/30"
      />
      <GovernanceOverTimeShared
        sectionClassName="bg-slate-100/40 dark:bg-slate-950/30 pb-8 sm:pb-12 lg:pb-16"
        containerClassName="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8"
        loadingLabel="Loading governance graph..."
      />
    </>
  );
}

