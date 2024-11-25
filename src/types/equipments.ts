export interface Equipment {
  id: string;
  name: string;
  brand: string;
  model: string;
  date_of_purchase: string;
  initial_mileage: number;
  weight: number;
  maintenance_interval: number;
  is_default: boolean;
}

export interface Equipments {
  equipments: Equipment[];
}
