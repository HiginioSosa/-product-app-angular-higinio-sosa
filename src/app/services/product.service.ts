import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Product, CreateProductDto, UpdateProductDto } from '../models/product.model';
import { catchError, finalize, tap } from 'rxjs/operators';
import { throwError } from 'rxjs';

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

/**
 * Servicio para gestionar productos usando Fake Store API.
 * Mantiene estado local con signals ya que la API no persiste cambios reales.
 */
@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = 'https://fakestoreapi.com';

  // Estado centralizado con signals para reactividad sin Zone.js
  private readonly _products = signal<Product[]>([]);
  private readonly _loadingState = signal<LoadingState>('idle');
  private readonly _error = signal<string | null>(null);

  // Exposición readonly del estado para encapsulación
  readonly products = this._products.asReadonly();
  readonly loadingState = this._loadingState.asReadonly();
  readonly error = this._error.asReadonly();
  readonly isLoading = computed(() => this._loadingState() === 'loading');

  loadProducts(): void {
    this._loadingState.set('loading');
    this._error.set(null);

    this.http.get<Product[]>(`${this.API_URL}/products`)
      .pipe(
        tap(products => {
          this._products.set(products);
          this._loadingState.set('success');
        }),
        catchError(error => this.handleError(error)),
        finalize(() => {
          // Asegura que el estado no quede en 'loading' si hay error no manejado
          if (this._loadingState() === 'loading') {
            this._loadingState.set('error');
          }
        })
      )
      .subscribe();
  }

  getProduct(id: number) {
    return this.http.get<Product>(`${this.API_URL}/products/${id}`);
  }

  createProduct(product: CreateProductDto) {
    this._loadingState.set('loading');

    return this.http.post<Product>(`${this.API_URL}/products`, product)
      .pipe(
        tap(newProduct => {
          // La API retorna el producto pero no lo persiste,
          // lo agregamos localmente para simular comportamiento real
          this._products.update(products => [newProduct, ...products]);
          this._loadingState.set('success');
        }),
        catchError(error => this.handleError(error))
      );
  }

  updateProduct(id: number, product: UpdateProductDto) {
    this._loadingState.set('loading');

    return this.http.put<Product>(`${this.API_URL}/products/${id}`, product)
      .pipe(
        tap(updatedProduct => {
          // Actualización optimista del estado local
          this._products.update(products =>
            products.map(p => p.id === id ? updatedProduct : p)
          );
          this._loadingState.set('success');
        }),
        catchError(error => this.handleError(error))
      );
  }

  deleteProduct(id: number) {
    this._loadingState.set('loading');

    return this.http.delete(`${this.API_URL}/products/${id}`)
      .pipe(
        tap(() => {
          // Eliminación optimista del estado local
          this._products.update(products =>
            products.filter(p => p.id !== id)
          );
          this._loadingState.set('success');
        }),
        catchError(error => this.handleError(error))
      );
  }

  /**
   * Maneja errores HTTP y actualiza el estado correspondiente
   * Diferencia entre errores del cliente y errores del servidor
   */
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An error occurred';

    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente o de red
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error retornado por el backend
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }

    this._error.set(errorMessage);
    this._loadingState.set('error');
    console.error('ProductService Error:', error);

    return throwError(() => errorMessage);
  }
}
