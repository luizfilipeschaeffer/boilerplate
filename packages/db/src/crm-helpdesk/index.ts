export {
  ensureTenantHelpdeskTables,
  helpdeskDdlStatements,
} from "./ensure-tables";
export {
  listHelpdeskTickets,
  getHelpdeskTicket,
  createHelpdeskTicket,
  updateHelpdeskTicket,
  addTicketComment,
  linkKbToTicket,
  listHelpdeskQueues,
  suggestKbForTicketText,
  searchHelpdeskKb,
  reindexHelpdeskKbEntry,
} from "./repository";
export {
  listHelpdeskKbEntries,
  getHelpdeskKbEntry,
  createHelpdeskKbArticle,
  createHelpdeskKbThread,
  addKbThreadPost,
  publishHelpdeskKbEntry,
} from "./kb-repository";
export { submitHelpdeskCsat, getHelpdeskCsatAverage } from "./csat";
export { runHelpdeskAutomations } from "./automations";
export {
  createTicketFromCommsThread,
  linkCommsThreadToTicket,
  aggregatePlatformHelpdeskStats,
  type PlatformHelpdeskOrgSummary,
} from "./platform-bridge";
