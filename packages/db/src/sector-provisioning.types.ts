export type SectorVisibility = "hidden" | "em_breve" | "active";

export type SegmentSectorTemplateRow = {
  segmentSlug: string;
  phaseMin: number;
  coreSectorSlug: string;
  displayName: string;
  sectorSlug: string;
  visibilityDefault: SectorVisibility;
  isAggregator: boolean;
  ordem: number;
};

export type SegmentSectorModuleTemplateRow = {
  segmentSlug: string;
  coreSectorSlug: string;
  moduleId: string;
  phaseMin: number;
  shortcutCoreSectorSlugs: string[];
};

export type ModuleShortcut = {
  moduleId: string;
  primarySectorSlug: string;
};
