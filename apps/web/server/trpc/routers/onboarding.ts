import { completeOnboarding, type DiagnosticoInput } from "@boilerplate/db";
import {
  classificarFase,
  recomendarModulos,
} from "@boilerplate/module-registry";
import { resolveActivationPackage } from "@boilerplate/db";
import { z } from "zod";
import { ensureModulesRegistered } from "@/lib/modules/init";
import { protectedProcedure, router } from "../init";

const diagnosticoSchema = z.object({
  organizationName: z.string().min(2).max(120),
  tipoNegocio: z.enum([
    "pessoa_fisica",
    "varejo",
    "atacado",
    "fornecedor",
    "distribuidor",
    "transportadora",
    "fabricante",
    "industria",
    "produtor_rural",
  ]),
  segmentoAtuacao: z.string().max(80).optional().nullable(),
  declaredPhase: z.number().int().min(1).max(4).optional().nullable(),
  temPontoFixo: z.boolean(),
  vendasMes: z.enum(["ate50", "50a200", "200a1000", "acima1000"]),
  temFuncionarios: z.boolean(),
  emiteNota: z.boolean().nullable(),
  possuiCnpj: z.boolean(),
  cnpj: z.string().max(18).optional().nullable(),
});

export const onboardingRouter = router({
  preview: protectedProcedure
    .input(diagnosticoSchema.omit({ organizationName: true }))
    .mutation(({ input }) => {
      ensureModulesRegistered();
      const diag: DiagnosticoInput = {
        tipoNegocio: input.tipoNegocio,
        segmentoAtuacao: input.segmentoAtuacao,
        temPontoFixo: input.temPontoFixo,
        vendasMes: input.vendasMes,
        temFuncionarios: input.temFuncionarios,
        emiteNota: input.emiteNota,
        possuiCnpj: input.possuiCnpj,
        cnpj: input.cnpj,
      };
      const diagnosed = classificarFase(diag);
      const fase = (input.declaredPhase ?? diagnosed) as 1 | 2 | 3 | 4;
      const segmentSlug = input.segmentoAtuacao ?? "varejo";
      const pkg = await resolveActivationPackage({
        marketSegmentSlug: segmentSlug,
        phase: fase,
        tipoNegocio: input.tipoNegocio,
        possuiCnpj: input.possuiCnpj,
        diagnostico: diag,
      });
      const recomendacoes = recomendarModulos(fase, input.tipoNegocio, {
        possuiCnpj: input.possuiCnpj,
      });
      return {
        fase,
        diagnosedPhase: diagnosed,
        recomendacoes,
        packagePreview: {
          moduleIds: pkg.moduleIds,
          requiresPaymentValidation: pkg.requiresPaymentValidation,
          trialDays: pkg.trialDays,
          fallbackUsed: pkg.fallbackUsed,
        },
      };
    }),

  complete: protectedProcedure
    .input(diagnosticoSchema)
    .mutation(async ({ ctx, input }) => {
      ensureModulesRegistered();
      const result = await completeOnboarding(ctx.userId, input, {
        marketSegmentSlug: input.segmentoAtuacao ?? "varejo",
        declaredPhase: input.declaredPhase ?? undefined,
      });
      return result;
    }),
});
