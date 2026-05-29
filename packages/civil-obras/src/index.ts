export type ObraStatus = "planejada" | "em_andamento" | "concluida" | "paralisada";

export type UsuarioObraPerfil = "colaborador" | "visualizador";

export type MidiaTipo = "imagem" | "video";

export type EventoCalendarioTipo = "marco" | "entrada";

export interface ObraSummary {
  id: string;
  nome: string;
  endereco: string;
  dataInicio: string;
  dataPrevistaConclusao: string | null;
  status: ObraStatus;
  fiscalMembershipId: string | null;
  maxUploadImageMb: number;
  maxUploadVideoMb: number;
  createdAt: string;
}

export interface ObraDetail extends ObraSummary {
  softDeletedAt: string | null;
}

export interface CreateObraInput {
  nome: string;
  endereco: string;
  dataInicio: string;
  dataPrevistaConclusao?: string | null;
  status?: ObraStatus;
  maxUploadImageMb?: number;
  maxUploadVideoMb?: number;
}

export interface UsuarioObraSummary {
  id: string;
  obraId: string;
  nome: string;
  email: string;
  telefone: string | null;
  perfil: UsuarioObraPerfil;
  optInWhatsapp: boolean;
  revokedAt: string | null;
}

export interface EntradaSummary {
  id: string;
  obraId: string;
  autorId: string;
  autorNome: string;
  titulo: string;
  dataRegistro: string;
  publicada: boolean;
  createdAt: string;
  midiaCount: number;
}

export interface EntradaDetail extends EntradaSummary {
  corpo: Record<string, unknown>;
  mencoes: { usuarioId: string; nome: string }[];
  midias: MidiaAnexo[];
}

export interface MidiaAnexo {
  id: string;
  tipo: MidiaTipo;
  urlStorage: string;
  thumbnailUrl: string | null;
  tamanhoBytes: number;
  nomeOriginal: string;
}

export interface CreateEntradaInput {
  obraId: string;
  titulo: string;
  corpo: Record<string, unknown>;
  dataRegistro: string;
  mencaoUsuarioIds?: string[];
  midias?: Omit<MidiaAnexo, "id">[];
}

export interface EventoCalendario {
  id: string;
  obraId: string;
  titulo: string;
  descricao: string;
  dataEvento: string;
  tipo: EventoCalendarioTipo;
  entradaId?: string | null;
}

export interface RelatorioListagem {
  obra: ObraSummary;
  periodoInicio: string;
  periodoFim: string;
  entradas: EntradaDetail[];
}

export interface RelatorioGerado {
  id: string;
  obraId: string;
  periodoInicio: string;
  periodoFim: string;
  pdfUrl: string | null;
  expiresAt: string;
  geradoPor: string;
}

export interface BuscaResultado {
  entradas: EntradaSummary[];
  obras: ObraSummary[];
  usuarios: UsuarioObraSummary[];
}

export interface ConviteUsuarioInput {
  obraId: string;
  nome: string;
  email: string;
  telefone?: string | null;
  perfil: UsuarioObraPerfil;
  optInWhatsapp?: boolean;
}

export interface EntradaPublicadaPayload {
  entradaId: string;
  obraId: string;
  titulo: string;
  trecho: string;
  link: string;
  mencaoUsuarioIds: string[];
}

export interface UsuarioConvidadoPayload {
  usuarioId: string;
  obraId: string;
  email: string;
  nome: string;
  conviteLink: string;
}

export interface RelatorioGeradoPayload {
  relatorioId: string;
  obraId: string;
  pdfUrl: string;
}
