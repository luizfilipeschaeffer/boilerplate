import { resolve, MESSAGING_RESEND_INTEGRATOR_ID } from "./integrator-credentials";

export type IntegratorHealthResult = {
  ok: boolean;
  message: string;
};

export async function checkIntegratorHealth(
  integratorId: string,
  organizationId?: string | null,
): Promise<IntegratorHealthResult> {
  if (integratorId === MESSAGING_RESEND_INTEGRATOR_ID) {
    return checkResendHealth(organizationId);
  }

  if (integratorId === "payment-asaas") {
    return checkAsaasHealth(organizationId);
  }

  if (integratorId === "payment-stripe") {
    return checkStripeHealth(organizationId);
  }

  if (integratorId === "payment-mercadopago") {
    return checkMercadoPagoHealth(organizationId);
  }

  return { ok: false, message: "Health check não disponível para este integrador." };
}

async function checkResendHealth(
  organizationId?: string | null,
): Promise<IntegratorHealthResult> {
  try {
    const creds = await resolve(MESSAGING_RESEND_INTEGRATOR_ID, organizationId);
    const apiKey = creds.secrets.apiKey;
    if (!apiKey) {
      return { ok: false, message: "API Key não configurada." };
    }
    const res = await fetch("https://api.resend.com/domains", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (res.ok) {
      return { ok: true, message: "Conexão com Resend OK." };
    }
    return {
      ok: false,
      message: `Resend retornou status ${res.status}.`,
    };
  } catch {
    return { ok: false, message: "Falha ao verificar credenciais do Resend." };
  }
}

async function checkAsaasHealth(
  organizationId?: string | null,
): Promise<IntegratorHealthResult> {
  try {
    const creds = await resolve("payment-asaas", organizationId);
    const apiKey = creds.secrets.apiKey;
    if (!apiKey) {
      return { ok: false, message: "API Key não configurada." };
    }
    const baseUrl =
      (typeof creds.configPublic.apiUrl === "string" && creds.configPublic.apiUrl) ||
      "https://sandbox.asaas.com/api/v3";
    const res = await fetch(`${baseUrl}/customers?limit=1`, {
      headers: { access_token: apiKey },
    });
    if (res.ok) {
      return { ok: true, message: "Conexão com Asaas OK." };
    }
    return { ok: false, message: `Asaas retornou status ${res.status}.` };
  } catch {
    return { ok: false, message: "Falha ao verificar credenciais do Asaas." };
  }
}

async function checkStripeHealth(
  organizationId?: string | null,
): Promise<IntegratorHealthResult> {
  try {
    const creds = await resolve("payment-stripe", organizationId);
    const secretKey = creds.secrets.secretKey;
    if (!secretKey) {
      return { ok: false, message: "Secret Key não configurada." };
    }
    const res = await fetch("https://api.stripe.com/v1/balance", {
      headers: { Authorization: `Bearer ${secretKey}` },
    });
    if (res.ok) {
      return { ok: true, message: "Conexão com Stripe OK." };
    }
    return { ok: false, message: `Stripe retornou status ${res.status}.` };
  } catch {
    return { ok: false, message: "Falha ao verificar credenciais do Stripe." };
  }
}

async function checkMercadoPagoHealth(
  organizationId?: string | null,
): Promise<IntegratorHealthResult> {
  try {
    const creds = await resolve("payment-mercadopago", organizationId);
    const token = creds.secrets.accessToken;
    if (!token) {
      return { ok: false, message: "Access Token não configurado." };
    }
    const res = await fetch("https://api.mercadopago.com/users/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      return { ok: true, message: "Conexão com Mercado Pago OK." };
    }
    return { ok: false, message: `Mercado Pago retornou status ${res.status}.` };
  } catch {
    return { ok: false, message: "Falha ao verificar credenciais do Mercado Pago." };
  }
}
