import { NextRequest } from "next/server";
import { findOrCreateUserByEmail } from "@boilerplate/db/organization";
import { prisma, setUserPassword } from "@boilerplate/db";
import { schemaNameFromSlug } from "@boilerplate/db";
import {
  createSelfHostedInstallation,
  ensureCustomerAccount,
  ensureDefaultSubscription,
} from "@boilerplate/db/self-hosted";
import { jsonResponse, errorResponse } from "@/lib/control-plane/auth";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const name = String(body.name ?? "");
  const orgName = String(body.organizationName ?? "Minha empresa");
  if (!email || !password) return errorResponse("EMAIL_PASSWORD_REQUIRED", 400);

  const user = await findOrCreateUserByEmail(email, name);
  await setUserPassword(email, password);
  const slug = orgName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  const org = await prismaOrganizationCreate(orgName, slug || "empresa");
  await ensureCustomerAccount({ userId: user.id, organizationId: org.id });
  await ensureDefaultSubscription(org.id);
  const { installationToken } = await createSelfHostedInstallation({
    organizationId: org.id,
    name: "Instalação principal",
  });

  return jsonResponse(
    {
      userId: user.id,
      organizationId: org.id,
      installationToken,
    },
    201,
  );
}

async function prismaOrganizationCreate(name: string, slug: string) {
  let finalSlug = slug;
  let i = 0;
  while (await prisma.organization.findUnique({ where: { slug: finalSlug } })) {
    i += 1;
    finalSlug = `${slug}-${i}`;
  }
  return prisma.organization.create({
    data: {
      name,
      slug: finalSlug,
      schemaName: schemaNameFromSlug(finalSlug),
      tipoNegocio: "geral",
      provisioningStatus: "trial",
    },
  });
}
