export type PhoneParts = {
  countryCode: string;
  ddd: string;
  number: string;
};

export const DEFAULT_COUNTRY_CODE = "55";

const STRUCTURED_PHONE_RE = /^\+(\d{1,3})\s+(\d{2})\s+(.*)$/;

export function emptyPhoneParts(): PhoneParts {
  return {
    countryCode: DEFAULT_COUNTRY_CODE,
    ddd: "",
    number: "",
  };
}

/** Separa um telefone salvo (estruturado ou legado) em partes para o formulário. */
export function parsePhoneStored(
  stored: string | null | undefined,
): PhoneParts {
  const empty: PhoneParts = {
    countryCode: DEFAULT_COUNTRY_CODE,
    ddd: "",
    number: "",
  };
  if (!stored?.trim()) return empty;

  const trimmed = stored.trim();

  if (trimmed.startsWith("+")) {
    const m = trimmed.match(STRUCTURED_PHONE_RE);
    if (m) {
      return {
        countryCode: m[1],
        ddd: m[2],
        number: (m[3] ?? "").replace(/\D/g, ""),
      };
    }
    const ccOnly = trimmed.match(/^\+(\d{1,3})$/);
    if (ccOnly) {
      return { countryCode: ccOnly[1], ddd: "", number: "" };
    }
  }

  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return empty;

  if (digits.startsWith("55") && digits.length >= 12) {
    return {
      countryCode: "55",
      ddd: digits.slice(2, 4),
      number: digits.slice(4),
    };
  }

  if (digits.length === 10 || digits.length === 11) {
    return {
      countryCode: DEFAULT_COUNTRY_CODE,
      ddd: digits.slice(0, 2),
      number: digits.slice(2),
    };
  }

  if (digits.length <= 2) {
    return { ...empty, ddd: digits };
  }

  if (digits.length <= 4) {
    return { countryCode: DEFAULT_COUNTRY_CODE, ddd: digits, number: "" };
  }

  return { countryCode: DEFAULT_COUNTRY_CODE, ddd: "", number: digits };
}

/** Formata só os dígitos do número local (8 ou 9 dígitos BR). */
export function formatLocalNumberDigits(digits: string): string {
  const n = digits.replace(/\D/g, "").slice(0, 9);
  if (n.length <= 4) return n;
  if (n.length <= 8) {
    return `${n.slice(0, 4)}-${n.slice(4)}`;
  }
  return `${n.slice(0, 1)} ${n.slice(1, 5)}-${n.slice(5)}`;
}

/** Valor único para persistir no banco. Vazio se opcional e sem dados. */
export function formatPhoneForStorage(parts: PhoneParts): string | null {
  const ddd = parts.ddd.replace(/\D/g, "");
  const num = parts.number.replace(/\D/g, "");
  if (!ddd && !num) return null;

  const cc = parts.countryCode.replace(/\D/g, "") || DEFAULT_COUNTRY_CODE;
  const local = formatLocalNumberDigits(num);
  return `+${cc} ${ddd} ${local}`.trim();
}

/** Exibição na tabela e listagens. */
export function formatPhoneDisplay(stored: string | null | undefined): string {
  if (!stored?.trim()) return "—";
  const parts = parsePhoneStored(stored);
  const cc = parts.countryCode || DEFAULT_COUNTRY_CODE;
  const ddd = parts.ddd;
  const num = formatLocalNumberDigits(parts.number);
  if (!ddd && !parts.number) {
    if (stored.startsWith("+") && stored.length <= 4) return stored;
    return "—";
  }
  if (!num) return stored;
  if (ddd) return `+${cc} ${ddd} ${num}`.trim();
  return `+${cc} ${num}`.trim();
}

export function validatePhoneParts(parts: PhoneParts): string | null {
  const cc = parts.countryCode.replace(/\D/g, "") || DEFAULT_COUNTRY_CODE;
  const ddd = parts.ddd.replace(/\D/g, "");
  const num = parts.number.replace(/\D/g, "");

  if (!ddd && !num) return null;

  if (!ddd || ddd.length !== 2) {
    return "Informe o DDD com 2 dígitos.";
  }

  if (cc === "55") {
    if (num.length < 8 || num.length > 9) {
      return "Informe o número com 8 (fixo) ou 9 (celular) dígitos.";
    }
    if (num.length === 9 && num[0] !== "9") {
      return "Celular no Brasil deve começar com 9.";
    }
  } else if (num.length < 4) {
    return "Informe o número completo.";
  }

  return null;
}

export function digitsOnly(value: string, maxLen: number): string {
  return value.replace(/\D/g, "").slice(0, maxLen);
}

export function phonePartsEqual(a: PhoneParts, b: PhoneParts): boolean {
  return (
    a.countryCode === b.countryCode &&
    a.ddd === b.ddd &&
    a.number === b.number
  );
}
