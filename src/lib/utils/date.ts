/**
 * Date formatting and manipulation utilities using date-fns.
 */

import { format, formatDistanceToNow, addMinutes, parseISO } from 'date-fns';

/**
 * Ensure a Date object from either a Date or ISO string input.
 */
function ensureDate(date: Date | string): Date {
  if (typeof date === 'string') {
    return parseISO(date);
  }
  return date;
}

/**
 * Format a date as "Feb 7, 2026".
 */
export function formatDate(date: Date | string): string {
  return format(ensureDate(date), 'MMM d, yyyy');
}

/**
 * Format a date with time as "Feb 7, 2026 at 8:00 AM".
 */
export function formatDateTime(date: Date | string): string {
  return format(ensureDate(date), "MMM d, yyyy 'at' h:mm a");
}

/**
 * Format just the time as "8:00 AM".
 */
export function formatTime(date: Date | string): string {
  return format(ensureDate(date), 'h:mm a');
}

/**
 * Format a date as a relative string, e.g., "in 2 hours", "yesterday".
 */
export function formatRelative(date: Date | string): string {
  return formatDistanceToNow(ensureDate(date), { addSuffix: true });
}

/**
 * Add a given number of minutes to a Date, returning a new Date.
 */
export function addMinutesToDate(date: Date, minutes: number): Date {
  return addMinutes(date, minutes);
}
