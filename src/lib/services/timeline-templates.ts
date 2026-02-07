/**
 * Pre-built timeline templates for common baking workflows.
 *
 * Each template defines a series of steps with offsets (in minutes) relative
 * to the target bake start time. Negative offsets are before the bake;
 * positive offsets are after.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TimelineTemplateStep {
  stepType: string;
  name: string;
  /** Minutes offset from bake start. Negative = before bake, positive = after. */
  offsetMinutesFromBake: number;
  /** Duration of this step in minutes. */
  durationMinutes: number;
  description: string;
}

export interface TimelineTemplate {
  id: string;
  name: string;
  description: string;
  steps: TimelineTemplateStep[];
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

export const TIMELINE_TEMPLATES: TimelineTemplate[] = [
  // =========================================================================
  // 1. Standard Country Sourdough
  // =========================================================================
  {
    id: 'standard_sourdough',
    name: 'Standard Country Sourdough',
    description:
      'A classic overnight sourdough with a long cold proof. Plan for about 24 hours from levain build to the finished loaf.',
    steps: [
      {
        stepType: 'prep',
        name: 'Levain build',
        offsetMinutesFromBake: -1440,
        durationMinutes: 720,
        description:
          'Build levain with 1:5:5 ratio (starter : flour : water). Maintain at 78\u00B0F until doubled and domed, roughly 8\u201312 hours.',
      },
      {
        stepType: 'prep',
        name: 'Autolyse',
        offsetMinutesFromBake: -1050,
        durationMinutes: 30,
        description:
          'Combine flour and water (no salt, no levain). Mix until no dry flour remains and let rest covered.',
      },
      {
        stepType: 'mix',
        name: 'Mix',
        offsetMinutesFromBake: -1020,
        durationMinutes: 15,
        description:
          'Add levain and salt to the autolysed dough. Mix by hand using pinch-and-fold until fully incorporated.',
      },
      {
        stepType: 'ferment',
        name: 'Bulk ferment',
        offsetMinutesFromBake: -1005,
        durationMinutes: 240,
        description:
          'Maintain dough at 78\u00B0F. Perform stretch-and-fold sets every 30\u201345 minutes for the first 2 hours, then let rest. Target 50\u201375% volume increase.',
      },
      {
        stepType: 'fold',
        name: 'Fold 1',
        offsetMinutesFromBake: -945,
        durationMinutes: 5,
        description:
          'Perform a set of stretch-and-folds (4 sides) to develop gluten structure.',
      },
      {
        stepType: 'fold',
        name: 'Fold 2',
        offsetMinutesFromBake: -885,
        durationMinutes: 5,
        description:
          'Perform a second set of stretch-and-folds to further strengthen the dough.',
      },
      {
        stepType: 'fold',
        name: 'Fold 3',
        offsetMinutesFromBake: -825,
        durationMinutes: 5,
        description:
          'Perform a third set of stretch-and-folds. Dough should feel noticeably more elastic.',
      },
      {
        stepType: 'shape',
        name: 'Shape',
        offsetMinutesFromBake: -765,
        durationMinutes: 15,
        description:
          'Pre-shape into a round, bench rest 15\u201320 minutes, then final shape into a boule or batard. Place seam-side up in a floured banneton.',
      },
      {
        stepType: 'proof',
        name: 'Cold proof',
        offsetMinutesFromBake: -750,
        durationMinutes: 660,
        description:
          'Refrigerate at 38\u00B0F for 10\u201312 hours. The long cold retard develops flavor and makes scoring easier.',
      },
      {
        stepType: 'prep',
        name: 'Preheat',
        offsetMinutesFromBake: -90,
        durationMinutes: 60,
        description:
          'Preheat oven to 500\u00B0F with Dutch oven inside. Allow at least 60 minutes for the Dutch oven to fully saturate with heat.',
      },
      {
        stepType: 'prep',
        name: 'Score',
        offsetMinutesFromBake: -30,
        durationMinutes: 5,
        description:
          'Invert dough onto parchment, score with a lame or razor blade. Use swift, confident strokes at a shallow angle.',
      },
      {
        stepType: 'bake',
        name: 'Bake (covered)',
        offsetMinutesFromBake: 0,
        durationMinutes: 20,
        description:
          'Bake at 500\u00B0F covered in the Dutch oven. The trapped steam creates an initial oven spring and crisp crust.',
      },
      {
        stepType: 'bake',
        name: 'Bake (uncovered)',
        offsetMinutesFromBake: 20,
        durationMinutes: 25,
        description:
          'Remove lid, reduce temperature to 450\u00B0F. Bake until deep golden brown and the internal temperature reaches 205\u2013210\u00B0F.',
      },
      {
        stepType: 'cool',
        name: 'Cool',
        offsetMinutesFromBake: 45,
        durationMinutes: 60,
        description:
          'Cool on wire rack for at least 1 hour before slicing. Cutting too early releases steam and can result in a gummy crumb.',
      },
    ],
  },

  // =========================================================================
  // 2. Enriched Dough
  // =========================================================================
  {
    id: 'enriched_dough',
    name: 'Enriched Dough',
    description:
      'A versatile enriched dough suitable for brioche, babka, cinnamon rolls, and similar pastries. Includes an overnight cold proof for easier handling.',
    steps: [
      {
        stepType: 'mix',
        name: 'Mix',
        offsetMinutesFromBake: -720,
        durationMinutes: 20,
        description:
          'Combine flour, sugar, eggs, yeast, and salt. Mix on low speed, then gradually incorporate softened butter. Mix on medium until windowpane.',
      },
      {
        stepType: 'ferment',
        name: 'Bulk ferment',
        offsetMinutesFromBake: -700,
        durationMinutes: 120,
        description:
          'Let dough rise at room temperature (75\u201378\u00B0F) until roughly doubled, about 1.5\u20132 hours.',
      },
      {
        stepType: 'shape',
        name: 'Shape',
        offsetMinutesFromBake: -580,
        durationMinutes: 15,
        description:
          'Turn out dough, degas gently, and shape as needed (rolls, braid, etc.). Place in prepared pans.',
      },
      {
        stepType: 'proof',
        name: 'Cold proof',
        offsetMinutesFromBake: -565,
        durationMinutes: 480,
        description:
          'Cover and refrigerate for 8 hours or overnight. This slow proof deepens flavor and firms the butter for easier handling.',
      },
      {
        stepType: 'prep',
        name: 'Preheat',
        offsetMinutesFromBake: -85,
        durationMinutes: 30,
        description:
          'Preheat oven to the recipe\u2019s specified temperature (typically 350\u2013375\u00B0F for enriched doughs).',
      },
      {
        stepType: 'proof',
        name: 'Proof (room temp)',
        offsetMinutesFromBake: -55,
        durationMinutes: 45,
        description:
          'Remove from refrigerator and let proof at room temperature until puffy and nearly doubled, about 45\u201360 minutes.',
      },
      {
        stepType: 'bake',
        name: 'Bake',
        offsetMinutesFromBake: 0,
        durationMinutes: 30,
        description:
          'Bake until golden brown and internal temperature reaches 190\u00B0F. Tent with foil if browning too quickly.',
      },
      {
        stepType: 'cool',
        name: 'Cool',
        offsetMinutesFromBake: 30,
        durationMinutes: 30,
        description:
          'Cool in pan for 10 minutes, then transfer to a wire rack. Apply glaze or icing while slightly warm if desired.',
      },
    ],
  },

  // =========================================================================
  // 3. Same Day Sourdough
  // =========================================================================
  {
    id: 'same_day_sourdough',
    name: 'Same Day Sourdough',
    description:
      'A faster sourdough schedule that completes in about 10\u201312 hours with no overnight retard. Best in warm weather or with a proofing box.',
    steps: [
      {
        stepType: 'prep',
        name: 'Levain build',
        offsetMinutesFromBake: -600,
        durationMinutes: 240,
        description:
          'Build a stiff or liquid levain using a higher inoculation ratio (1:3:3 or 1:2:2). Keep warm (80\u201382\u00B0F) to speed fermentation. Ready in 3\u20134 hours.',
      },
      {
        stepType: 'prep',
        name: 'Autolyse',
        offsetMinutesFromBake: -360,
        durationMinutes: 30,
        description:
          'Mix flour and water until just combined. Rest covered for 30 minutes to hydrate the flour and begin gluten development.',
      },
      {
        stepType: 'mix',
        name: 'Mix',
        offsetMinutesFromBake: -330,
        durationMinutes: 15,
        description:
          'Add ripe levain and salt to the autolysed dough. Mix thoroughly by hand until the dough is cohesive.',
      },
      {
        stepType: 'ferment',
        name: 'Bulk ferment',
        offsetMinutesFromBake: -315,
        durationMinutes: 240,
        description:
          'Maintain at 80\u201382\u00B0F with stretch-and-folds every 30 minutes for the first 2 hours. Dough should increase 50\u201375% in volume.',
      },
      {
        stepType: 'shape',
        name: 'Shape',
        offsetMinutesFromBake: -75,
        durationMinutes: 15,
        description:
          'Pre-shape, rest 15 minutes, then final shape. Place in banneton.',
      },
      {
        stepType: 'proof',
        name: 'Proof',
        offsetMinutesFromBake: -60,
        durationMinutes: 45,
        description:
          'Proof at room temperature until the dough passes the poke test (slow spring-back, slight indent remains).',
      },
      {
        stepType: 'prep',
        name: 'Preheat',
        offsetMinutesFromBake: -60,
        durationMinutes: 45,
        description:
          'Preheat oven to 500\u00B0F with Dutch oven inside. Start preheating at the same time as the proof begins.',
      },
      {
        stepType: 'prep',
        name: 'Score',
        offsetMinutesFromBake: -15,
        durationMinutes: 5,
        description:
          'Turn out dough, score decisively, and load into the hot Dutch oven.',
      },
      {
        stepType: 'bake',
        name: 'Bake',
        offsetMinutesFromBake: 0,
        durationMinutes: 45,
        description:
          'Bake covered at 500\u00B0F for 20 minutes, then remove lid and reduce to 450\u00B0F for another 20\u201325 minutes until deeply golden.',
      },
      {
        stepType: 'cool',
        name: 'Cool',
        offsetMinutesFromBake: 45,
        durationMinutes: 60,
        description:
          'Cool completely on a wire rack before slicing, at least 1 hour.',
      },
    ],
  },
];
