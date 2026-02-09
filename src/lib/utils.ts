import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: Array<string | undefined | null | false>) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(date));
}

export function timeAgo(date: string) {
  const now = new Date();
  const target = new Date(date);
  const diff = now.getTime() - target.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days <= 0) return 'Today';
  if (days === 1) return '1 day ago';
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} wk${weeks > 1 ? 's' : ''} ago`;
  const months = Math.floor(days / 30);
  return `${months} mo${months > 1 ? 's' : ''} ago`;
}

export function currency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(amount);
}

export function toPostgresDate(date?: string): string | null {
  if (!date) return null;
  if (/^\d{4}-\d{2}$/.test(date)) {
    return `${date}-01`;
  }
  // If it's just a year YYYY
  if (/^\d{4}$/.test(date)) {
    return `${date}-01-01`;
  }
  return date;
}
// Helper to create SEO-friendly slugs: "dental-assistant-7c57b5e6"
export function createJobSlug(job: { id: string; roleType: string; slug?: string }) {
  // Always use stored slug if available
  if (job.slug) return job.slug;

  // Fallback: Generate consistent slug using first 8 chars of UUID
  const titleSlug = job.roleType
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric chars with hyphens
    .replace(/^-+|-+$/g, ''); // Trim leading/trailing hyphens
  return `${titleSlug}-${job.id.substring(0, 8)}`;
}

// Helper to extract ID from slug: "dental-assistant-12345" -> "12345"
// Assumes the ID is the last part after the last hyphen.
// However, UUIDs contain hyphens.
// Strategy: Since UUIDs are standard, we can verify if the last part is a UUID or if the whole thing is a UUID.
// Actually, a simpler strategy for "slug-ID" where ID is a UUID:
// Split by hyphen. If the last 5 parts form a UUID structure (8-4-4-4-12 chars), that's the ID.
// OR simpler: The ID is the UUID at the end.
// We know our IDs are UUIDs.
export function getJobIdFromSlug(slug: string): string {
  // If it's just a UUID (old links), return it
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(slug)) return slug;

  // Otherwise, extract the last 36 characters if they look like a UUID
  // Or simpler, just take the last 36 chars? Use a robust regex match at end of string.
  const match = slug.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i);
  return match ? match[1] : slug;
}
