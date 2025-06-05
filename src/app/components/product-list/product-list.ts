import { CommonModule } from '@angular/common';
import { Component, inject, signal, type OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductService } from '../../services/product.service';
import type { Product } from '../../models/product.model';

/**
 * Componente de lista de productos con capacidad de eliminación
 * Usa signals del servicio para estado reactivo sin necesidad de subscriptions manuales
 */
@Component({
  selector: 'app-product-list',
  imports: [CommonModule, RouterLink],
  templateUrl: './product-list.html',
  styleUrl: './product-list.css'
})
export default class ProductList implements OnInit {
  // Inyección readonly para acceder al estado reactivo del servicio
  readonly productService = inject(ProductService);
  // Estado local para manejar el modal de confirmación de eliminación
  readonly productToDelete = signal<Product | null>(null);

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts() {
    this.productService.loadProducts();
  }

  confirmDelete(product: Product) {
    this.productToDelete.set(product);
  }

  cancelDelete() {
    this.productToDelete.set(null);
  }

  deleteProduct() {
    const product = this.productToDelete();
    if (product) {
      // Subscription manual necesaria porque deleteProduct retorna Observable
      // El estado se actualiza automáticamente en el servicio
      this.productService.deleteProduct(product.id).subscribe({
        next: () => {
          this.productToDelete.set(null);
        },
        error: (error) => {
          console.error('Error deleting product:', error);
          // Cerramos el modal incluso en error para mejor UX
          this.productToDelete.set(null);
        }
      });
    }
  }

  /**
   * Fallback para imágenes que no cargan correctamente
   * Común en APIs públicas donde las URLs pueden estar rotas
   */
  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = 'public/assets/placeholder-image.png';
  }
}
