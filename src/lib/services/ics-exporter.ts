/**
 * ICS (iCalendar) file generator.
 *
 * Produces a valid .ics string with VCALENDAR/VEVENT blocks that can be
 * imported into Google Calendar, Apple Calendar, Outlook, etc.
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Format a Date as an iCalendar UTC datetime string: YYYYMMDDTHHMMSSZ
 */
function formatICSDate(date: Date): string {
  const pad = (n: number): string => n.toString().padStart(2, '0');

  const year = date.getUTCFullYear();
  const month = pad(date.getUTCMonth() + 1);
  const day = pad(date.getUTCDate());
  const hours = pad(date.getUTCHours());
  const minutes = pad(date.getUTCMinutes());
  const seconds = pad(date.getUTCSeconds());

  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Escape special characters in iCalendar text fields.
 * Per RFC 5545, commas, semicolons, and backslashes must be escaped.
 * Newlines are converted to the literal string \n.
 */
function escapeICSText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/**
 * Generate a simple UID for an event.
 * Uses a timestamp + random component to ensure uniqueness.
 */
function generateUID(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  return `${timestamp}-${random}@microbatch`;
}

/**
 * Fold long lines per RFC 5545 (max 75 octets per line).
 * Continuation lines begin with a single space.
 */
function foldLine(line: string): string {
  if (line.length <= 75) return line;

  const parts: string[] = [];
  parts.push(line.substring(0, 75));
  let remaining = line.substring(75);

  while (remaining.length > 0) {
    // Continuation lines have a leading space, so we can fit 74 chars of content
    parts.push(' ' + remaining.substring(0, 74));
    remaining = remaining.substring(74);
  }

  return parts.join('\r\n');
}

// ---------------------------------------------------------------------------
// Core function
// ---------------------------------------------------------------------------

/**
 * Generate a valid .ics (iCalendar) file string from an array of events.
 *
 * @param events - Array of event objects with title, description, start/end times,
 *                 and optional location.
 * @returns A complete iCalendar file string ready to be saved as a .ics file.
 */
export function generateICS(
  events: Array<{
    title: string;
    description: string;
    startTime: Date;
    endTime: Date;
    location?: string;
  }>,
): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MicroBatch//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  const now = formatICSDate(new Date());

  for (const event of events) {
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${generateUID()}`);
    lines.push(`DTSTAMP:${now}`);
    lines.push(`DTSTART:${formatICSDate(event.startTime)}`);
    lines.push(`DTEND:${formatICSDate(event.endTime)}`);
    lines.push(foldLine(`SUMMARY:${escapeICSText(event.title)}`));
    lines.push(foldLine(`DESCRIPTION:${escapeICSText(event.description)}`));

    if (event.location) {
      lines.push(foldLine(`LOCATION:${escapeICSText(event.location)}`));
    }

    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');

  // iCalendar spec requires CRLF line endings
  return lines.join('\r\n') + '\r\n';
}
