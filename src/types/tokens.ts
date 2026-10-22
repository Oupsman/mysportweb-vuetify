export type TokenResource = 'activities' | 'equipments' | 'healthdatas'
export type TokenAction = 'read' | 'create' | 'write' | 'delete'
// "activities:read"...
export type TokenPermission = `${TokenResource}:${TokenAction}`

export interface DeviceToken {
  id: string;
  created_at: string;
  name: string;
  // the first characters of the token, to recognize it
  hint: string;
  permissions: TokenPermission[];
  expires_at: string;
  last_used_at: string | null;
}

export interface NewDeviceToken {
  name: string;
  permissions: TokenPermission[];
  expires_at: string;
}
