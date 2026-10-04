export const ProductRepository = {
  async getProducts() {
    try {
      const response = await fetch('./data/productos.json');
      if (!response.ok) throw new Error('Error al cargar JSON');
      return await response.json();
    } catch (e) {
      console.warn('Cargando respaldo local de datos...');
      return [
        { id: 1, nombre: "Pomada Matte Clay", categoria: "FIJACIÓN", precio: 14.00, descripcion: "Fijación alta y textura mate.", imagen: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=600&auto=format&fit=crop&q=80", tag: "TOP VENTAS" },
        { id: 2, nombre: "Óleo Wood & Spice", categoria: "CUIDADO BARBA", precio: 12.50, descripcion: "Hidrata la piel y suaviza el vello.", imagen: "https://images.unsplash.com/photo-1621607512214-68297480165e?w=600&auto=format&fit=crop&q=80", tag: "RECOMENDADO" },
        { id: 3, nombre: "Polvo Texturizador", categoria: "VOLUMEN", precio: 11.00, descripcion: "Volumen instantáneo en raíz.", imagen: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=80" },
        { id: 4, nombre: "After Shave Mint", categoria: "POST AFEITADO", precio: 9.50, descripcion: "Calma el ardor y refresca la piel.", imagen: "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=600&auto=format&fit=crop&q=80" },
        { id: 5, nombre: "Shampoo Purificante", categoria: "CUIDADO CAPILAR", precio: 13.00, descripcion: "Limpieza profunda anticaspa.", imagen: "https://images.unsplash.com/photo-1585751119414-ef2636f8aede?w=600&auto=format&fit=crop&q=80" },
        { id: 6, nombre: "Aqua Wax Pomade", categoria: "FIJACIÓN", precio: 12.00, descripcion: "Brillo medio de fácil lavado.", imagen: "https://images.unsplash.com/photo-1512290900672-1f486b72a0c6?w=600&auto=format&fit=crop&q=80" },
        { id: 7, nombre: "Bálsamo Karité", categoria: "CUIDADO BARBA", precio: 11.50, descripcion: "Fijación suave nutritiva.", imagen: "https://images.unsplash.com/photo-1621607512022-6aecc4fed814?w=600&auto=format&fit=crop&q=80" },
        { id: 8, nombre: "Tónico Revitalizante", categoria: "TRATAMIENTO", precio: 10.00, descripcion: "Estimula el folículo piloso.", imagen: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&auto=format&fit=crop&q=80" },
        { id: 9, nombre: "Gel Precisión Clear", categoria: "AFEITADO", precio: 8.50, descripcion: "Fórmula 100% transparente.", imagen: "https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=600&auto=format&fit=crop&q=80" },
        { id: 10, nombre: "Cepillo Cerdas Jabalí", categoria: "HERRAMIENTAS", precio: 9.00, descripcion: "Madera maciza para barba.", imagen: "https://images.unsplash.com/photo-1593702295094-ada7554100c3?w=600&auto=format&fit=crop&q=80" }
      ];
    }
  }
};
