import { CommonModule } from '@angular/common';
import { Component, inject, signal, type OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductService } from '../../services/product.service';
import type { Product } from '../../models/product.model';

@Component({
  selector: 'app-product-list',
  imports: [CommonModule, RouterLink],
  templateUrl: './product-list.html',
  styleUrl: './product-list.css'
})
export default class ProductList implements OnInit {
  readonly productService = inject(ProductService);
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
      this.productService.deleteProduct(product.id).subscribe({
        next: () => {
          this.productToDelete.set(null);
        },
        error: (error) => {
          console.error('Error deleting product:', error);
          this.productToDelete.set(null);
        }
      });
    }
  }

  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/placeholder-image.png';
  }
}
