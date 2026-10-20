import { Router } from 'express'
import { TableController } from '@controllers/table.controller.js'
import { dbConfig } from '@config/database.js'
import { SqliteTableRepository } from '@repositories/table.repository.js'
import { SqliteRestaurantRepository } from '@repositories/restaurant.repository.js'
import { SqliteOrderRepository } from '@repositories/order.repository.js'
import { TableService } from '@services/table.service.js'
import { authenticate, authorize } from '@shared/infrastructure/http/middlewares.js'

const tableRepository = new SqliteTableRepository(dbConfig)
const restaurantRepository = new SqliteRestaurantRepository(dbConfig)
const orderRepository = new SqliteOrderRepository(dbConfig)
const tableService = new TableService(tableRepository, restaurantRepository, orderRepository)
const tableController = new TableController(tableService)

const router = Router({ mergeParams: true })

router.post('/', authenticate, authorize(['admin', 'manager']), tableController.create)
router.get('/', authenticate, authorize(['admin', 'manager', 'camarero', 'cocinero']), tableController.getAll)
router.get('/orders', authenticate, authorize(['admin', 'manager', 'camarero', 'cocinero']), tableController.listWithOrders)
router.get('/:id', authenticate, authorize(['admin', 'manager', 'camarero', 'cocinero']), tableController.getById)
router.put('/:id', authenticate, authorize(['admin', 'manager']), tableController.update)
router.delete('/:id', authenticate, authorize(['admin', 'manager']), tableController.delete)
router.patch('/:id/status', authenticate, authorize(['admin', 'manager', 'camarero']), tableController.changeStatus)

export default router
