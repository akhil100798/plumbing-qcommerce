export interface ProductDTO {
  id: number;
  sku: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  categoryId: number;
  categoryName: string;
}

export interface CategoryDTO {
  id: number;
  name: string;
  description: string;
  parentId: number | null;
}
