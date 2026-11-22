export type ReminderUnit = 'day' | 'week' | 'month' | 'year'

// the fields the user edits on a maintenance reminder: due after every_km km, every_hours hours of
// activities, or every_count every_unit (calendar ones) since it was last done, whichever comes first; 0 is
// no such interval, one at least
export interface ReminderFields {
  name: string;
  every_km: number;
  every_hours: number;
  every_count: number;
  every_unit: ReminderUnit | '';
  only_when_used: boolean; // the time interval waits for an activity with the equipment since it was last done
  starts_at?: string; // its cycle until it is first done: now when not sent on a creation, kept on an update
}

export type ReminderState = 'ok' | 'soon' | 'due'

// a maintenance reminder with where its cycle is
export interface Reminder extends ReminderFields {
  id: string;
  equipment_id: string;
  equipment_name: string;
  starts_at: string;
  last_done: string | null; // the latest service done for it
  uses_since: number; // activities since it was last done
  km_since: number;
  hours_since: number;
  km_left: number | null; // null without km interval, negative overdue
  hours_left: number | null;
  due_date: string | null; // YYYY-MM-DD in the user's timezone, null without time interval
  waiting_use: boolean; // its time is reached, it waits for an activity
  state: ReminderState;
  progress: number; // of the most advanced interval, 1 when due
}

// the fields the user edits
export interface EquipmentFields {
  name: string;
  brand: string;
  model: string;
  date_of_purchase: string | null; // null: unknown
  initial_mileage: number; // km, before the first activity
  weight: number; // kg
  // the sports it is the default equipment of, given to the uploaded activities of those sports: one
  // equipment per sport, an equipment can have several (shoes for running and hiking)
  default_sports: string[];
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
  reminders: Reminder[]; // its maintenance reminders, the most urgent first
}

// the sports to choose the default equipment of
export interface Sports {
  sports: string[]; // of the user's activities and default equipments
  all: string[]; // every sport an activity can have
}

// the fields the user edits on a service
export interface EquipmentServiceFields {
  date: string; // YYYY-MM-DD, or an ISO timestamp
  mileage: number; // km of the equipment when serviced
  description: string;
  reminder_ids?: string[]; // the reminders it did; not sent: kept on an update
}

// a maintenance done on an equipment
export interface EquipmentService extends EquipmentServiceFields {
  id: string;
  equipment_id: string;
  created_at: string;
  updated_at: string;
  reminder_ids: string[];
}

// a reminder marked done: the service logged for it, and its new cycle
export interface ReminderDone {
  service: EquipmentService;
  reminder: Reminder;
}
