import { format, addMonths, isAfter } from 'date-fns';

export function formatDate(date: Date): string {
  return format(date, 'dd MMM yyyy');
}

export function formatDateTime(date: Date): string {
  return format(date, 'dd MMM yyyy, hh:mm a');
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
}

export function getNextDueDate(lastDueDate: Date): Date {
  return addMonths(lastDueDate, 1);
}

export function isOverdue(dueDate: Date): boolean {
  return isAfter(new Date(), dueDate);
}

export function getMonthYear(date: Date): string {
  return format(date, 'MMMM yyyy');
}

export function generatePaymentMessage(
  residentName: string,
  amount: number,
  dueDate: Date,
  pgName = 'PGHub'
): string {
  return `Dear ${residentName}, your rent of ${formatCurrency(amount)} for ${pgName} is due on ${formatDate(dueDate)}. Please make the payment on time. Thank you!`;
}

export function generateWelcomeMessage(
  residentName: string,
  roomName: string,
  bedNumber: string,
  pgName = 'PGHub'
): string {
  return `Welcome to ${pgName}, ${residentName}! You have been assigned to Room ${roomName}, Bed ${bedNumber}. We hope you have a comfortable stay. Feel free to reach out for any assistance.`;
}

export function generateMoveOutMessage(
  residentName: string,
  moveOutDate: Date,
  pgName = 'PGHub'
): string {
  return `Dear ${residentName}, your move-out from ${pgName} is confirmed for ${formatDate(moveOutDate)}. It was a pleasure having you. We wish you all the best!`;
}
