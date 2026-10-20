import type { Request, Response, NextFunction } from 'express'
import type { TableService } from '@services/table.service.js'
import type { Table } from '@models/table.model.js'

export class TableController {
    constructor(private readonly tableService: TableService) {}

    create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const table = await this.tableService.create(req.params.restaurantId as string, {
                number: req.body.number,
                description: req.body.description ?? null,
                capacity: req.body.capacity,
                status: req.body.status
            })
            res.status(201).json(this.toJSON(table))
        } catch (error) {
            next(error)
        }
    }

    getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const status = typeof req.query.status === 'string' ? req.query.status : undefined
            const tables = await this.tableService.list(req.params.restaurantId as string, status)
            res.status(200).json(tables.map(t => this.toJSON(t)))
        } catch (error) {
            next(error)
        }
    }

    getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const table = await this.tableService.getById(req.params.restaurantId as string, req.params.id as string)
            res.status(200).json(this.toJSON(table))
        } catch (error) {
            next(error)
        }
    }

    update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const table = await this.tableService.update(req.params.restaurantId as string, req.params.id as string, {
                number: req.body.number,
                description: req.body.description ?? null,
                capacity: req.body.capacity,
                status: req.body.status
            })
            res.status(200).json(this.toJSON(table))
        } catch (error) {
            next(error)
        }
    }

    delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            await this.tableService.delete(req.params.restaurantId as string, req.params.id as string)
            res.status(204).send()
        } catch (error) {
            next(error)
        }
    }

    changeStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const table = await this.tableService.changeStatus(
                req.params.restaurantId as string,
                req.params.id as string,
                req.body.status
            )
            res.status(200).json(this.toJSON(table))
        } catch (error) {
            next(error)
        }
    }

    listWithOrders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const entries = await this.tableService.listOccupiedWithOrders(req.params.restaurantId as string)
            res.status(200).json(entries.map(e => ({ table: this.toJSON(e.table), orders: e.orders })))
        } catch (error) {
            next(error)
        }
    }

    listAvailable = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const raw = req.query.people
            const people = typeof raw === 'string' && raw.trim() !== '' ? Number(raw) : undefined
            const tables = await this.tableService.listAvailable(req.params.restaurantId as string, people)
            res.status(200).json(tables.map(t => this.toJSON(t)))
        } catch (error) {
            next(error)
        }
    }

    occupy = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const table = await this.tableService.occupy(
                req.params.restaurantId as string,
                req.params.id as string,
                req.body?.people
            )
            res.status(200).json(this.toJSON(table))
        } catch (error) {
            next(error)
        }
    }

    private toJSON(table: Table) {
        return {
            id: table.id,
            restaurantId: table.restaurantId,
            number: table.number,
            description: table.description,
            capacity: table.capacity,
            status: table.status,
            createdAt: table.createdAt,
            updatedAt: table.updatedAt
        }
    }
}
