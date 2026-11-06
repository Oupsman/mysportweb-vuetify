// the fields the user edits
export interface EquipmentFields {
  name: string;
  brand: string;
  model: string;
  date_of_purchase: string | null; // null: unknown
  initial_mileage: number; // km, before the first activity
  weight: number; // kg
  maintenance_interval: number; // km between two services, 0: none
  is_default: boolean; // given to the uploaded activities
  is_commute: boolean; // given to the commute rides instead of the default one, one per user
}

export interface Equipment extends EquipmentFields {
  id: string;
  picture: string; // path under /MEDIA, empty without picture
  mileage: number; // km: the initial mileage plus the distance of the activities
  activities: number;
  distance: number; // meters, of the activities only
  duration: number; // seconds
  last_used: string | null;
  last_service: string | null; // date of the latest service, null without one
  km_since_service: number; // of the activities after the latest service, or of all of them without one
}

// the fields the user edits on a service
export interface EquipmentServiceFields {
  date: string; // YYYY-MM-DD, or an ISO timestamp
  mileage: number; // km of the equipment when serviced
  description: string;
}

// a maintenance done on an equipment
export interface EquipmentService extends EquipmentServiceFields {
  id: string;
  equipment_id: string;
  created_at: string;
  updated_at: string;
}
