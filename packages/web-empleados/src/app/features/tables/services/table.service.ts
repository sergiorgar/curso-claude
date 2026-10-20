import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Table, TableStatus, TableWithOrders, UpdateTableStatusDto } from '../models/table.model';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class TableService {
  private readonly http = inject(HttpClient);

  private baseUrl(restaurantId: string): string {
    return `${environment.apiUrl}/restaurants/${restaurantId}/tables`;
  }

  getTables(restaurantId: string, status?: TableStatus): Observable<Table[]> {
    let params = new HttpParams();
    if (status) {
      params = params.set('status', status);
    }
    return this.http.get<Table[]>(this.baseUrl(restaurantId), { params });
  }

  updateStatus(restaurantId: string, tableId: string, dto: UpdateTableStatusDto): Observable<Table> {
    return this.http.patch<Table>(`${this.baseUrl(restaurantId)}/${tableId}/status`, dto);
  }

  getOccupiedTablesOrders(restaurantId: string): Observable<TableWithOrders[]> {
    return this.http.get<TableWithOrders[]>(`${this.baseUrl(restaurantId)}/orders`);
  }
}
