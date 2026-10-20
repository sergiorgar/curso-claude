import { Component, DestroyRef, computed, inject, OnInit, signal } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { ActivatedRoute, RouterLink } from '@angular/router'
import { LucideAngularModule } from 'lucide-angular'
import { RestaurantStore } from '../../store/restaurant.store'

@Component({
  selector: 'app-restaurant-dashboard',
  standalone: true,
  imports: [RouterLink, LucideAngularModule],
  templateUrl: './restaurant-dashboard.component.html',
  styleUrl: './restaurant-dashboard.component.css'
})
export class RestaurantDashboardComponent implements OnInit {
  private readonly route = inject(ActivatedRoute)
  private readonly restaurantStore = inject(RestaurantStore)

  private readonly destroyRef = inject(DestroyRef)

  restaurantId = signal('')
  restaurantName = computed(() => this.restaurantStore.getById(this.restaurantId())?.name ?? 'Restaurante')

  ngOnInit(): void {
    this.route.parent?.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => this.restaurantId.set(params.get('restaurantId') ?? ''))
  }
}
