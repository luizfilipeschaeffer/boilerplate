import type { Prisma } from "../generated/prisma";
import type { CustomerFeedbackPayload } from "@boilerplate/platform-api";
import { prisma } from "../client";

export async function submitCustomerFeedback(
  payload: CustomerFeedbackPayload,
): Promise<{ id: string }> {
  const row = await prisma.customerFeedback.create({
    data: {
      organizationId: payload.organizationId,
      installationId: payload.installationId,
      moduleId: payload.moduleId,
      summary: payload.summary,
      sanitizedDetails: payload.sanitizedDetails as Prisma.InputJsonValue,
      status: "pending",
    },
  });
  return { id: row.id };
}

export async function listPendingFeedback() {
  return prisma.customerFeedback.findMany({
    where: { status: "pending" },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function approveFeedbackForGithub(opts: {
  feedbackId: string;
  labels: string[];
  githubRepo: string;
  githubIssueNumber: number;
  moduleId?: string;
  bountyAvailable?: boolean;
}) {
  await prisma.githubIssueLink.create({
    data: {
      feedbackId: opts.feedbackId,
      githubRepo: opts.githubRepo,
      githubIssueNumber: opts.githubIssueNumber,
      labels: opts.labels,
      moduleId: opts.moduleId,
      bountyAvailable: opts.bountyAvailable ?? false,
      status: "triagem",
    },
  });
  await prisma.customerFeedback.update({
    where: { id: opts.feedbackId },
    data: { status: "published_github" },
  });
}
