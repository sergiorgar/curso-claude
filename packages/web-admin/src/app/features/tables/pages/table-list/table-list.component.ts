import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { ActivatedRoute, RouterLink } from '@angular/router'
import { FormsModule } from '@angular/forms'
import { LucideAngularModule } from 'lucide-angular'
import { TableStore } from '../../store/table.store'
import type { TableStatus } from '../../models/table.model'

@Component({
  selector: 'app-table-list',
  standalone: true,
  imports: [RouterLink, FormsModule, LucideAngularModule],
  templateUrl: './table-list.component.html',
  styleUrl: './table-list.component.css'
})
export class TableListComponent implements OnInit {
  readonly store = inject(TableStore)
  private readonly route = inject(ActivatedRoute)
  private readonly destroyRef = inject(DestroyRef)
  restaurantId = ''
  statusFilter: TableStatus | '' = ''
  actionError = signal<string | null>(null)

  readonly statuses: TableStatus[] = ['libre', 'ocupada', 'reservada']

  ngOnInit(): void {
    this.route.parent?.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        this.restaurantId = params.get('restaurantId') ?? ''
        this.load()
      })
  }

  load(): void {
    if (!this.restaurantId) return
    this.actionError.set(null)
    this.store.loadByRestaurant(this.restaurantId, this.statusFilter || undefined)
  }

  async onChangeStatus(id: string, status: TableStatus): Promise<void> {
    if (!this.restaurantId) return
    this.actionError.set(null)
    try {
      await this.store.updateStatus(this.restaurantId, id, status)
    } catch (err: any) {
      this.actionError.set(err?.error?.message ?? 'Error al cambiar el estado de la mesa.')
    }
  }

  async onDelete(id: string): Promise<void> {
    if (!this.restaurantId) return
    if (!confirm('¿Estás seguro de eliminar esta mesa?')) return
    this.actionError.set(null)
    try {
      await this.store.delete(this.restaurantId, id)
    } catch (err: any) {
      this.actionError.set(err?.error?.message ?? 'Error al eliminar la mesa.')
    }
  }

  getStatusLabel(status: TableStatus): string {
    const labels: Record<TableStatus, string> = {
      libre: 'Libre',
      ocupada: 'Ocupada',
      reservada: 'Reservada'
    }
    return labels[status]
  }
}
