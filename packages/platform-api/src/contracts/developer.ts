export type DeveloperModuleRole =
  | "owner"
  | "maintainer"
  | "contributor"
  | "support";

export interface DeveloperRole {
  developerId: string;
  moduleId: string;
  role: DeveloperModuleRole;
}

export interface DeveloperAccount {
  id: string;
  userId: string;
  displayName: string;
  githubUsername?: string;
  termsAcceptedAt: Date;
  publicProfileSlug?: string;
}
