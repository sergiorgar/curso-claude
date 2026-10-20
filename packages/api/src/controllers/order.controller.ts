import type { Request, Response, NextFunction } from 'express'
import type { OrderService } from '@services/order.service.js'
import { RestaurantIdQueryRequiredError, InvalidTokenError } from '@errors/DomainErrors.js'

export class OrderController {
    constructor(private readonly orderService: OrderService) {}

    async createOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { restaurantId, tableId, items } = req.body
            const user = (req as any).user
            const clientId = user?.id ?? null

            const order = await this.orderService.create({
                restaurantId,
                tableId: tableId ?? null,
                clientId,
                items
            })
            res.status(201).json(order)
        } catch (error) {
            next(error)
        }
    }

    async getActiveOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { restaurantId } = req.query
            if (!restaurantId || typeof restaurantId !== 'string') {
                throw new RestaurantIdQueryRequiredError()
            }
            const orders = await this.orderService.listActive(restaurantId)
            res.status(200).json(orders)
        } catch (error) {
            next(error)
        }
    }

    async getMyOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const user = (req as any).user
            if (!user?.id) {
                throw new InvalidTokenError()
            }
            const orders = await this.orderService.getByClientId(user.id)
            res.status(200).json(orders)
        } catch (error) {
            next(error)
        }
    }

    async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const order = await this.orderService.getById(req.params.id as string)
            res.status(200).json(order)
        } catch (error) {
            next(error)
        }
    }

    async updateItemStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const orderId = req.params.orderId as string
            const itemId = req.params.itemId as string
            const { status } = req.body

            await this.orderService.updateItemStatus(orderId, itemId, status)
            res.status(204).send()
        } catch (error) {
            next(error)
        }
    }
}
