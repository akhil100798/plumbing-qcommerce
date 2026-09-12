import { apiClient } from './api/apiClient';
import { CategoryDTO, ProductDTO } from '../types/backend';
import { Category, categories as staticCategories } from '../data/categories';
import { PlumbingService, services as defaultServices } from '../data/services';
import { Product, products as staticProducts } from '../data/products';

function mapCategoryDTOToUI(dto: CategoryDTO): Category {
  const matchingStatic = staticCategories.find(
    (c) => c.name.toLowerCase() === dto.name.toLowerCase() || c.id === `cat_${dto.id}`
  );
  return {
    id: `cat_${dto.id}`,
    name: dto.name,
    iconName: matchingStatic ? matchingStatic.iconName : 'piping',
    itemCount: matchingStatic ? matchingStatic.itemCount : 45,
    featured: matchingStatic ? matchingStatic.featured : true,
    color: matchingStatic ? matchingStatic.color : '#e8f0fe',
    description: dto.description || matchingStatic?.description || 'Plumbing supplies and fittings',
  };
}

function mapProductDTOToUI(dto: ProductDTO): Product {
  const matchingStatic = staticProducts.find(
    (p) => p.name.toLowerCase() === dto.name.toLowerCase() || p.id === `prod_${dto.id}`
  );
  return {
    id: `prod_${dto.id}`,
    name: dto.name,
    category: dto.categoryName || matchingStatic?.category || 'Pipes & Fittings',
    price: dto.price || matchingStatic?.price || 299,
    originalPrice: matchingStatic?.originalPrice || Math.round((dto.price || 299) * 1.25),
    brand: matchingStatic?.brand || 'FixKart Genuine',
    rating: matchingStatic?.rating || 4.8,
    reviewsCount: matchingStatic?.reviewsCount || 120,
    inStock: true,
    unit: matchingStatic?.unit || 'Piece',
    badge: matchingStatic?.badge,
    description: dto.description || matchingStatic?.description || dto.name,
    specs: matchingStatic?.specs || {
      Standard: 'FixKart Quality Certified',
      Material: 'High-Grade Plumbing Component',
    },
    imageUrl: dto.imageUrl || matchingStatic?.imageUrl || 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500&auto=format&fit=crop&q=80',
  };
}

export class CatalogService {
  static async getCategories(): Promise<Category[]> {
    try {
      const dtos = await apiClient.get<CategoryDTO[]>('/catalog/categories', { timeoutMs: 8000 });
      if (Array.isArray(dtos) && dtos.length > 0) {
        return dtos.map(mapCategoryDTOToUI);
      }
    } catch (e) {
      console.warn('Backend categories fetch failed, using fallback categories:', e);
    }
    return staticCategories;
  }

  static async getFeaturedCategories(): Promise<Category[]> {
    const cats = await this.getCategories();
    return cats.filter((c) => c.featured);
  }

  static async getServices(): Promise<PlumbingService[]> {
    // Services are curated catalog offerings matching standard FixKart plumbing scopes
    return defaultServices;
  }

  static async getServiceById(id: string): Promise<PlumbingService | undefined> {
    return defaultServices.find((s) => s.id === id);
  }

  static async getServicesByCategory(categoryName: string): Promise<PlumbingService[]> {
    return defaultServices.filter(
      (s) => s.category.toLowerCase() === categoryName.toLowerCase()
    );
  }

  static async getProducts(categoryId?: number): Promise<Product[]> {
    try {
      const url = categoryId ? `/catalog/products?categoryId=${categoryId}` : '/catalog/products';
      const dtos = await apiClient.get<ProductDTO[]>(url, { timeoutMs: 8000 });
      if (Array.isArray(dtos) && dtos.length > 0) {
        return dtos.map(mapProductDTOToUI);
      }
    } catch (e) {
      console.warn('Backend products fetch failed, using catalog products fallback:', e);
    }
    return staticProducts;
  }

  static async getProductById(id: string): Promise<Product | undefined> {
    const numericId = id.replace(/[^0-9]/g, '');
    if (numericId) {
      try {
        const dto = await apiClient.get<ProductDTO>(`/catalog/products/${numericId}`, { timeoutMs: 8000 });
        if (dto) {
          return mapProductDTOToUI(dto);
        }
      } catch {
        // Fallback to memory search
      }
    }
    return staticProducts.find((p) => p.id === id);
  }

  static async getProductsByCategory(categoryName: string): Promise<Product[]> {
    const all = await this.getProducts();
    return all.filter((p) => p.category.toLowerCase() === categoryName.toLowerCase());
  }

  static async searchCatalog(query: string): Promise<{ services: PlumbingService[]; products: Product[] }> {
    const q = query.trim();
    if (!q) return { services: [], products: [] };

    let searchedProducts: Product[] = [];
    try {
      const dtos = await apiClient.get<ProductDTO[]>(`/catalog/search?q=${encodeURIComponent(q)}`, { timeoutMs: 8000 });
      if (Array.isArray(dtos) && dtos.length > 0) {
        searchedProducts = dtos.map(mapProductDTOToUI);
      }
    } catch {
      searchedProducts = staticProducts.filter(
        (p) =>
          p.name.toLowerCase().includes(q.toLowerCase()) ||
          p.category.toLowerCase().includes(q.toLowerCase()) ||
          p.brand.toLowerCase().includes(q.toLowerCase())
      );
    }

    const matchedServices = defaultServices.filter(
      (s) =>
        s.title.toLowerCase().includes(q.toLowerCase()) ||
        s.category.toLowerCase().includes(q.toLowerCase()) ||
        s.description.toLowerCase().includes(q.toLowerCase())
    );

    return { services: matchedServices, products: searchedProducts };
  }
}
