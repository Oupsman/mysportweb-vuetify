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
}
