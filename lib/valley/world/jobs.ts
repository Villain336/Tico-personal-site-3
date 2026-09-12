import type { WorldScene } from "../scenes/WorldScene";
import { DUSK_JOBS, FALLBACK_JOBS } from "../dialogue";
import type { AwayReport, Job, JobId } from "../types";

/**
 * The top ribbon's job list. Day jobs come from the return letter's own
 * beats (topped up with flavor fallbacks); dusk always takes over the same
 * ribbon regardless of whether a letter fired, so the warning lives in one
 * place instead of a separate toast.
 */
export class Jobs {
  list: Job[] | null = null;
  mode: "day" | "dusk" | null = null;

  constructor(private scene: WorldScene) {}

  startFromLetter(report: AwayReport) {
    const beats: Job[] = [];
    if (report.cropsGrown > 0) beats.push({ id: "harvest", label: "Harvest what grew", done: false });
    if (report.villagerName) beats.push({ id: "pray", label: `Pray for ${report.villagerName}`, done: false });

    const jobs = [...beats];
    for (const f of FALLBACK_JOBS) {
      if (jobs.length >= 3) break;
      if (jobs.some((j) => j.id === f.id)) continue;
      jobs.push({ id: f.id, label: f.label, done: false });
    }
    this.list = jobs.slice(0, 3);
    this.mode = "day";
  }

  enterDusk() {
    this.list = DUSK_JOBS.slice(0, 3).map((j) => ({ ...j, done: false }));
    this.mode = "dusk";
  }

  clearForDawn() {
    this.list = null;
    this.mode = null;
  }

  complete(id: JobId) {
    if (!this.list) return;
    const j = this.list.find((x) => x.id === id);
    if (j && !j.done) {
      j.done = true;
      this.scene.toast(`Done: ${j.label}`, "good");
    }
  }
}
