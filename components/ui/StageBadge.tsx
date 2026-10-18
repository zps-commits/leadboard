import { STAGE_LABELS, type Stage } from '@/lib/domain/lead';

/**
 * Stage is the one thing colour carries here, so it also carries the
 * word: a badge read in greyscale still says which stage it is.
 */
const CLASSES: Record<Stage, string> = {
  new: 'border-stage-new/30 bg-stage-new/10 text-stage-new',
  qualifying: 'border-stage-qualifying/30 bg-stage-qualifying/10 text-stage-qualifying',
  proposal: 'border-stage-proposal/30 bg-stage-proposal/10 text-stage-proposal',
  negotiation: 'border-stage-negotiation/30 bg-stage-negotiation/10 text-stage-negotiation',
  won: 'border-stage-won/30 bg-stage-won/10 text-stage-won',
  lost: 'border-stage-lost/30 bg-stage-lost/10 text-stage-lost',
};

export function StageBadge({ stage }: { stage: Stage }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${CLASSES[stage]}`}
    >
      {STAGE_LABELS[stage]}
    </span>
  );
}
