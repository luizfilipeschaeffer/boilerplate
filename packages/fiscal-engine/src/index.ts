import type { FiscalCapability } from "@boilerplate/shared";

export interface ResultadoEmissao {
  sucesso: boolean;
  chave?: string;
  mensagem?: string;
}

export interface FiscalAdapter {
  capabilitiesSuportadas: FiscalCapability[];
  emitirNFCe?(dados: unknown): Promise<ResultadoEmissao>;
  emitirNFe?(dados: unknown): Promise<ResultadoEmissao>;
  emitirCTe?(dados: unknown): Promise<ResultadoEmissao>;
  emitirMDFe?(dados: unknown): Promise<ResultadoEmissao>;
  emitirCIOT?(dados: unknown): Promise<ResultadoEmissao>;
}

export class NoopFiscalAdapter implements FiscalAdapter {
  capabilitiesSuportadas: FiscalCapability[] = [];

  private naoImplementado(): ResultadoEmissao {
    return {
      sucesso: false,
      mensagem: "Emissão fiscal não configurada (NoopAdapter — MVP)",
    };
  }

  emitirNFCe = async () => this.naoImplementado();
  emitirNFe = async () => this.naoImplementado();
  emitirCTe = async () => this.naoImplementado();
  emitirMDFe = async () => this.naoImplementado();
  emitirCIOT = async () => this.naoImplementado();
}
