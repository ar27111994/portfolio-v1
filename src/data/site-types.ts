// Shared TypeScript interfaces for site content (#15)

export interface Badge {
  label: string;
  icon?: string;
  mark?: string;
}
export interface ProofMetric {
  value: string;
  label: string;
  detail: string;
  stat?: string;
}
export interface ProofCategory {
  label: string;
}
export interface ServiceOffering {
  title: string;
  summary: string;
  icon: string;
}
export interface Testimonial {
  quote: string;
  author: string;
  role: string;
  relation: string;
  href: string;
  platform: string;
}
export interface CaseStudy {
  title: string;
  context: string;
  problem: string;
  approach: string;
  outcome: string;
  tech: string[];
  metrics: string[];
}
export interface FeaturedProject {
  name: string;
  status: string;
  visual: string;
  accent: string;
  href: string;
  summary: string;
  highlights: string[];
}
export interface AdditionalProject {
  name: string;
  href: string;
  description: string;
}
export interface WritingLink {
  label: string;
  href: string;
  date?: string;
  source?: string;
  tag?: string;
  icon?: string;
}
export interface FeedSource {
  label: string;
  href: string;
  type: string;
  icon: string;
}
export interface LabNote {
  title: string;
  body: string;
}
export interface ContactWidget {
  kind: string;
  label: string;
  value: string;
  detail: string;
  href: string;
  icon: string;
}
export interface ResumeWidget {
  label: string;
  badge: string;
  detail: string;
  href: string;
  icon: string;
}
export interface ProfileWidget {
  label: string;
  detail: string;
  href: string;
  icon: string;
}
export interface SponsorLink {
  label: string;
  href: string;
  note: string;
  icon: string;
}
export interface CredibilityFact {
  icon: string;
  text: string;
}
export interface VentureProof {
  label: string;
  href: string;
  icon: string;
}
export interface CertificationLink {
  label: string;
  href: string;
  issuer: string;
  icon: string;
  pdf?: string;
}
export interface OpenSourceItem {
  label: string;
  href: string;
  detail?: string;
}
export interface Capability {
  title: string;
  icon?: string;
  cue?: string;
  mark?: string;
  body?: string;
}
export interface ProfileLink {
  label: string;
  href: string;
  icon: string;
  note?: string;
}
export interface UpworkFitTag {
  tag: string;
}
