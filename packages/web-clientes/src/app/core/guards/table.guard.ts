import { inject } from '@angular/core'
import { CanActivateFn, Router } from '@angular/router'
import { TableSessionStore } from '../store/table-session.store'

export const menuTableGuard: CanActivateFn = (route) => {
  const restaurantId = route.paramMap.get('id')!
  if (inject(TableSessionStore).hasTableFor(restaurantId)) return true
  return inject(Router).createUrlTree(['/restaurants', restaurantId, 'tables'])
}

export const cartTableGuard: CanActivateFn = () => {
  const session = inject(TableSessionStore).session()
  const router = inject(Router)
  if (!session) return router.createUrlTree(['/restaurants'])
  return true
}
