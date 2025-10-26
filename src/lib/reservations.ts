
export interface TimeSlot {
  time: string; // "HH:MM"
  capacity: number;
}

export interface Reservation {
  date: string; // "YYYY-MM-DD"
  time: string; // "HH:MM"
  partySize: number;
}

// Demo data for existing reservations
const existingReservations: Reservation[] = [
  { date: "2024-08-23", time: "18:00", partySize: 4 },
  { date: "2024-08-23", time: "19:00", partySize: 2 },
  { date: "2024-08-23", time: "19:30", partySize: 5 },
  { date: "2024-08-24", time: "12:00", partySize: 8 },
  { date: "2024-08-24", time: "12:00", partySize: 3 },
  { date: "2024-08-24", time: "14:00", partySize: 6 },
];

// Demo data for restaurant's total capacity at each time slot
const allTimeSlots: TimeSlot[] = [
    { time: '17:00', capacity: 20 },
    { time: '17:30', capacity: 20 },
    { time: '18:00', capacity: 20 },
    { time: '18:30', capacity: 20 },
    { time: '19:00', capacity: 20 },
    { time: '19:30', capacity: 20 },
    { time: '20:00', capacity: 15 },
    { time: '20:30', capacity: 15 },
    { time: '21:00', capacity: 10 },
];


/**
 * Checks for available time slots for a given date and party size.
 * @param date The desired date for the reservation.
 * @param partySize The number of people in the party.
 * @returns An array of available time slots.
 */
export function checkAvailability(date: Date, partySize: number): TimeSlot[] {
  const dateString = date.toISOString().split('T')[0];

  const reservationsForDay = existingReservations.filter(
    (res) => res.date === dateString
  );

  const availableSlots = allTimeSlots.filter((slot) => {
    const reservationsForSlot = reservationsForDay.filter(
      (res) => res.time === slot.time
    );

    const currentCapacity = reservationsForSlot.reduce(
      (total, res) => total + res.partySize,
      0
    );

    const remainingCapacity = slot.capacity - currentCapacity;
    return remainingCapacity >= partySize;
  });

  return availableSlots;
}
