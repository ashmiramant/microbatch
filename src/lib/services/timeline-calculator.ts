/**
 * Timeline calculator.
 *
 * Takes a timeline template and a target bake start time, then generates
 * concrete timestamped steps by applying the offset from each template step.
 */

import {
  TIMELINE_TEMPLATES,
  type TimelineTemplate,
  type TimelineTemplateStep,
} from '@/lib/services/timeline-templates';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TimelineStep {
  stepType: string;
  name: string;
  description: string;
  scheduledStartAt: Date;
  scheduledEndAt: Date;
}

// ---------------------------------------------------------------------------
// Core functions
// ---------------------------------------------------------------------------

/**
 * Convert a single template step into a concrete timeline step
 * by applying the offset and duration relative to the target bake time.
 */
function resolveStep(
  step: TimelineTemplateStep,
  targetBakeTime: Date,
): TimelineStep {
  const startMs = targetBakeTime.getTime() + step.offsetMinutesFromBake * 60_000;
  const endMs = startMs + step.durationMinutes * 60_000;

  return {
    stepType: step.stepType,
    name: step.name,
    description: step.description,
    scheduledStartAt: new Date(startMs),
    scheduledEndAt: new Date(endMs),
  };
}

/**
 * Generate a concrete timeline from a template and a target bake start time.
 *
 * @param template - The timeline template defining steps and offsets.
 * @param targetBakeTime - The desired bake start time (offset 0).
 * @returns An array of timeline steps with concrete start/end timestamps,
 *          sorted chronologically by start time.
 */
export function generateTimelineFromTemplate(
  template: TimelineTemplate,
  targetBakeTime: Date,
): TimelineStep[] {
  return template.steps
    .map((step) => resolveStep(step, targetBakeTime))
    .sort((a, b) => a.scheduledStartAt.getTime() - b.scheduledStartAt.getTime());
}

/**
 * Generate a concrete timeline by looking up a template by its ID.
 *
 * @param templateId - The ID of the template (e.g., 'standard_sourdough').
 * @param targetBakeTime - The desired bake start time.
 * @returns An array of timeline steps, or an empty array if the template is not found.
 */
export function generateTimeline(
  templateId: string,
  targetBakeTime: Date,
): TimelineStep[] {
  const template = TIMELINE_TEMPLATES.find((t) => t.id === templateId);
  if (!template) {
    return [];
  }
  return generateTimelineFromTemplate(template, targetBakeTime);
}
