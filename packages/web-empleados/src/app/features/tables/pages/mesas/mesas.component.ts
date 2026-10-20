import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { AuthStore } from '@resttek/web-shared';
import { TableStore } from '../../store/table.store';
import { Table, TableStatus } from '../../models/table.model';

@Component({
  selector: 'app-mesas',
  standalone: true,
  templateUrl: './mesas.component.html',
  styleUrl: './mesas.component.css'
})
export class MesasComponent implements OnInit, OnDestroy {
  private readonly authStore = inject(AuthStore);
  readonly tableStore = inject(TableStore);

  readonly statuses: TableStatus[] = ['libre', 'ocupada', 'reservada'];
  readonly filter = signal<TableStatus | null>(null);

  readonly canChangeStatus = computed(() => this.authStore.userRole() !== 'cocinero');

  readonly filteredTables = computed(() => {
    const status = this.filter();
    const tables = this.tableStore.tables();
    return status ? tables.filter(t => t.status === status) : tables;
  });

  ngOnInit(): void {
    const restaurantId = this.authStore.user()?.restaurantId;
    if (restaurantId) {
      this.tableStore.startPolling(restaurantId);
    }
  }

  ngOnDestroy(): void {
    this.tableStore.stopPolling();
  }

  setFilter(status: TableStatus | null): void {
    this.filter.set(status);
  }

  changeStatus(table: Table, status: TableStatus): void {
    const restaurantId = this.authStore.user()?.restaurantId;
    if (restaurantId && table.status !== status) {
      this.tableStore.updateStatus(restaurantId, table.id, status);
    }
  }

  getStatusClass(status: string): string {
    return `badge badge-mesa-${status}`;
  }
}
