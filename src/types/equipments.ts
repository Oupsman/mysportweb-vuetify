export interface Equipment {
  id: string;
  name: string;
  brand: string;
  equipmentmodel: string;
  dateofpurchase: string;
  mileage: number;
  weight: number;
  maintenanceInterval: number;
  isdefault: boolean;
}

export interface Equipments {
  equipments: Equipment[];
}
