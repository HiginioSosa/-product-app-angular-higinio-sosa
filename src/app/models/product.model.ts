export interface Product {
  id: number;
  title: string;
  price: number;
  description: string;
  category: string;
  image: string;
  rating: {
    rate: number;
    count: number;
  };
}

export interface CreateProductDto {
  title: string;
  price: number;
  description: string;
  category: string;
  image: string;
}

export interface UpdateProductDto extends Partial<CreateProductDto> {}
