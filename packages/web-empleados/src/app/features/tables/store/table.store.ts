import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Table, TableStatus, TableWithOrders } from '../models/table.model';
import { TableService } from '../services/table.service';

@Injectable({ providedIn: 'root' })
export class TableStore {
  private readonly tableService = inject(TableService);

  private readonly _tables = signal<Table[]>([]);
  private readonly _occupied = signal<TableWithOrders[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  private pollingInterval: ReturnType<typeof setInterval> | null = null;

  readonly tables = this._tables.asReadonly();
  readonly occupied = this._occupied.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  async load(restaurantId: string): Promise<void> {
    this._loading.set(true);
    try {
      const [tables, occupied] = await Promise.all([
        firstValueFrom(this.tableService.getTables(restaurantId)),
        firstValueFrom(this.tableService.getOccupiedTablesOrders(restaurantId)),
      ]);
      this._tables.set(tables);
      this._occupied.set(occupied);
      this._error.set(null);
    } catch (err: any) {
      this._error.set(err.error?.message || err.message || 'Error al cargar mesas');
    } finally {
      this._loading.set(false);
    }
  }

  async updateStatus(restaurantId: string, tableId: string, status: TableStatus): Promise<void> {
    try {
      const updated = await firstValueFrom(
        this.tableService.updateStatus(restaurantId, tableId, { status })
      );
      this._tables.update(tables => tables.map(t => (t.id === updated.id ? updated : t)));
      await this.load(restaurantId);
    } catch (err: any) {
      this._error.set(err.error?.message || err.message || 'Error al actualizar la mesa');
    }
  }

  startPolling(restaurantId: string): void {
    this.stopPolling();
    this.load(restaurantId);
    this.pollingInterval = setInterval(() => {
      this.load(restaurantId);
    }, 30000);
  }

  stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }
}
