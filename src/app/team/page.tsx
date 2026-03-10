'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'motion/react';
import { team } from '@/data/resources/team';
import { grants } from '@/data/resources/grants';
import { partners } from '@/data/resources/partners';
import {
  ArrowRight,
  ExternalLink,
  Github,
  HeartHandshake,
  Linkedin,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Target,
  Twitter,
  Users,
} from 'lucide-react';

const teamAvatarMap: Record<string, string> = {
  'Pooja Ranjan': '/team/pooja_ranjan.jpg',
  'Yash Kamal Chaturvedi': '/team/yash.jpg',
  'Dhanush Naik': '/team/Dhanush.jpg',
  'Ayush Shetty': '/team/ayush.jpg',
};

const teamContext: Record<string, { focus: string; summary: string }> = {
  'Pooja Ranjan': {
    focus: 'Direction and ecosystem relationships',
    summary: 'Connects the product to the needs of Ethereum governance and keeps the project aligned with ecosystem value, not just feature velocity.',
  },
  'Yash Kamal Chaturvedi': {
    focus: 'Operations and execution',
    summary: 'Coordinates programs, cross-functional delivery, and the operational layer that keeps the work moving reliably.',
  },
  'Dhanush Naik': {
    focus: 'Engineering and product implementation',
    summary: 'Builds the application layer, dashboards, interactions, and data-facing systems that shape the day-to-day product experience.',
  },
  'Ayush Shetty': {
    focus: 'Product design systems',
    summary: 'Translates dense governance workflows into structured, readable product surfaces with clearer decision paths.',
  },
};

const partnerLogos: Record<string, string> = {
  EtherWorld: '/brand/partners/ew.png',
  'ECH (Ethereum Cat Herders)': '/brand/partners/ech.png',
};

const grantBadgeColors: Record<string, string> = {
  significant: 'border-emerald-500/40 bg-emerald-500/20 text-emerald-700 dark:text-emerald-300',
  medium: 'border-blue-500/40 bg-blue-500/20 text-blue-700 dark:text-blue-300',
  small: 'border-border bg-muted/40 text-muted-foreground',
};

