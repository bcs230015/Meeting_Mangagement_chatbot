
export enum Role {
  USER = 'user',
  MODEL = 'model',
  SYSTEM = 'system',
  TOOL = 'tool'
}

export interface ChatMessage {
  role: Role;
  content: string;
}
