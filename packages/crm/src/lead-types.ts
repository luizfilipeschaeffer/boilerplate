export type CrmLeadStatus = "novo" | "em_contato" | "qualificado" | "descartado";

export const CRM_LEAD_STATUSES: CrmLeadStatus[] = [
  "novo",
  "em_contato",
  "qualificado",
  "descartado",
];

export const CRM_LEAD_STATUS_LABELS: Record<CrmLeadStatus, string> = {
  novo: "Novo",
  em_contato: "Em contato",
  qualificado: "Qualificado",
  descartado: "Descartado",
};

export interface CrmLeadUtm {
  source?: string | null;
  medium?: string | null;
  campaign?: string | null;
  term?: string | null;
  content?: string | null;
}

export interface CrmLeadDetail {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  cnpj: string | null;
  pipelineStage: string;
  status: CrmLeadStatus;
  source: string | null;
  ownerUserId: string | null;
  ownerName: string | null;
  notes: string | null;
  tags: string[];
  utm: CrmLeadUtm;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateLeadInput {
  name?: string;
  email?: string | null;
  phone?: string | null;
  cnpj?: string | null;
  status?: CrmLeadStatus;
  source?: string | null;
  ownerUserId?: string | null;
  notes?: string | null;
  tags?: string[];
  utm?: Partial<CrmLeadUtm>;
}

export interface CrmLeadDuplicate {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  matchReason: "email" | "phone" | "cnpj";
}
