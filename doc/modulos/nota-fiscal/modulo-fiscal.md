# PRD — Módulo Fiscal: Serviço de Emissão de Documentos Fiscais

**Versão:** 2.0.0  
**Data:** 2026-05-22  
**Status:** Draft  
**Autor:** —  
**Stack:** Node.js / TypeScript  

---

## Sumário

1. [Visão Geral](#1-visão-geral)
2. [Escopo do Módulo Fiscal](#2-escopo-do-módulo-fiscal)
3. [Documentos Fiscais Suportados](#3-documentos-fiscais-suportados)
4. [Arquitetura do Serviço](#4-arquitetura-do-serviço)
5. [Fluxos de Emissão](#5-fluxos-de-emissão)
6. [Integrações com Módulos Externos](#6-integrações-com-módulos-externos)
7. [Contratos de Integração (Interfaces)](#7-contratos-de-integração-interfaces)
8. [Modelo de Dados](#8-modelo-de-dados)
9. [Regras de Negócio](#9-regras-de-negócio)
10. [Requisitos Não Funcionais](#10-requisitos-não-funcionais)
11. [Arquitetura de Alta Carga (100k+ req/min)](#11-arquitetura-de-alta-carga-100k-reqmin)
12. [Estrutura de Pastas](#12-estrutura-de-pastas)
13. [Roadmap de Entregas](#13-roadmap-de-entregas)

---

## 1. Visão Geral

O **Módulo Fiscal** é um serviço independente e auto-contido, responsável por toda a lógica de emissão, consulta, cancelamento e inutilização de documentos fiscais eletrônicos perante a SEFAZ. Ele expõe uma API REST interna que os demais módulos do sistema (Financeiro, Estoque, Cadastro de Produtos, Compras) consomem via contratos de integração bem definidos.

### Princípios de Design

- **Módulo isolado:** nenhum outro módulo acessa diretamente o banco de dados fiscal
- **Comunicação via contratos:** integrações acontecem por interfaces TypeScript + eventos assíncronos
- **Idempotente:** re-envios não geram duplicidade de emissão
- **Rastreável:** cada documento possui ciclo de vida auditável completo
- **Multi-empresa:** suporte a múltiplos CNPJs/certificados digitais

---

## 2. Escopo do Módulo Fiscal

### O que este módulo FAZ

- Geração e assinatura digital do XML dos documentos fiscais
- Comunicação com os webservices da SEFAZ (homologação e produção)
- Tratamento de todos os status de retorno: **Autorizada**, **Rejeitada**, **Denegada**, **Cancelada**, **Inutilizada**
- Geração do DANFE, DACTE, DAMDFE, DACIOT e documentos auxiliares
- Armazenamento dos XMLs autorizados e seus eventos
- Consulta de situação de documentos na SEFAZ
- Emissão em contingência (SCAN, DPEC, NFC-e offline)
- Controle de numeração e série dos documentos
- Inutilização de faixas de numeração
- Recepção e armazenamento de XML de documentos de entrada (NF-e de fornecedores)

### O que este módulo NÃO FAZ (responsabilidade de outros módulos)

- Cadastro de produtos, preços e tributação de produto — **Módulo de Produtos**
- Geração de títulos financeiros (contas a receber/pagar) — **Módulo Financeiro**
- Entrada/saída de estoque — **Módulo de Estoque**
- Cadastro de clientes e fornecedores — **Módulo de Cadastro**
- Regras de pedido e faturamento — **Módulo Comercial**

---

## 3. Documentos Fiscais Suportados

| Documento | Descrição | Autoridade | Prioridade |
|---|---|---|---|
| **NF-e** | Nota Fiscal Eletrônica (modelo 55) | SEFAZ Estadual | P0 |
| **NFC-e** | Nota Fiscal de Consumidor Eletrônica (modelo 65) | SEFAZ Estadual | P0 |
| **CT-e** | Conhecimento de Transporte Eletrônico (modelo 57) | SEFAZ Estadual | P1 |
| **MDF-e** | Manifesto Eletrônico de Documentos Fiscais (modelo 58) | SEFAZ Nacional | P1 |
| **CIOT** | Código Identificador da Operação de Transporte | ANTT | P1 |
| **SPED Fiscal** | Escrituração Fiscal Digital (EFD ICMS/IPI) | SEFAZ/RFB | P2 |
| **SPED Contribuições** | EFD PIS/COFINS | RFB | P2 |
| **NF Rural** | Nota Fiscal Avulsa / Nota Produtor Rural | SEAGRI/SEFAZ | P2 |

### Versões de Schema Suportadas

- NF-e / NFC-e: NT 2024.001 (schema 4.00)
- CT-e: schema 3.00
- MDF-e: schema 3.00
- CIOT: layout ANTT vigente

---

## 4. Arquitetura do Serviço

```
┌─────────────────────────────────────────────────────────────────┐
│                        MÓDULO FISCAL                            │
│                                                                 │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────────┐   │
│  │  API REST    │   │  Job Queue   │   │  Event Publisher │   │
│  │  (Express)   │   │  (BullMQ)    │   │  (RabbitMQ/Redis)│   │
│  └──────┬───────┘   └──────┬───────┘   └────────┬─────────┘   │
│         │                  │                     │              │
│  ┌──────▼──────────────────▼─────────────────────▼──────────┐  │
│  │                    Core Use Cases                         │  │
│  │  EmitirDocumento │ CancelarDocumento │ InutilizarNumero   │  │
│  │  ConsultarSefaz  │ CartaCorrecao     │ EmitirContingencia │  │
│  └──────────────────────────┬────────────────────────────────┘  │
│                             │                                   │
│  ┌────────────────┬─────────▼──────────┬───────────────────┐   │
│  │  XML Builder   │  Assinatura Digital │  SEFAZ Client     │   │
│  │  (xmlbuilder2) │  (node-forge / pkcs)│  (soap/axios)     │   │
│  └────────────────┴────────────────────┴───────────────────┘   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   Repositórios                           │   │
│  │  DocumentoFiscalRepo │ EventoFiscalRepo │ NumeracaoRepo  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Banco de Dados (PostgreSQL)                  │   │
│  │  documentos_fiscais │ eventos_fiscais │ xmls_autorizados  │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
          │                    │                    │
          ▼                    ▼                    ▼
   Módulo Financeiro    Módulo Estoque      Módulo Produtos
   (consome eventos)   (consome eventos)   (fornece dados)
```

### Componentes Internos

#### 4.1 API REST

Endpoint base: `/api/v1/fiscal`

Responsável por receber as requisições dos módulos externos e retornar o resultado da emissão de forma síncrona (quando possível) ou um ticket de acompanhamento.

#### 4.2 Job Queue (BullMQ)

Filas assíncronas para:
- `queue:emissao` — processamento de emissões em lote
- `queue:consulta-sefaz` — reprocessamento de documentos pendentes
- `queue:contingencia` — fila de contingência offline
- `queue:distribuicao` — distribuição de XML para destinatários

#### 4.3 Event Publisher

Após cada mudança de status de um documento fiscal, o módulo publica eventos que os demais módulos consomem de forma assíncrona:

| Evento | Publicado quando |
|---|---|
| `fiscal.documento.autorizado` | SEFAZ retorna cStat 100 |
| `fiscal.documento.rejeitado` | SEFAZ retorna rejeição |
| `fiscal.documento.denegado` | SEFAZ retorna denégação |
| `fiscal.documento.cancelado` | Cancelamento autorizado |
| `fiscal.documento.carta_correcao` | CC-e autorizada |
| `fiscal.contingencia.iniciada` | Sistema entra em contingência |
| `fiscal.contingencia.encerrada` | Transmissão normalizada |

---

## 5. Fluxos de Emissão

### 5.1 Fluxo Normal — Documento Autorizado

```
Módulo Solicitante
      │
      │ POST /api/v1/fiscal/emitir
      │ { tipo, dadosNota, chaveOrigem }
      ▼
┌─────────────────────┐
│  Validação inicial  │◄── Verifica campos obrigatórios,
│  (schema + regras)  │    CNPJ emitente, certificado ativo
└──────────┬──────────┘
           │ OK
           ▼
┌─────────────────────┐
│ Enriquecimento      │◄── Busca dados via Integration Services:
│ dos dados           │    - Produto: NCM, CFOP, tributação
└──────────┬──────────┘    - Cadastro: endereço, IE, CNPJ/CPF
           │
           ▼
┌─────────────────────┐
│  Gera numeração     │◄── Controle interno de série/número
│  (série + número)   │    com lock de concorrência
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Monta XML          │◄── xmlbuilder2 conforme layout SEFAZ
│  (XML Builder)      │    Calcula impostos, totais, chave de acesso
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Assina digitalmente│◄── Certificado A1 (.pfx) ou A3 (HSM)
│  (PKCS#7 / RSA)     │    Canonicalização C14N
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Envia para SEFAZ   │◄── SOAP / HTTPS mTLS
│  (NfeAutorizacao)   │    Timeout: 30s, retry: 3x
└──────────┬──────────┘
           │
     ┌─────▼──────────┐
     │  cStat = 100?  │
     └─────┬──────────┘
    SIM    │    NÃO
     │     │     └──► ver 5.2 (Rejeitada) ou 5.3 (Denegada)
     ▼     │
┌──────────────────────┐
│  Persiste XML        │
│  autorizado + chave  │
│  Atualiza status     │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  Publica evento      │  fiscal.documento.autorizado
│  fiscal.autorizado   │  { chaveAcesso, tipo, chaveOrigem,
└──────────┬───────────┘    valorTotal, emitenteCNPJ, ... }
           │
           ▼
    Retorna ao solicitante:
    { status: "AUTORIZADO", chaveAcesso, xmlBase64, pdf }
```

### 5.2 Fluxo — Documento Rejeitado

Uma rejeição da SEFAZ indica erro nos dados informados. O documento **não possui validade fiscal** e pode ser corrigido e reenviado.

```
SEFAZ retorna cStat != 100 e != 110
           │
           ▼
┌──────────────────────┐
│  Classifica rejeição │◄── cStat mapeado para mensagem
│  (cStat + xMotivo)   │    amigável em português
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  Persiste tentativa  │  status = REJEITADO
│  com log do erro     │  cStat, xMotivo, XML enviado
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  Publica evento      │  fiscal.documento.rejeitado
│  fiscal.rejeitado    │  { motivo, cStat, correcoesSugeridas }
└──────────┬───────────┘
           │
           ▼
    Retorna ao solicitante:
    { status: "REJEITADO", cStat, motivo, correcoesSugeridas }

IMPORTANTE:
- Numeração NÃO é consumida (pode ser reutilizada)
- O solicitante deve corrigir os dados e reenviar
- Rejeições comuns: NCM inválido, CFOP inconsistente,
  IE inválida, alíquota incompatível com UF
```

### 5.3 Fluxo — Documento Denegado

Uma denégação indica irregularidade fiscal no emitente ou destinatário. O número **É consumido** e o documento não pode ser utilizado.

```
SEFAZ retorna cStat = 110 (ou similar)
           │
           ▼
┌──────────────────────┐
│  Persiste como       │  status = DENEGADO
│  DENEGADO            │  XML denegado deve ser guardado
└──────────┬───────────┘  (obrigação legal - 5 anos)
           │
           ▼
┌──────────────────────┐
│  Publica evento      │  fiscal.documento.denegado
│  fiscal.denegado     │  { chaveAcesso, motivo, numero }
└──────────┬───────────┘
           │
           ▼
    Retorna ao solicitante:
    { status: "DENEGADO", chaveAcesso, motivo }

IMPORTANTE:
- Numeração É consumida (não pode ser reutilizada)
- Emitente deve regularizar situação cadastral na SEFAZ
- Módulo Financeiro NÃO deve gerar título para doc denegado
- Módulo Estoque NÃO deve movimentar estoque
```

### 5.4 Fluxo — Cancelamento

```
POST /api/v1/fiscal/{chaveAcesso}/cancelar
{ justificativa } (min. 15 caracteres)
      │
      ▼
┌──────────────────────┐
│  Validações          │◄── Prazo: até 24h após autorização (NFC-e)
│  - Prazo legal       │    ou 30 dias (NF-e, CT-e)
│  - Status atual      │    Status deve ser AUTORIZADO
│  - Justificativa     │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  Gera e assina       │
│  XML do evento       │
│  NFeEvento (110111)  │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  Envia para SEFAZ    │
│  NfeRecepcaoEvento   │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  Persiste evento     │  status = CANCELADO
│  e XML de retorno    │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  Publica evento      │  fiscal.documento.cancelado
└──────────────────────┘  → Financeiro: cancela/estorna título
                          → Estoque: estorna movimentação
```

### 5.5 Fluxo — Contingência (NFC-e Offline)

```
Monitor detecta SEFAZ indisponível
           │
           ▼
┌──────────────────────┐
│  Ativa modo          │  Persiste flag por empresa/série
│  contingência        │  Registra data/hora de início
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  Emite documentos    │  XML com tpEmis = 9 (offline)
│  em modo offline     │  DANFE com marca d'água "CONTINGÊNCIA"
└──────────┬───────────┘
           │
           ▼  (quando SEFAZ volta)
┌──────────────────────┐
│  Transmite lote de   │  Processa fila queue:contingencia
│  contingência        │  Reconcilia status de cada documento
└──────────────────────┘
```

---

## 6. Integrações com Módulos Externos

O Módulo Fiscal **nunca chama diretamente** outro módulo. Toda comunicação ocorre via:

- **Entrada:** outros módulos chamam a API REST do Módulo Fiscal
- **Saída:** Módulo Fiscal publica eventos; outros módulos se inscrevem

```
                    ┌─────────────────────┐
                    │    MÓDULO FISCAL     │
                    │                     │
   ─── REST ──────► │  /api/v1/fiscal/*   │ ─── Eventos ──►  Fila de Mensagens
                    │                     │
                    └─────────────────────┘
                              ▲
                    ┌─────────┴──────────┐
                    │  Integration Layer  │  (chamadas síncronas internas
                    │  (somente leitura)  │   para enriquecer o XML)
                    └─────────┬──────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
       Produtos API     Cadastro API     Empresa API
       (NCM, CFOP,      (endereço,       (certificado,
        tributação)      IE, CNPJ)        regime)
```

### 6.1 Integração com Módulo de Produtos

**Direção:** Módulo Fiscal consulta Módulo de Produtos (síncrono, somente leitura)

**Quando ocorre:** durante o enriquecimento do XML, antes da assinatura

**Dados consumidos:**

| Campo | Descrição | Obrigatório |
|---|---|---|
| `codigoProduto` | Código interno do produto | Sim |
| `descricao` | Descrição completa para XML | Sim |
| `ncm` | Nomenclatura Comum do Mercosul | Sim |
| `cfop` | Código Fiscal de Operações e Prestações | Sim |
| `unidadeComercial` | UN, KG, CX, etc. | Sim |
| `ean` | GTIN/EAN do produto | Não |
| `origem` | Origem da mercadoria (0-8) | Sim |
| `cst_icms` | CST ou CSOSN conforme regime | Sim |
| `aliquota_icms` | Alíquota ICMS | Condicional |
| `cst_pis` | CST PIS | Sim |
| `cst_cofins` | CST COFINS | Sim |
| `aliquota_pis` | Alíquota PIS | Condicional |
| `aliquota_cofins` | Alíquota COFINS | Condicional |
| `cest` | CEST (substituição tributária) | Condicional |
| `extipi` | Ex-TIPI | Não |

**Contrato (Interface TypeScript):**

```typescript
// Exposto pelo Módulo de Produtos
interface ProdutoFiscalDTO {
  codigoProduto: string;
  codigoBarras?: string;
  descricao: string;
  ncm: string;
  cfop: string;
  unidadeComercial: string;
  unidadeTributavel?: string;
  origem: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  cest?: string;
  extipi?: string;
  tributacao: {
    icms: TributacaoICMS;
    pis: TributacaoPIS;
    cofins: TributacaoCOFINS;
    ipi?: TributacaoIPI;
  };
}

interface TributacaoICMS {
  cst: string;           // CST ou CSOSN
  modalidadeBC?: number;
  aliquota?: number;
  reducaoBC?: number;
  stMargemValorAdicionado?: number;
  stAliquota?: number;
}
```

**Importante:** Se o Módulo de Produtos retornar dados incompletos (ex: NCM ausente), o Módulo Fiscal **rejeita internamente** antes de tentar transmitir para a SEFAZ, retornando erro descritivo ao solicitante.

### 6.2 Integração com Módulo Financeiro

**Direção:** Módulo Fiscal → publica evento → Módulo Financeiro consome (assíncrono)

**O Módulo Financeiro NUNCA chama o Módulo Fiscal para perguntar se a nota foi emitida.** Ele reage aos eventos publicados.

**Eventos e ações esperadas:**

| Evento Fiscal | Ação no Módulo Financeiro |
|---|---|
| `fiscal.documento.autorizado` | Gerar título a receber (venda) ou a pagar (compra/frete) conforme condição de pagamento da nota |
| `fiscal.documento.rejeitado` | Nenhuma ação financeira; aguardar nova emissão |
| `fiscal.documento.denegado` | Nenhuma ação financeira; bloquear geração de título para esta chave |
| `fiscal.documento.cancelado` | Cancelar ou estornar o título vinculado |
| `fiscal.documento.carta_correcao` | Registrar log na conta corrente do título, sem alteração de valor |

**Payload do evento `fiscal.documento.autorizado`:**

```typescript
interface FiscalDocumentoAutorizadoEvent {
  eventId: string;
  occurredAt: Date;
  tipo: 'NFE' | 'NFCE' | 'CTE' | 'MDFE';
  chaveAcesso: string;         // 44 dígitos
  chaveOrigem: string;         // ID do pedido/OS no módulo solicitante
  numeroDocumento: number;
  serie: string;
  dataEmissao: Date;
  dataCompetencia: Date;
  emitente: {
    cnpj: string;
    razaoSocial: string;
  };
  destinatario: {
    cnpjCpf: string;
    razaoSocial: string;
  };
  totais: {
    valorProdutos: number;
    valorFrete: number;
    valorDesconto: number;
    valorImpostos: number;
    valorTotal: number;
  };
  pagamentos: Array<{
    formaPagamento: string;   // 01=Dinheiro, 03=Cartão, 15=Boleto...
    valor: number;
    vencimento?: Date;
  }>;
  naturezaOperacao: string;
  cfop: string;
  xmlBase64: string;
}
```

**Regra importante:** O Módulo Financeiro deve usar `chaveOrigem` para vincular o título ao pedido/OS que originou a nota, permitindo rastreabilidade completa.

### 6.3 Integração com Módulo de Estoque

**Direção:** Módulo Fiscal → publica evento → Módulo Estoque consome (assíncrono)

**Eventos e ações esperadas:**

| Evento Fiscal | Ação no Módulo de Estoque |
|---|---|
| `fiscal.documento.autorizado` | Confirmar movimentação de estoque vinculada (saída para vendas, entrada para compras) |
| `fiscal.documento.rejeitado` | Manter estoque reservado; aguardar reemissão |
| `fiscal.documento.denegado` | Liberar reserva; NÃO confirmar movimentação |
| `fiscal.documento.cancelado` | Estornar a movimentação confirmada |

**Payload adicional para estoque no evento autorizado:**

```typescript
interface ItemFiscalParaEstoque {
  codigoProduto: string;
  descricao: string;
  ncm: string;
  cfop: string;
  quantidade: number;
  unidade: string;
  valorUnitario: number;
  numeroLote?: string;
  dataValidade?: Date;
  numeroPedidoItem?: string;  // referência ao item do pedido
}
```

**Modelo de reserva de estoque:**

Antes da emissão, o Módulo Comercial/Estoque deve criar uma **reserva** vinculada ao `chaveOrigem`. O Módulo Fiscal, ao autorizar, publica o evento para que o Estoque converta a reserva em movimentação definitiva. Em caso de rejeição, a reserva permanece ativa para uma nova tentativa.

### 6.4 Integração com Módulo de Cadastro

**Direção:** Módulo Fiscal consulta Módulo de Cadastro (síncrono, somente leitura)

**Dados consumidos para compor o XML:**

```typescript
interface CadastroFiscalDTO {
  cnpjCpf: string;
  razaoSocial: string;
  nomeFantasia?: string;
  inscricaoEstadual?: string;
  inscricaoMunicipal?: string;
  suframa?: string;
  endereco: {
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    codigoMunicipio: string; // IBGE
    nomeMunicipio: string;
    uf: string;
    cep: string;
    codigoPais: string;     // 1058 = Brasil
    nomePais: string;
    telefone?: string;
  };
  email?: string;
  indicadorIE: 1 | 2 | 9;  // 1=Contribuinte, 2=Isento, 9=Não contribuinte
}
```

---

## 7. Contratos de Integração (Interfaces)

### 7.1 Interface de Emissão — Entrada

```typescript
// POST /api/v1/fiscal/emitir
interface EmitirDocumentoRequest {
  tipo: TipoDocumentoFiscal;
  empresaId: string;
  chaveOrigem: string;       // ID único no sistema solicitante (pedido, OS, etc.)
  idempotencyKey: string;    // Garante que reenvios não duplicam emissão
  naturezaOperacao: string;
  dataEmissao?: Date;        // Default: now()
  finalidade: FinalidadeNFe;
  presencaComprador?: IndicadorPresenca;
  emitente?: Partial<CadastroFiscalDTO>; // Se omitido, busca da empresa
  destinatario: CadastroFiscalDTO;
  transporte?: DadosTransporte;
  itens: ItemDocumentoFiscal[];
  pagamentos: PagamentoDocumento[];
  informacoesAdicionais?: string;
  informacoesContribuinte?: string;
  referenciaDocumentos?: string[];  // Chaves de acesso referenciadas
}

interface ItemDocumentoFiscal {
  numeroItem: number;
  codigoProduto: string;
  quantidade: number;
  valorUnitario: number;
  valorDesconto?: number;
  frete?: number;
  seguro?: number;
  outrasDespesas?: number;
  cfopOverride?: string;         // Sobrescreve CFOP do cadastro do produto
  tributacaoOverride?: Partial<TributacaoICMS>; // Sobrescreve tributação
  numeroPedidoItem?: string;
  numeroLote?: string;
  dataValidade?: Date;
}

type TipoDocumentoFiscal = 'NFE' | 'NFCE' | 'CTE' | 'MDFE';
type FinalidadeNFe = 1 | 2 | 3 | 4; // 1=Normal, 2=Complementar, 3=Ajuste, 4=Devolução
type IndicadorPresenca = 0 | 1 | 2 | 3 | 4 | 5 | 9;
```

### 7.2 Interface de Emissão — Saída

```typescript
interface EmitirDocumentoResponse {
  documentoId: string;
  status: StatusDocumentoFiscal;
  chaveAcesso?: string;
  numero?: number;
  serie?: string;
  dataAutorizacao?: Date;
  protocolo?: string;
  xmlAutorizadoBase64?: string;
  pdfBase64?: string;
  // Em caso de rejeição
  rejeicao?: {
    cStat: number;
    xMotivo: string;
    correcoesSugeridas?: string[];
  };
  // Em caso de erro interno
  erro?: {
    codigo: string;
    mensagem: string;
    detalhes?: unknown;
  };
}

type StatusDocumentoFiscal =
  | 'AUTORIZADO'
  | 'REJEITADO'
  | 'DENEGADO'
  | 'CANCELADO'
  | 'INUTILIZADO'
  | 'EM_PROCESSAMENTO'
  | 'CONTINGENCIA'
  | 'ERRO_INTERNO';
```

### 7.3 Outros Endpoints da API REST

```
GET  /api/v1/fiscal/:chaveAcesso
     → Retorna dados e status do documento

GET  /api/v1/fiscal/:chaveAcesso/xml
     → Retorna XML autorizado (base64)

GET  /api/v1/fiscal/:chaveAcesso/pdf
     → Retorna DANFE/DAC-TE/etc. em PDF (base64)

POST /api/v1/fiscal/:chaveAcesso/cancelar
     Body: { justificativa: string }
     → Inicia fluxo de cancelamento

POST /api/v1/fiscal/:chaveAcesso/carta-correcao
     Body: { correcao: string }
     → Emite CC-e

POST /api/v1/fiscal/inutilizar
     Body: { serie, numeroInicial, numeroFinal, justificativa }
     → Inutiliza faixa de numeração

POST /api/v1/fiscal/consultar-sefaz/:chaveAcesso
     → Consulta situação em tempo real na SEFAZ

GET  /api/v1/fiscal/numeracao/:tipo/:serie
     → Retorna próximo número disponível

POST /api/v1/fiscal/entrada/xml
     Body: { xmlBase64 }
     → Registra XML de entrada (NF-e de fornecedor)

GET  /api/v1/fiscal/sefaz/status
     → Status dos webservices da SEFAZ por UF
```

---

## 8. Modelo de Dados

### Tabela: `documentos_fiscais`

```sql
CREATE TABLE documentos_fiscais (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id          UUID NOT NULL,
  tipo                VARCHAR(10) NOT NULL,     -- NFE, NFCE, CTE, MDFE
  chave_acesso        CHAR(44) UNIQUE,
  numero              INTEGER,
  serie               VARCHAR(3),
  status              VARCHAR(30) NOT NULL,
  finalidade          SMALLINT,
  natureza_operacao   VARCHAR(60),
  data_emissao        TIMESTAMPTZ,
  data_autorizacao    TIMESTAMPTZ,
  protocolo           VARCHAR(30),
  c_stat              SMALLINT,
  x_motivo            TEXT,
  chave_origem        VARCHAR(255) NOT NULL,    -- ID no módulo solicitante
  idempotency_key     VARCHAR(255) UNIQUE,
  cnpj_emitente       VARCHAR(14) NOT NULL,
  cnpj_cpf_dest       VARCHAR(14),
  razao_social_dest   VARCHAR(60),
  valor_total         NUMERIC(15,2),
  ambiente            CHAR(1) NOT NULL,         -- 1=Produção, 2=Homologação
  contingencia        BOOLEAN DEFAULT FALSE,
  tipo_contingencia   VARCHAR(10),
  criado_em           TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_docfiscal_empresa     ON documentos_fiscais(empresa_id);
CREATE INDEX idx_docfiscal_chaveorigem ON documentos_fiscais(chave_origem);
CREATE INDEX idx_docfiscal_status      ON documentos_fiscais(status);
CREATE INDEX idx_docfiscal_emissao     ON documentos_fiscais(data_emissao);
```

### Tabela: `documentos_fiscais_xml`

```sql
CREATE TABLE documentos_fiscais_xml (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  documento_id    UUID NOT NULL REFERENCES documentos_fiscais(id),
  tipo_xml        VARCHAR(20) NOT NULL,  -- ENVIADO, AUTORIZADO, CANCELAMENTO, INUTILIZACAO
  xml             TEXT NOT NULL,
  criado_em       TIMESTAMPTZ DEFAULT NOW()
);
```

### Tabela: `eventos_fiscais`

```sql
CREATE TABLE eventos_fiscais (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  documento_id    UUID NOT NULL REFERENCES documentos_fiscais(id),
  tipo_evento     VARCHAR(10) NOT NULL,   -- 110111=Cancel, 110110=CC-e, etc.
  descricao       TEXT,
  n_prot          VARCHAR(30),
  c_stat          SMALLINT,
  xml_evento      TEXT,
  xml_retorno     TEXT,
  criado_em       TIMESTAMPTZ DEFAULT NOW()
);
```

### Tabela: `numeracao_fiscal`

```sql
CREATE TABLE numeracao_fiscal (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id      UUID NOT NULL,
  tipo            VARCHAR(10) NOT NULL,
  serie           VARCHAR(3) NOT NULL,
  ultimo_numero   INTEGER NOT NULL DEFAULT 0,
  ambiente        CHAR(1) NOT NULL,
  criado_em       TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(empresa_id, tipo, serie, ambiente)
);
```

### Tabela: `inutilizacoes`

```sql
CREATE TABLE inutilizacoes (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id        UUID NOT NULL,
  tipo              VARCHAR(10) NOT NULL,
  serie             VARCHAR(3) NOT NULL,
  numero_inicial    INTEGER NOT NULL,
  numero_final      INTEGER NOT NULL,
  justificativa     TEXT NOT NULL,
  n_prot            VARCHAR(30),
  c_stat            SMALLINT,
  xml_retorno       TEXT,
  criado_em         TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 9. Regras de Negócio

### 9.1 Idempotência

Toda requisição de emissão deve conter `idempotencyKey`. Se uma emissão com a mesma chave já existir, o serviço retorna o resultado anterior sem reprocessar. Isso protege contra duplicidades em caso de timeout ou retry do solicitante.

### 9.2 Numeração Sequencial

A numeração é controlada exclusivamente pelo Módulo Fiscal via lock pessimista no banco de dados. Nenhum módulo externo define ou reserva número de nota. O número só é incrementado após a transmissão para a SEFAZ (ou entrada em contingência). Em caso de rejeição, o número **não é incrementado** — é consumido somente em caso de autorização ou denégação.

### 9.3 Geração de Títulos Financeiros

- **NF-e de venda autorizada:** gera título a receber, respeitando as condições de pagamento informadas nos `<detPag>` do XML
- **NF-e de compra/entrada autorizada:** gera título a pagar com base nos dados do transportador/fornecedor
- **NF-e rejeitada ou denegada:** nenhum título é gerado
- **Cancelamento:** título vinculado deve ser cancelado antes do vencimento ou estornado se já liquidado

### 9.4 Movimentação de Estoque

- O Módulo de Estoque controla as movimentações; o Módulo Fiscal apenas notifica via evento
- O CFOP determina a natureza da movimentação (entrada/saída, com/sem circulação de mercadoria)
- CFOPs de devolução (5.201, 5.202, 6.201, etc.) devem ser tratados como estorno pelo módulo de estoque

### 9.5 Documentos Denegados

Documentos denegados devem ser armazenados por no mínimo **5 anos** (obrigação legal). Não podem ser cancelados. O emitente deve regularizar sua situação cadastral na SEFAZ antes de emitir novas notas.

### 9.6 Certificado Digital

- Suporte a certificado A1 (arquivo `.pfx` em cofre de secrets) e A3 (via integração com HSM)
- Alertas automáticos de vencimento de certificado (90, 30 e 7 dias antes)
- Múltiplos certificados por empresa (para CNPJ matriz + filiais)

### 9.7 Contingência

- NFC-e: suporta contingência offline (tpEmis = 9)
- NF-e: suporta SCAN (tpEmis = 3) e SVC-RS/SVC-AN (tpEmis = 6/7)
- CT-e: suporte a SCAN
- Documentos em contingência devem ser transmitidos em até **168 horas** após a emissão

---

## 10. Requisitos Não Funcionais

### 10.1 Performance

| Métrica | Meta |
|---|---|
| Tempo de emissão (NF-e normal) | < 5 segundos (P95) |
| Tempo de emissão (NFC-e) | < 3 segundos (P95) |
| Throughput simultâneo | 50 emissões/segundo |
| Disponibilidade | 99,9% (excluindo indisponibilidade SEFAZ) |

### 10.2 Segurança

- Certificados digitais armazenados em cofre de secrets (ex: HashiCorp Vault, AWS Secrets Manager)
- Comunicação interna via mTLS ou JWT assinado
- Logs de auditoria imutáveis de todas as operações
- Dados de XML armazenados criptografados em repouso
- API autenticada via API Key + Bearer Token (escopo fiscal)
- Rate limiting por empresa: 100 req/min

### 10.3 Observabilidade

- Tracing distribuído (OpenTelemetry)
- Métricas por tipo de documento: emitidos, rejeitados, denegados, cancelados
- Alertas para: taxa de rejeição > 5%, SEFAZ indisponível, certificado próximo do vencimento
- Dashboard de saúde dos webservices da SEFAZ por UF

### 10.4 Resiliência

- Retry automático com backoff exponencial para falhas de comunicação SEFAZ
- Circuit breaker por UF/webservice
- Fila de contingência persistida (não perde dados se o serviço reiniciar)
- Graceful shutdown: aguarda processamento da fila antes de desligar

---

## 11. Arquitetura de Alta Carga (100k+ req/min)

### 11.1 Análise de Capacidade e Gargalos

Antes de escalar, é essencial entender onde estão os limites reais do sistema. Há três gargalos independentes que precisam ser endereçados separadamente:

| Gargalo | Natureza | Impacto | Solução |
|---|---|---|---|
| **SEFAZ** | I/O externo com throttling por UF | Até 8s por lote, limite de 50 NF-e/lote | Batching + pool de conexões por UF |
| **Assinatura XML (RSA)** | CPU-bound, bloqueia event loop | Degrada todo o processo Node | Worker Threads dedicadas |
| **Numeração fiscal** | Lock pessimista no banco | Serializa escritas sob concorrência | Pré-alocação em blocos |
| **Banco de dados** | Write contention | Gargalo após 5k writes/s | PgBouncer + particionamento |

**Referência de capacidade por configuração:**

| Configuração | Capacidade estimada |
|---|---|
| 1 pod Node sem fila | ~200 notas/min |
| 3 pods + BullMQ + PostgreSQL | ~5.000 notas/min |
| 10 pods + Redis cluster + PgBouncer | ~30.000 notas/min |
| K8s autoscaling + todas as otimizações abaixo | **100.000–200.000 notas/min** |

---

### 11.2 Visão Geral da Arquitetura de Alta Carga

```
┌──────────────────────────────────────────────────────────────────────┐
│                         CLIENTES EXTERNOS                            │
│            (Módulo Comercial, PDV, Integração ERP, etc.)             │
└───────────────────────────────┬──────────────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────────┐
│                      API GATEWAY / LOAD BALANCER                     │
│              nginx / AWS ALB / Traefik — mTLS + rate limit           │
└───────────────────────────────┬──────────────────────────────────────┘
                                │
                    ┌───────────┴───────────┐
                    ▼                       ▼
             ┌────────────┐         ┌────────────┐
             │  API Pod 1 │   ...   │  API Pod N │   (sem estado)
             │  Node/TS   │         │  Node/TS   │   apenas valida
             │  (stateless│         │  (stateless│   e enfileira
             └─────┬──────┘         └─────┬──────┘
                   │                      │
                   └──────────┬───────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────────┐
│                       REDIS CLUSTER (3+ nós)                         │
│                                                                      │
│   queue:validacao          queue:xml-build        queue:assinatura   │
│   queue:transmissao:{UF}   queue:persistencia     queue:contingencia │
│   queue:eventos            queue:pdf                                 │
└──────────────────────────────────────────────────────────────────────┘
         │               │               │               │
         ▼               ▼               ▼               ▼
  ┌────────────┐  ┌────────────┐  ┌──────────────┐  ┌────────────────┐
  │ XML Worker │  │ Sign Worker│  │ SEFAZ Worker │  │ Persist Worker │
  │ (N pods)   │  │ (N pods)   │  │ (N pods/UF)  │  │ (N pods)       │
  │ xmlbuilder2│  │ Worker     │  │ Batcher 50x  │  │ bulk insert    │
  │            │  │ Threads    │  │ Circuit Break│  │                │
  └────────────┘  └────────────┘  └──────┬───────┘  └────────────────┘
                                         │
                              ┌──────────┴──────────┐
                              ▼                     ▼
                       ┌────────────┐        ┌────────────┐
                       │  SEFAZ SP  │  ...   │  SEFAZ RS  │
                       │  SEFAZ RJ  │        │  SEFAZ MG  │
                       └────────────┘        └────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    PostgreSQL + PgBouncer                            │
│                                                                      │
│  Primary (writes)    Replica 1 (reads)    Replica 2 (reads)         │
│  PgBouncer pool      PgBouncer pool       PgBouncer pool            │
└──────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────────────┐
│                  EVENT BUS (RabbitMQ ou Kafka)                       │
│          fiscal.documento.autorizado / rejeitado / denegado          │
│          Consumido por: Financeiro, Estoque, Auditoria               │
└──────────────────────────────────────────────────────────────────────┘
```

---

### 11.3 Pipeline de Processamento em Estágios

O processamento de uma nota é quebrado em **5 estágios independentes**, cada um com sua própria fila e pool de workers escaláveis:

```
Estágio 1: RECEPÇÃO (API Pod)
  → Valida schema básico + idempotência
  → Responde ticket imediatamente (< 50ms)
  → Enfileira em queue:xml-build
         │
         ▼
Estágio 2: BUILD XML (XML Worker)
  → Enriquece dados (Produtos, Cadastro)
  → Monta XML conforme layout SEFAZ
  → Aloca numeração do pool em memória
  → Enfileira em queue:assinatura
         │
         ▼
Estágio 3: ASSINATURA (Sign Worker — Worker Threads)
  → Assina digitalmente em thread separada (não bloqueia event loop)
  → Enfileira em queue:transmissao:{UF}
         │
         ▼
Estágio 4: TRANSMISSÃO SEFAZ (Sefaz Worker por UF)
  → Agrupa em lotes de até 50 notas (batching)
  → Envia lote SOAP para SEFAZ
  → Distribui resultados por chave de acesso
  → Enfileira em queue:persistencia
         │
         ▼
Estágio 5: PERSISTÊNCIA + EVENTOS (Persist Worker)
  → Bulk insert no PostgreSQL
  → Publica eventos no RabbitMQ/Kafka
  → Atualiza status do ticket
```

Cada estágio pode ser escalado **independentemente** conforme o gargalo identificado em produção.

---

### 11.4 Pré-alocação de Numeração Fiscal

O controle sequencial de numeração com `SELECT FOR UPDATE` por nota é inviável em alta carga — gera fila de locks no PostgreSQL. A solução é pré-alocar blocos de números em memória por instância de worker:

```typescript
// src/infra/numeracao/NumeracaoPool.ts
export class NumeracaoPool {
  private readonly pools = new Map<string, number[]>();
  private readonly reabastecendo = new Set<string>();
  private readonly BLOCK_SIZE = 1000;
  private readonly REABASTECE_QUANDO = 100; // reabastece quando restam 100

  async getNextNumero(empresaId: string, serie: string, tipo: string): Promise<number> {
    const key = `${empresaId}:${serie}:${tipo}`;
    const pool = this.pools.get(key) ?? [];

    if (pool.length <= this.REABASTECE_QUANDO && !this.reabastecendo.has(key)) {
      // Reabastece em background sem bloquear a requisição atual
      this.reabastecerBloco(key, empresaId, serie, tipo).catch(console.error);
    }

    if (pool.length === 0) {
      // Pool vazio: reabastece de forma síncrona (só ocorre na inicialização)
      await this.reabastecerBloco(key, empresaId, serie, tipo);
    }

    return this.pools.get(key)!.shift()!;
  }

  private async reabastecerBloco(
    key: string, empresaId: string, serie: string, tipo: string
  ): Promise<void> {
    if (this.reabastecendo.has(key)) return;
    this.reabastecendo.add(key);

    try {
      const inicio = await db.transaction(async (trx) => {
        const row = await trx('numeracao_fiscal')
          .where({ empresa_id: empresaId, serie, tipo })
          .forUpdate()
          .first();

        const novoUltimo = row.ultimo_numero + this.BLOCK_SIZE;
        await trx('numeracao_fiscal')
          .where({ empresa_id: empresaId, serie, tipo })
          .update({ ultimo_numero: novoUltimo, atualizado_em: new Date() });

        return row.ultimo_numero + 1;
      });

      const bloco = Array.from({ length: this.BLOCK_SIZE }, (_, i) => inicio + i);
      const poolAtual = this.pools.get(key) ?? [];
      this.pools.set(key, [...poolAtual, ...bloco]);
    } finally {
      this.reabastecendo.delete(key);
    }
  }
}
```

**Consequência importante:** Se um worker reiniciar com números alocados em memória não utilizados, esses números serão inutilizados automaticamente como "nunca emitidos" via job de reconciliação noturno.

---

### 11.5 Assinatura Digital com Worker Threads

A assinatura RSA/SHA-1 é uma operação **CPU-bound** que bloqueia o event loop do Node.js se executada na thread principal. Com Worker Threads, cada assinatura ocorre em paralelo sem impacto no throughput da fila:

```typescript
// src/infra/xml/signing/SignerPool.ts
import { Worker } from 'worker_threads';
import { cpus } from 'os';
import genericPool from 'generic-pool';

export class SignerPool {
  private pool = genericPool.createPool<Worker>({
    create: () => new Worker('./dist/infra/xml/signing/signing.worker.js'),
    destroy: (w) => w.terminate(),
  }, {
    min: 2,
    max: cpus().length, // um worker por núcleo de CPU disponível
  });

  async assinar(xmlString: string, pfxBase64: string, senha: string): Promise<string> {
    const worker = await this.pool.acquire();
    try {
      return await new Promise((resolve, reject) => {
        worker.once('message', ({ xmlAssinado, erro }) => {
          if (erro) reject(new Error(erro));
          else resolve(xmlAssinado);
        });
        worker.postMessage({ xmlString, pfxBase64, senha });
      });
    } finally {
      this.pool.release(worker);
    }
  }
}

// src/infra/xml/signing/signing.worker.ts
import { workerData, parentPort, receiveMessageOnPort } from 'worker_threads';

// Worker fica vivo esperando mensagens (não cria/destrói por nota)
parentPort!.on('message', ({ xmlString, pfxBase64, senha }) => {
  try {
    const xmlAssinado = assinarXmlComPkcs7(xmlString, pfxBase64, senha);
    parentPort!.postMessage({ xmlAssinado });
  } catch (err: any) {
    parentPort!.postMessage({ erro: err.message });
  }
});
```

---

### 11.6 Batching para SEFAZ (Agrupamento de Lotes)

A SEFAZ aceita até 50 NF-e por requisição SOAP. Em vez de enviar uma nota por vez, o `SefazBatcher` acumula notas e envia em lotes — reduzindo drasticamente o número de conexões SOAP necessárias:

```typescript
// src/infra/sefaz/SefazBatcher.ts
interface PendingItem {
  documentoId: string;
  xmlAssinado: string;
  resolve: (result: SefazRetornoItem) => void;
  reject: (err: Error) => void;
}

export class SefazBatcher {
  private readonly buffers = new Map<string, PendingItem[]>();
  private readonly timers = new Map<string, NodeJS.Timeout>();
  private readonly MAX_BATCH = 50;
  private readonly MAX_WAIT_MS = 200; // flush no máximo a cada 200ms

  async enviar(uf: string, documentoId: string, xmlAssinado: string): Promise<SefazRetornoItem> {
    return new Promise((resolve, reject) => {
      const buf = this.buffers.get(uf) ?? [];
      buf.push({ documentoId, xmlAssinado, resolve, reject });
      this.buffers.set(uf, buf);

      if (buf.length >= this.MAX_BATCH) {
        this.flush(uf); // lote cheio: envia imediatamente
      } else if (!this.timers.has(uf)) {
        // agenda flush por timeout
        this.timers.set(uf, setTimeout(() => this.flush(uf), this.MAX_WAIT_MS));
      }
    });
  }

  private async flush(uf: string): Promise<void> {
    clearTimeout(this.timers.get(uf));
    this.timers.delete(uf);

    const batch = this.buffers.get(uf) ?? [];
    if (!batch.length) return;
    this.buffers.set(uf, []);

    try {
      const xmlLote = montarLoteSoap(batch.map(b => b.xmlAssinado));
      const retorno = await this.sefazClient.nfeAutorizacao(uf, xmlLote);
      const resultados = parsearRetornoLote(retorno);

      for (const item of batch) {
        const resultado = resultados.find(r => r.documentoId === item.documentoId);
        resultado ? item.resolve(resultado) : item.reject(new Error('Sem retorno no lote'));
      }
    } catch (err: any) {
      batch.forEach(item => item.reject(err));
    }
  }
}
```

---

### 11.7 Circuit Breaker por UF

Quando uma UF da SEFAZ está instável, o circuit breaker evita que timeouts em cascata consumam todos os workers:

```typescript
// src/infra/sefaz/SefazCircuitBreaker.ts
import CircuitBreaker from 'opossum';

export class SefazCircuitBreakerRegistry {
  private readonly breakers = new Map<string, CircuitBreaker>();

  get(uf: string): CircuitBreaker {
    if (!this.breakers.has(uf)) {
      const breaker = new CircuitBreaker(
        (fn: () => Promise<unknown>) => fn(),
        {
          timeout: 30_000,         // 30s timeout por requisição SEFAZ
          errorThresholdPercentage: 30, // abre se 30% falhar
          resetTimeout: 60_000,    // tenta fechar após 60s
          volumeThreshold: 5,      // mínimo 5 chamadas para avaliar
        }
      );

      breaker.on('open',    () => logger.warn(`Circuit ABERTO para UF ${uf} — SEFAZ instável`));
      breaker.on('close',   () => logger.info(`Circuit FECHADO para UF ${uf} — SEFAZ normalizada`));
      breaker.on('halfOpen',() => logger.info(`Circuit SEMI-ABERTO para UF ${uf} — testando...`));

      // Quando circuito aberto: entra em contingência automaticamente
      breaker.fallback(() => this.contingenciaService.ativar(uf));

      this.breakers.set(uf, breaker);
    }
    return this.breakers.get(uf)!;
  }
}
```

---

### 11.8 Bulk Insert no PostgreSQL

Em vez de inserir uma nota por vez, o worker de persistência acumula resultados e faz inserção em lote:

```typescript
// src/infra/database/repositories/DocumentoFiscalRepository.ts
export class DocumentoFiscalRepository {
  private pendentes: DocumentoFiscalRow[] = [];
  private readonly BULK_SIZE = 100;
  private readonly BULK_INTERVAL_MS = 500;

  constructor() {
    // Flush periódico independente do tamanho do lote
    setInterval(() => this.flushPendentes(), this.BULK_INTERVAL_MS);
  }

  async salvar(doc: DocumentoFiscalRow): Promise<void> {
    this.pendentes.push(doc);
    if (this.pendentes.length >= this.BULK_SIZE) {
      await this.flushPendentes();
    }
  }

  private async flushPendentes(): Promise<void> {
    if (!this.pendentes.length) return;
    const lote = this.pendentes.splice(0, this.pendentes.length);

    await db('documentos_fiscais')
      .insert(lote)
      .onConflict('idempotency_key')
      .ignore(); // idempotência no banco também
  }
}
```

---

### 11.9 Configuração Kubernetes para Autoscaling

```yaml
# k8s/hpa-fiscal-workers.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: fiscal-xml-worker-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: fiscal-xml-worker
  minReplicas: 3
  maxReplicas: 40
  metrics:
    - type: External
      external:
        metric:
          name: bullmq_queue_size
          selector:
            matchLabels:
              queue: xml-build
        target:
          type: AverageValue
          averageValue: "500" # escala quando >500 jobs por pod

---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: fiscal-sefaz-worker-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: fiscal-sefaz-worker
  minReplicas: 5
  maxReplicas: 40
  metrics:
    - type: External
      external:
        metric:
          name: bullmq_queue_size
          selector:
            matchLabels:
              queue: transmissao-sefaz
        target:
          type: AverageValue
          averageValue: "200"
```

```yaml
# k8s/deployment-api.yaml — API stateless com recursos controlados
apiVersion: apps/v1
kind: Deployment
metadata:
  name: fiscal-api
spec:
  replicas: 5
  template:
    spec:
      containers:
        - name: fiscal-api
          image: fiscal-service:latest
          resources:
            requests:
              cpu: "500m"
              memory: "512Mi"
            limits:
              cpu: "1000m"
              memory: "1Gi"
          env:
            - name: NODE_CLUSTER_WORKERS
              value: "1"        # 1 processo por pod (K8s gerencia escala)
            - name: SIGN_THREAD_POOL_SIZE
              value: "4"        # Worker Threads para assinatura por pod
            - name: BULLMQ_CONCURRENCY
              value: "50"       # Jobs paralelos por worker pod
```

---

### 11.10 Infraestrutura Mínima para 100k req/min

| Componente | Configuração mínima | Observações |
|---|---|---|
| **API Pods** | 10–20 pods (2 vCPU / 1GB) | Stateless, só valida e enfileira |
| **XML Worker Pods** | 10–20 pods (2 vCPU / 2GB) | Build do XML + enriquecimento |
| **Sign Worker Pods** | 10–20 pods (4 vCPU / 2GB) | CPU-bound: mais núcleos = mais throughput |
| **Sefaz Worker Pods** | 20–40 pods (1 vCPU / 512MB) | Um pool de pods por UF de destino frequente |
| **Persist Worker Pods** | 5–10 pods (1 vCPU / 512MB) | Bulk insert no banco |
| **Redis Cluster** | 3 nós master + 3 réplicas (8GB RAM cada) | Filas BullMQ |
| **PostgreSQL Primary** | 8 vCPU / 32GB RAM / NVMe SSD | Writes: numeração + persistência |
| **PostgreSQL Replicas** | 2–3 réplicas (leitura) | Consultas de status + relatórios |
| **PgBouncer** | 2 instâncias (transaction mode) | Pool de conexões: máx 500 conn cada |
| **RabbitMQ / Kafka** | Cluster 3 nós | Publicação de eventos para Financeiro/Estoque |

**Estimativa de custo AWS (us-east-1, on-demand):** ~$3.000–5.000/mês para suportar pico de 100k/min. Com Reserved Instances ou Spot para workers: ~$1.500–2.500/mês.

---

### 11.11 Estratégia de Degradação Controlada

Quando o sistema opera próximo ao limite ou a SEFAZ está lenta, o serviço deve degradar de forma **controlada** em vez de falhar abruptamente:

| Nível | Trigger | Comportamento |
|---|---|---|
| **Normal** | Fila < 10k jobs | Processamento em tempo real |
| **Atenção** | Fila 10k–50k jobs | Aumenta concorrência dos workers, ativa HPA |
| **Degradado** | Fila 50k–200k jobs | Prioriza NFC-e (PDV) sobre NF-e em lote |
| **Contingência** | SEFAZ indisponível | Emissão offline, transmite quando normalizar |
| **Shed Load** | Fila > 500k jobs | Rejeita novos lotes com HTTP 429, mantém PDV |

```typescript
// src/infra/queue/QueueHealthMonitor.ts
export class QueueHealthMonitor {
  async getNivel(): Promise<NivelCarga> {
    const [emissao, assinatura, transmissao] = await Promise.all([
      this.getQueueSize('xml-build'),
      this.getQueueSize('assinatura'),
      this.getQueueSize('transmissao-sefaz'),
    ]);
    const total = emissao + assinatura + transmissao;

    if (total > 500_000) return 'SHED_LOAD';
    if (total > 200_000) return 'CONTINGENCIA';
    if (total > 50_000)  return 'DEGRADADO';
    if (total > 10_000)  return 'ATENCAO';
    return 'NORMAL';
  }
}
```

---

### 11.12 Observabilidade para Alta Carga

Métricas críticas a monitorar em produção com alta carga:

```typescript
// Métricas expostas via Prometheus
fiscal_emissoes_total{tipo, status, uf}          // contador por tipo/status/UF
fiscal_emissao_duration_seconds{etapa, uf}        // histograma por etapa do pipeline
fiscal_queue_depth{queue}                         // profundidade das filas
fiscal_sefaz_circuit_state{uf}                    // 0=fechado 1=semi 2=aberto
fiscal_numeracao_pool_size{empresa, serie}         // números disponíveis em memória
fiscal_worker_threads_active{tipo}                // threads de assinatura ativas
fiscal_bulk_insert_batch_size                     // tamanho médio dos lotes de insert
```

**Alertas obrigatórios:**

| Alerta | Condição | Severidade |
|---|---|---|
| Alta taxa de rejeição | `fiscal_emissoes_total{status="REJEITADO"}` > 5% | Warning |
| Fila crescendo | `fiscal_queue_depth` aumentando > 10min | Warning |
| Circuit aberto | `fiscal_sefaz_circuit_state{uf=*}` == 2 | Critical |
| Pool de numeração crítico | `fiscal_numeracao_pool_size` < 50 | Critical |
| Latência P95 alta | `fiscal_emissao_duration_seconds P95` > 30s | Warning |
| Certificado vencendo | Dias para vencimento < 30 | Warning |

---

## 12. Estrutura de Pastas

```
fiscal-service/
├── src/
│   ├── api/
│   │   ├── routes/
│   │   │   ├── emissao.routes.ts
│   │   │   ├── cancelamento.routes.ts
│   │   │   ├── consulta.routes.ts
│   │   │   └── inutilizacao.routes.ts
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.ts
│   │   │   ├── idempotency.middleware.ts
│   │   │   └── validation.middleware.ts
│   │   └── server.ts
│   │
│   ├── domain/
│   │   ├── documentos/
│   │   │   ├── DocumentoFiscal.ts         # Entidade raiz
│   │   │   ├── DocumentoFiscal.types.ts
│   │   │   └── DocumentoFiscal.spec.ts
│   │   ├── numeracao/
│   │   │   ├── NumeracaoFiscal.ts
│   │   │   └── NumeracaoFiscal.spec.ts
│   │   └── eventos/
│   │       └── EventoFiscal.ts
│   │
│   ├── use-cases/
│   │   ├── emitir-documento/
│   │   │   ├── EmitirDocumento.usecase.ts
│   │   │   └── EmitirDocumento.spec.ts
│   │   ├── cancelar-documento/
│   │   │   └── CancelarDocumento.usecase.ts
│   │   ├── carta-correcao/
│   │   │   └── CartaCorrecao.usecase.ts
│   │   ├── inutilizar-numeracao/
│   │   │   └── InutilizarNumeracao.usecase.ts
│   │   └── consultar-sefaz/
│   │       └── ConsultarSefaz.usecase.ts
│   │
│   ├── infra/
│   │   ├── sefaz/
│   │   │   ├── SefazClient.ts             # Comunicação SOAP
│   │   │   ├── SefazEndpoints.ts          # URLs por UF/ambiente
│   │   │   ├── SefazCircuitBreaker.ts
│   │   │   └── sefaz.types.ts
│   │   ├── xml/
│   │   │   ├── builders/
│   │   │   │   ├── NFeBuilder.ts
│   │   │   │   ├── NFCeBuilder.ts
│   │   │   │   ├── CTeBuilder.ts
│   │   │   │   └── MDFeBuilder.ts
│   │   │   ├── signing/
│   │   │   │   └── XmlSigner.ts           # Assinatura digital PKCS#7
│   │   │   └── validators/
│   │   │       └── XmlSchemaValidator.ts
│   │   ├── pdf/
│   │   │   ├── DanfeGenerator.ts
│   │   │   └── DacteGenerator.ts
│   │   ├── queue/
│   │   │   ├── EmissaoQueue.ts
│   │   │   ├── ContingenciaQueue.ts
│   │   │   └── workers/
│   │   │       ├── EmissaoWorker.ts
│   │   │       └── ConsultaWorker.ts
│   │   ├── events/
│   │   │   ├── EventPublisher.ts
│   │   │   └── events.types.ts
│   │   ├── database/
│   │   │   ├── repositories/
│   │   │   │   ├── DocumentoFiscalRepository.ts
│   │   │   │   ├── EventoFiscalRepository.ts
│   │   │   │   └── NumeracaoRepository.ts
│   │   │   └── migrations/
│   │   └── integration/
│   │       ├── ProdutoIntegrationService.ts   # Consulta Módulo Produtos
│   │       ├── CadastroIntegrationService.ts  # Consulta Módulo Cadastro
│   │       └── EmpresaIntegrationService.ts   # Consulta dados da empresa
│   │
│   ├── shared/
│   │   ├── errors/
│   │   │   ├── FiscalError.ts
│   │   │   ├── SefazRejeicaoError.ts
│   │   │   └── SefazDenegacaoError.ts
│   │   ├── utils/
│   │   │   ├── chaveAcesso.ts
│   │   │   ├── digitoVerificador.ts
│   │   │   └── formatadores.ts
│   │   └── constants/
│   │       ├── cStat.ts                   # Mapa de códigos SEFAZ
│   │       ├── cfop.ts
│   │       └── ncm.ts
│   │
│   └── config/
│       ├── env.ts
│       ├── certificado.ts
│       └── sefaz.config.ts
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
│       └── xmls/                          # XMLs de exemplo para testes
│
├── docs/
│   └── openapi.yaml
│
├── docker-compose.yml
├── Dockerfile
├── package.json
└── tsconfig.json
```

---

## 13. Roadmap de Entregas

### Sprint 1 — Fundação (2 semanas)
- [ ] Setup do projeto: TypeScript, ESLint, Prettier, Jest
- [ ] Estrutura de banco de dados (migrations)
- [ ] API REST base com autenticação
- [ ] Controle de numeração fiscal com lock de concorrência
- [ ] Integração base com Módulo de Cadastro e Produtos

### Sprint 2 — NF-e (3 semanas)
- [ ] XML Builder para NF-e (schema 4.00)
- [ ] Assinatura digital (certificado A1)
- [ ] Comunicação com SEFAZ homologação
- [ ] Fluxo completo: Autorizada / Rejeitada / Denegada
- [ ] Cancelamento e CC-e
- [ ] Geração de DANFE (PDF)
- [ ] Publicação de eventos para Financeiro e Estoque

### Sprint 3 — NFC-e e Contingência (2 semanas)
- [ ] XML Builder para NFC-e
- [ ] Modo contingência offline
- [ ] Fila de transmissão de contingência
- [ ] Inutilização de numeração
- [ ] Dashboard de status dos webservices SEFAZ

### Sprint 4 — CT-e e MDF-e (3 semanas)
- [ ] XML Builder para CT-e (schema 3.00)
- [ ] XML Builder para MDF-e (schema 3.00)
- [ ] CIOT (integração ANTT)
- [ ] Geração de DACTE e DAMDFE

### Sprint 5 — SPED e NF Rural (4 semanas)
- [ ] Geração de EFD ICMS/IPI (SPED Fiscal)
- [ ] Geração de EFD PIS/COFINS (SPED Contribuições)
- [ ] Suporte a NF Rural / Nota Avulsa
- [ ] Ambiente de produção: certificado A3 / HSM

### Sprint 6 — Alta Carga e Resiliência (3 semanas)
- [ ] Pipeline em 5 estágios com filas BullMQ independentes
- [ ] Worker Threads para assinatura digital (SignerPool)
- [ ] SefazBatcher: agrupamento de lotes de 50 notas por UF
- [ ] NumeracaoPool: pré-alocação de blocos em memória
- [ ] Circuit Breaker por UF com fallback para contingência automática
- [ ] Bulk insert no PostgreSQL com PgBouncer
- [ ] HPA no Kubernetes baseado em profundidade de fila
- [ ] QueueHealthMonitor com degradação controlada (5 níveis)
- [ ] Métricas Prometheus + alertas (taxa rejeição, circuit state, pool numeração)
- [ ] Stress test: 100k emissões/min em ambiente de homologação

### Sprint 7 — Qualidade e Observabilidade (2 semanas)
- [ ] Cobertura de testes > 80%
- [ ] OpenTelemetry + tracing distribuído por etapa do pipeline
- [ ] Dashboard Grafana: throughput, latência P95, circuit breakers, filas
- [ ] Documentação OpenAPI completa
- [ ] Runbook de operação: contingência, restart de workers, reprocessamento de fila

---

*Este documento é um PRD vivo. Atualizações devem ser versionadas e revisadas pelo time de produto e fiscal.*