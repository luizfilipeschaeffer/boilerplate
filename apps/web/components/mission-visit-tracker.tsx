"use client";

import * as React from "react";

import { markMissionVisit } from "@/app/actions/missions";
import type { MissionId } from "@/lib/missions/catalog";

/** Marca missão de “visita” ao abrir a tela. */
export function MissionVisitTracker({ missionId }: { missionId: MissionId }) {
  const sent = React.useRef(false);

  React.useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    void markMissionVisit(missionId);
  }, [missionId]);

  return null;
}
