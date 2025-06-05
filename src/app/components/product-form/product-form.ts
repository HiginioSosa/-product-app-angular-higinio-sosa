import { CommonModule } from '@angular/common';
import { Component, inject, signal, type OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ProductService } from '../../services/product.service';
import type { CreateProductDto } from '../../models/product.model';

/**
 * Formulario dual para creación y edición de productos
 * Detecta el modo basándose en la presencia de ID en la ruta
 */
@Component({
  selector: 'app-product-form',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './product-form.html',
  styleUrl: './product-form.css'
})
export default class ProductForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly productService = inject(ProductService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  // Estados de UI manejados con signals para reactividad
  readonly isEditMode = signal(false);
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  private productId = signal<number | null>(null);

  // Formulario con validaciones síncronas
  readonly productForm = this.fb.group({
    title: ['', [Validators.required]],
    price: [0, [Validators.required, Validators.min(0.01)]], // Evita precios negativos o cero
    category: ['', [Validators.required]],
    image: ['', [Validators.required, Validators.pattern(/^https?:\/\/.+/)]], // URL básica válida
    description: ['', [Validators.required]]
  });

  ngOnInit(): void {
    // Determina modo basándose en la ruta: /products/new vs /products/:id/edit
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode.set(true);
      this.productId.set(+id); // Conversión a número con +
      this.loadProduct(+id);
    }
  }

  loadProduct(id: number) {
    this.productService.getProduct(id).subscribe({
      next: (product) => {
        // patchValue permite actualización parcial del formulario
        this.productForm.patchValue({
          title: product.title,
          price: product.price,
          category: product.category,
          image: product.image,
          description: product.description
        });
      },
      error: (error) => {
        this.errorMessage.set('Failed to load product');
        console.error('Error loading product:', error);
      }
    });
  }

  onSubmit() {
    if (this.productForm.valid && !this.isSubmitting()) {
      this.isSubmitting.set(true);
      this.errorMessage.set(null);
      this.successMessage.set(null);

      const productData = this.productForm.value as CreateProductDto;

      // Operación condicional: crear o actualizar según el modo
      const operation = this.isEditMode() && this.productId()
        ? this.productService.updateProduct(this.productId()!, productData)
        : this.productService.createProduct(productData);

      operation.subscribe({
        next: () => {
          this.successMessage.set(
            this.isEditMode() ? 'Product updated successfully!' : 'Product created successfully!'
          );

          // Delay para que el usuario vea el mensaje de éxito antes de navegar
          setTimeout(() => {
            this.router.navigate(['/products']);
          }, 1500);
        },
        error: (error) => {
          this.errorMessage.set('Failed to save product. Please try again.');
          this.isSubmitting.set(false); // Permite reintentar
          console.error('Error saving product:', error);
        }
      });
    }
  }

  onCancel() {
    this.router.navigate(['/products']);
  }

  /**
   * Fallback para preview de imágenes inválidas
   * Útil cuando el usuario ingresa URLs que no son imágenes válidas
   */
  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = 'public/assets/placeholder-image.png';
  }

}
