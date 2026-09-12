import type { GameCommand, GameEvent } from "./types";

/** Tiny two-way event bus between the Phaser scene and React overlays. */
export type Bridge = {
  emit: (event: GameEvent) => void;
  subscribe: (cb: (event: GameEvent) => void) => () => void;
  send: (command: GameCommand) => void;
  onCommand: (cb: (command: GameCommand) => void) => () => void;
};

export function createBridge(): Bridge {
  const eventSubs = new Set<(e: GameEvent) => void>();
  const commandSubs = new Set<(c: GameCommand) => void>();
  return {
    emit(event) {
      for (const cb of eventSubs) cb(event);
    },
    subscribe(cb) {
      eventSubs.add(cb);
      return () => {
        eventSubs.delete(cb);
      };
    },
    send(command) {
      for (const cb of commandSubs) cb(command);
    },
    onCommand(cb) {
      commandSubs.add(cb);
      return () => {
        commandSubs.delete(cb);
      };
    },
  };
}