export default function TeamPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl space-y-12 px-4 py-8 sm:px-6 lg:px-8">
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="rounded-xl border border-border bg-card/60 p-6 sm:p-8"
        >
          <div className="mb-3 inline-flex h-7 items-center rounded-full border border-primary/30 bg-primary/10 px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
            Team
          </div>
          <h1 className="dec-title persona-title text-balance text-3xl font-semibold tracking-tight leading-[1.1] sm:text-4xl">
            The people and support structure behind EIPsInsight.
          </h1>
          <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            A small team building operational tooling for Ethereum standards, supported by grants, ecosystem partners, and community-aligned infrastructure.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Team shape</p>
              <p className="mt-2 text-sm leading-relaxed text-foreground">Compact, cross-functional, and product-heavy by design.</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Working style</p>
              <p className="mt-2 text-sm leading-relaxed text-foreground">Tight iteration loops across research, product systems, and engineering.</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Support model</p>
              <p className="mt-2 text-sm leading-relaxed text-foreground">Grant-backed, ecosystem-connected, and community-facing.</p>
            </div>
          </div>
        </motion.section>

        <section className="space-y-5">
          <div className="max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Core Team</p>
            <h2 className="mt-1 dec-title text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              Small team, distinct roles, shared product ownership.
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Each person owns a clear slice of the system, but the work stays tightly connected across strategy, operations, design, and engineering.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {team.map((member, index) => {
              const profile = teamContext[member.name];
              const avatar = member.avatar ?? teamAvatarMap[member.name];
              const initials = member.name.split(' ').map((name) => name[0]).join('');

              return (
                <motion.article
                  key={member.name}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: index * 0.06 }}
                  className="rounded-xl border border-border bg-card/60 p-5 backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-card/80"
                >
                  <div className="flex items-start gap-4">
                    {avatar ? (
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-border bg-muted">
                        <Image src={avatar} alt={member.name} width={64} height={64} className="h-16 w-16 object-cover" />
                      </div>
                    ) : (
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-border bg-primary/10 text-base font-semibold text-primary">
                        {initials}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold text-foreground">{member.name}</h3>
                        <span className="inline-flex h-6 items-center rounded-full border border-border bg-muted/40 px-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          {member.status}
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-medium text-primary">{member.role}</p>
                      <p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {profile?.focus ?? 'Team focus'}
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        {profile?.summary ?? member.bio ?? 'Contributes across the strategy, design, and implementation of EIPsInsight.'}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {member.github && (
                          <a
                            href={`https://github.com/${member.github}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex h-8 items-center gap-2 rounded-lg border border-border bg-card px-3 text-xs font-medium text-foreground transition-all hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
                          >
                            <Github className="h-3.5 w-3.5" />
                            GitHub
                          </a>
                        )}
                        {member.twitter && (
                          <a
                            href={`https://x.com/${member.twitter}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex h-8 items-center gap-2 rounded-lg border border-border bg-card px-3 text-xs font-medium text-foreground transition-all hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
                          >
                            <Twitter className="h-3.5 w-3.5" />
                            X
                          </a>
                        )}
                        <a
                          href={member.linkedin ?? 'https://www.linkedin.com/company/avarch'}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-8 items-center gap-2 rounded-lg border border-border bg-card px-3 text-xs font-medium text-foreground transition-all hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
                        >
                          <Linkedin className="h-3.5 w-3.5" />
                          LinkedIn
                        </a>
                      </div>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="rounded-xl border border-border bg-card/60 p-6">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Grants & Funding</p>
            <h2 className="mt-1 dec-title text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              Support that keeps the platform open, maintained, and improving.
            </h2>
            <div className="mt-5 grid gap-4">
              {grants.map((grant, index) => (
                <motion.article
                  key={grant.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="rounded-lg border border-border bg-muted/20 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="max-w-2xl">
                      <h3 className="text-base font-semibold text-foreground">{grant.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{grant.description}</p>
                    </div>
                    <span className={`inline-flex h-6 items-center rounded-full border px-2.5 text-[10px] font-semibold uppercase tracking-wider ${grantBadgeColors[grant.badge]}`}>
                      {grant.badge}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {grant.tags.map((tag) => (
                      <span key={tag} className="inline-flex h-7 items-center rounded-full border border-border bg-muted/40 px-3 text-[11px] font-medium text-muted-foreground">
                        {tag}
                      </span>
                    ))}
                    {grant.date && (
                      <span className="inline-flex h-7 items-center rounded-full border border-border bg-muted/40 px-3 text-[11px] font-medium text-muted-foreground">
                        {grant.date}
                      </span>
                    )}
                  </div>
                </motion.article>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card/60 p-6">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Partners</p>
            <h2 className="mt-1 dec-title text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              Ecosystem collaborators close to standards work.
            </h2>
            <div className="mt-5 space-y-4">
              {partners.map((partner, index) => (
                <motion.a
                  key={partner.name}
                  href={partner.website}
                  target="_blank"
                  rel="noreferrer"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.06 }}
                  className="group flex items-center gap-4 rounded-lg border border-border bg-muted/20 p-4 transition-all hover:border-primary/40 hover:bg-card/80"
                >
                  {partnerLogos[partner.name] ? (
                    <div className="flex h-12 w-16 items-center justify-center rounded-lg border border-border bg-card">
                      <Image src={partnerLogos[partner.name]} alt={partner.name} width={72} height={32} className="h-8 w-auto object-contain" />
                    </div>
                  ) : (
                    <div className="flex h-12 w-16 items-center justify-center rounded-lg border border-border bg-card text-sm font-semibold text-foreground">
                      {partner.name.slice(0, 2)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-semibold text-foreground transition-colors group-hover:text-primary">{partner.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {partner.name === 'EtherWorld'
                        ? 'Media and ecosystem distribution support around standards and governance.'
                        : 'Operational coordination and standards-process support across the Ethereum ecosystem.'}
                    </p>
                  </div>
                  <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
                </motion.a>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card/60 p-6 sm:p-8">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Work With Us</p>
              <h2 className="mt-1 dec-title text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                Want to support the platform or reach the team?
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                If you want to collaborate, fund infrastructure, send feedback, or just understand how the project is evolving, these are the right entry points.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <a
                href="mailto:dev@avarch.com"
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-4 text-sm font-medium text-primary transition-all hover:bg-primary/15"
              >
                <MessageCircle className="h-4 w-4" />
                Contact
              </a>
              <Link
                href="/donate"
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-medium text-foreground transition-all hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
              >
                <HeartHandshake className="h-4 w-4" />
                Support
              </Link>
              <Link
                href="/about"
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-medium text-foreground transition-all hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
              >
                <ArrowRight className="h-4 w-4" />
                About EIPsInsight
              </Link>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              {
                title: 'Product quality',
                body: 'We bias toward clarity, inspection, and surfaces that reduce governance ambiguity.',
                icon: Target,
              },
              {
                title: 'Trust and stewardship',
                body: 'The project is maintained with a long-term view toward accuracy, durability, and ecosystem usefulness.',
                icon: ShieldCheck,
              },
              {
                title: 'Iteration and energy',
                body: 'We ship quickly, listen carefully, and keep improving the product through real usage and feedback.',
                icon: Sparkles,
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="rounded-lg border border-border bg-muted/30 p-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <h3 className="mt-3 text-base font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
