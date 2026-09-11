import { Timeline } from "@/components/ui/timeline";
import { goals } from "@/content/goals";

export function GoalsTimeline() {
  const data = goals.map((g) => ({
    title: g.period,
    content: (
      <div>
        <h4 className="font-display text-xl font-bold text-foreground md:text-2xl">
          {g.headline}
        </h4>
        <p className="mt-2 mb-6 text-sm text-muted md:text-base">{g.body}</p>
        <ul className="space-y-2">
          {g.milestones.map((m) => (
            <li
              key={m}
              className="flex items-start gap-2 text-sm text-foreground/80"
            >
              <span
                aria-hidden
                className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-violet"
              />
              {m}
            </li>
          ))}
        </ul>
      </div>
    ),
  }));

  return (
    <div className="relative w-full overflow-clip">
      <Timeline
        data={data}
        heading="Where this is going."
        description="A rough map of what the future looks like — updated as the plan changes."
      />
    </div>
  );
}
