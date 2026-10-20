import { Component, inject, OnInit, signal, computed } from '@angular/core'
import { ActivatedRoute, Router, RouterLink } from '@angular/router'
import { FormsModule } from '@angular/forms'
import { RestaurantService } from '../../core/services/restaurant.service'
import { TableService } from '../../core/services/table.service'
import { TableSessionStore } from '../../core/store/table-session.store'
import { Restaurant } from '../../core/models/restaurant.model'
import { Table } from '../../core/models/table.model'

@Component({
  selector: 'app-table-select',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <div class="container">
      <div class="page-header">
        <div>
          <a routerLink="/restaurants" class="back-link">← Volver a restaurantes</a>
          <h1>{{ restaurant()?.name || 'Cargando...' }}</h1>
          <p>Indica cuántas personas sois y elige una mesa</p>
        </div>
      </div>

      <div class="people-row card">
        <label for="people">Número de personas</label>
        <input id="people" type="number" min="1" step="1" [ngModel]="people()" (ngModelChange)="onPeopleChange($event)" />
      </div>

      @if (error()) {
        <div class="alert-error">{{ error() }}</div>
      }
      @if (notice()) {
        <div class="alert-error">{{ notice() }}</div>
      }

      @if (!validPeople()) {
        <div class="empty-state card"><p>Indica un número de personas válido (1 o más)</p></div>
      } @else if (loading()) {
        <div class="spinner"></div>
      } @else if (tables().length === 0) {
        <div class="empty-state card"><p>No hay mesas libres para {{ people() }} personas</p></div>
      } @else {
        <div class="tables-grid">
          @for (table of tables(); track table.id) {
            <button type="button" class="table-card card" [class.selected]="selectedId() === table.id" (click)="select(table)">
              <h3>Mesa {{ table.number }}</h3>
              @if (table.description) {
                <p class="table-description">{{ table.description }}</p>
              }
              <p class="table-capacity">Capacidad: {{ table.capacity }}</p>
            </button>
          }
        </div>
      }

      <div class="actions">
        <button class="btn btn-primary" [disabled]="!selectedId() || submitting()" (click)="continue()">Continuar</button>
      </div>
    </div>
  `,
  styles: [`
    .container {
      max-width: 900px;
      margin: 0 auto;
    }
    .back-link {
      font-size: 13px;
      color: var(--text-muted);
      margin-bottom: 8px;
      display: inline-block;
    }
    .people-row {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px 20px;
      margin-bottom: 20px;
    }
    .people-row input {
      width: 100px;
    }
    .tables-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 16px;
    }
    .table-card {
      text-align: left;
      padding: 16px 20px;
      cursor: pointer;
      transition: all var(--transition);
    }
    .table-card:hover,
    .table-card.selected {
      border-color: var(--green-medium);
    }
    .table-card.selected {
      background: var(--green-glow);
    }
    .table-card h3 {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 4px;
    }
    .table-description,
    .table-capacity {
      color: var(--text-muted);
      font-size: 13px;
    }
    .actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 24px;
    }
  `]
})
export class TableSelectComponent implements OnInit {
  private readonly route = inject(ActivatedRoute)
  private readonly restaurantService = inject(RestaurantService)
  private readonly tableService = inject(TableService)
  private readonly tableSession = inject(TableSessionStore)
  private readonly router = inject(Router)

  private restaurantId = ''

  readonly restaurant = signal<Restaurant | null>(null)
  readonly tables = signal<Table[]>([])
  readonly people = signal<number | null>(2)
  readonly selectedId = signal<string | null>(null)
  readonly loading = signal(false)
  readonly submitting = signal(false)
  readonly error = signal<string | null>(null)
  readonly notice = signal<string | null>(null)

  readonly validPeople = computed(() => {
    const p = this.people()
    return p !== null && Number.isInteger(p) && p >= 1
  })

  ngOnInit(): void {
    this.restaurantId = this.route.snapshot.paramMap.get('id')!
    this.restaurantService.getById(this.restaurantId).subscribe({
      next: (restaurant) => this.restaurant.set(restaurant),
      error: () => {}
    })
    this.loadTables()
  }

  onPeopleChange(value: number | null): void {
    this.people.set(value)
    this.selectedId.set(null)
    this.notice.set(null)
    this.loadTables()
  }

  select(table: Table): void {
    this.selectedId.set(table.id)
  }

  continue(): void {
    const table = this.tables().find(t => t.id === this.selectedId())
    if (!table || !this.validPeople()) return

    this.submitting.set(true)
    this.error.set(null)
    this.notice.set(null)
    this.tableService.occupy(this.restaurantId, table.id, this.people()!).subscribe({
      next: (occupied) => {
        this.tableSession.set(this.restaurantId, this.people()!, occupied)
        this.router.navigate(['/restaurants', this.restaurantId])
      },
      error: (err) => {
        this.submitting.set(false)
        if (err.status === 409) {
          this.selectedId.set(null)
          this.notice.set('Esa mesa acaba de ser ocupada. Elige otra de la lista actualizada.')
          this.loadTables()
        } else {
          this.error.set(err.error?.message || 'No se ha podido ocupar la mesa. Inténtalo de nuevo.')
        }
      }
    })
  }

  private loadTables(): void {
    if (!this.validPeople()) {
      this.tables.set([])
      return
    }
    this.loading.set(true)
    this.error.set(null)
    this.tableService.getAvailable(this.restaurantId, this.people()!).subscribe({
      next: (tables) => {
        this.tables.set(tables)
        if (!tables.some(t => t.id === this.selectedId())) this.selectedId.set(null)
        this.loading.set(false)
      },
      error: () => {
        this.error.set('Error al cargar las mesas disponibles')
        this.loading.set(false)
      }
    })
  }
}
