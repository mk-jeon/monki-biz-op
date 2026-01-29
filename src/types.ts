export type Bindings = {
  DB: D1Database;
}

export type User = {
  id: number;
  username: string;
  name: string;
  nickname?: string;
  phone?: string;
  department?: string;
  position?: string;
  role: 'master' | 'admin' | 'user';
  created_at: string;
}

export type Session = {
  id: string;
  user_id: number;
  expires_at: string;
}

export type Permission = {
  id: number;
  role: string;
  menu_id: string;
  access_level: 'none' | 'read' | 'write';
}

export type Variables = {
  user?: User;
  session?: Session;
}
