export interface Payment {
  id?: number;
  customerId: number;
  adminId: number;
  festivalId: number;
  paymentType: string;
  paymentDest: string;
  amount: number;
  date?: string;
}

export interface PaymentResponse {
  success: boolean;
  payment?: Payment;
  error?: string;
} 