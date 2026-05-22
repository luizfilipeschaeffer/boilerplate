import type { Fase } from "@boilerplate/shared";

export type CrmContext = "platform" | "tenant";

export type CrmPipelineStage =
  | "lead"
  | "trial"
  | "active"
  | "expansion"
  | "churn_risk";

export type CrmRecordKind = "organization" | "lead";

export interface CrmBoardRecord {
  id: string;
  kind: CrmRecordKind;
  title: string;
  subtitle?: string;
  phase: Fase;
  pipelineStage: CrmPipelineStage;
  moduleIds: string[];
  moduleDemandIds?: string[];
  meta: Record<string, string | number | boolean | null | undefined>;
}

export interface CrmNote {
  id: string;
  body: string;
  createdAt: Date;
  authorName?: string | null;
}

export interface CreateLeadInput {
  name: string;
  email?: string | null;
  phone?: string | null;
  cnpj?: string | null;
  source?: string | null;
  ownerUserId?: string | null;
  notes?: string | null;
  tags?: string[];
  utm?: import("./lead-types").CrmLeadUtm;
  tipoNegocio?: string | null;
  estimatedPhase?: Fase;
}

export interface CreateDealInput {
  clientId: string;
  crmLeadId?: string | null;
}

export interface CrmRepository {
  readonly context: CrmContext;
  listBoardRecords(): Promise<CrmBoardRecord[]>;
  updatePhase(id: string, kind: CrmRecordKind, phase: Fase): Promise<void>;
  updatePipelineStage(
    id: string,
    kind: CrmRecordKind,
    stage: CrmPipelineStage,
    previousStage?: string,
  ): Promise<void>;
  updateModules?(id: string, moduleIds: string[]): Promise<void>;
  listNotes(id: string, kind: CrmRecordKind): Promise<CrmNote[]>;
  addNote(
    id: string,
    kind: CrmRecordKind,
    body: string,
    authorId?: string,
  ): Promise<void>;
  createLead?(input: CreateLeadInput): Promise<CrmBoardRecord>;
  createDeal?(input: CreateDealInput): Promise<CrmBoardRecord>;
}
