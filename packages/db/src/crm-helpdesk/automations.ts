import { prisma } from "../client";
import { assertSafeSchemaName } from "../tenant/schema";
import { linkKbToTicket, updateHelpdeskTicket } from "./repository";
import { suggestKbForTicketText } from "./repository";

export async function runHelpdeskAutomations(
  schemaName: string,
  triggerType: string,
  context: {
    ticketId: string;
    title?: string;
    description?: string;
    affectedSectorId?: string | null;
  },
): Promise<void> {
  assertSafeSchemaName(schemaName);
  const rulesTable = `"${schemaName}"."crm_helpdesk_automation_rules"`;
  const rows = await prisma.$queryRawUnsafe<
    { id: string; action_type: string; config: Record<string, unknown> }[]
  >(
    `SELECT id, action_type, config FROM ${rulesTable}
     WHERE active = true AND trigger_type = $1`,
    triggerType,
  );

  for (const rule of rows) {
    const config = rule.config ?? {};
    switch (rule.action_type) {
      case "assign_queue": {
        const queueId = config.queueId as string | undefined;
        if (queueId) {
          await updateHelpdeskTicket(schemaName, context.ticketId, {
            queueId,
          });
        }
        break;
      }
      case "suggest_kb_link": {
        if (context.title && context.description) {
          const hits = await suggestKbForTicketText(
            schemaName,
            context.title,
            context.description,
            context.affectedSectorId,
          );
          if (hits.length > 0) {
            await linkKbToTicket(
              schemaName,
              context.ticketId,
              hits.map((h) => h.kbEntryId),
              "suggested",
            );
          }
        }
        break;
      }
      case "request_csat":
        break;
      default:
        break;
    }
  }
}
