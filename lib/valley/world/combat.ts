/** True when a melee swing from `range` with a target `hitRadius` pad can reach `dist`. */
export function meleeReaches(range: number, hitRadius: number, dist: number) {
  return dist <= range + hitRadius;
}
