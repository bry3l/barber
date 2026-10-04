/**
 * Módulo de Repositorio de Datos
 * Carga asíncrona de datos desde el archivo local JSON.
 */

export const ProductRepository = {
  async getProducts() {
    try {
      const response = await fetch('./data/productos.json');
      if (!response.ok) {
        throw new Error(`Error de red al cargar catálogo: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error en ProductRepository.getProducts:', error);
      return [];
    }
  }
};
