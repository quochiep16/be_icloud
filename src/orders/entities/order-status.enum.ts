export enum OrderStatus {
  PENDING = 'PENDING',      // mới tạo
  PAID = 'PAID',            // đã thanh toán (fake, do admin set)
  CANCELLED = 'CANCELLED',  // hủy
  COMPLETED = 'COMPLETED',  // hoàn thành
}
