export enum DayType {
  WEEKDAY = 'Weekday',
  WEEKEND = 'Weekend',
  HOLIDAY = 'Holiday',
}

export enum BookingStatus {
  CONFIRMED = 'Confirmed', //สำเร็จ
  PAYMENT = 'Payment', //รอการชำระเงิน
  PENDING = 'Pending', //รอการยืนยัน
  CANCELLED = 'Cancelled',
}

export enum RoomStatus {
  AVAILABLE = 'Available',
  UNAVAILABLE = 'Unavailable',
  MAINTENANCE = 'Maintenance',
}