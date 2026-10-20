import { Order } from '../../orders/models/order.model'

export type TableStatus = 'libre' | 'ocupada' | 'reservada'

export interface Table {
  id: string
  restaurantId: string
  number: number
  description: string | null
  capacity: number
  status: TableStatus
  createdAt: string
  updatedAt: string
}

export interface TableWithOrders {
  table: Table
  orders: Order[]
}

export interface UpdateTableStatusDto {
  status: TableStatus
}
