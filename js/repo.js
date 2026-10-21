import { supabase, isSupabaseConfigured } from './supabase.js';

const localProducts = [
  { id: 1, nombre: 'Pomada Matte Clay', categoria: 'FIJACIÓN', precio: 14, descripcion: 'Fijación alta y textura mate.', imagen: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=600&auto=format&fit=crop&q=80', tag: 'TOP VENTAS' },
  { id: 2, nombre: 'Óleo Wood & Spice', categoria: 'CUIDADO BARBA', precio: 12.5, descripcion: 'Hidrata la piel y suaviza el vello.', imagen: 'https://images.unsplash.com/photo-1621607512214-68297480165e?w=600&auto=format&fit=crop&q=80', tag: 'RECOMENDADO' },
  { id: 3, nombre: 'Polvo Texturizador', categoria: 'VOLUMEN', precio: 11, descripcion: 'Volumen instantáneo en raíz.', imagen: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=80' },
  { id: 4, nombre: 'After Shave Mint', categoria: 'POST AFEITADO', precio: 9.5, descripcion: 'Calma el ardor y refresca la piel.', imagen: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=600&auto=format&fit=crop&q=80' },
  { id: 5, nombre: 'Shampoo Purificante', categoria: 'CUIDADO CAPILAR', precio: 13, descripcion: 'Limpieza profunda anticaspa.', imagen: 'https://images.unsplash.com/photo-1585751119414-ef2636f8aede?w=600&auto=format&fit=crop&q=80' },
  { id: 6, nombre: 'Aqua Wax Pomade', categoria: 'FIJACIÓN', precio: 12, descripcion: 'Brillo medio de fácil lavado.', imagen: 'https://images.unsplash.com/photo-1512290900672-1f486b72a0c6?w=600&auto=format&fit=crop&q=80' },
  { id: 7, nombre: 'Bálsamo Karité', categoria: 'CUIDADO BARBA', precio: 11.5, descripcion: 'Fijación suave nutritiva.', imagen: 'https://images.unsplash.com/photo-1621607512022-6aecc4fed814?w=600&auto=format&fit=crop&q=80' },
  { id: 8, nombre: 'Tónico Revitalizante', categoria: 'TRATAMIENTO', precio: 10, descripcion: 'Estimula el folículo piloso.', imagen: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&auto=format&fit=crop&q=80' },
  { id: 9, nombre: 'Gel Precisión Clear', categoria: 'AFEITADO', precio: 8.5, descripcion: 'Fórmula 100% transparente.', imagen: 'https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=600&auto=format&fit=crop&q=80' },
  { id: 10, nombre: 'Cepillo Cerdas Jabalí', categoria: 'HERRAMIENTAS', precio: 9, descripcion: 'Madera maciza para barba.', imagen: 'https://images.unsplash.com/photo-1593702295094-ada7554100c3?w=600&auto=format&fit=crop&q=80' },
  { id: 11, nombre: 'Cera Fiber Strong', categoria: 'FIJACIÓN', precio: 13.5, descripcion: 'Textura flexible y fijación fuerte.', imagen: 'https://images.unsplash.com/photo-1622287162716-f311baa1a2b8?w=600&auto=format&fit=crop&q=80', tag: 'NUEVO' },
  { id: 12, nombre: 'Crema Facial Hidratante', categoria: 'CUIDADO FACIAL', precio: 15, descripcion: 'Hidratación ligera para una piel fresca.', imagen: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600&auto=format&fit=crop&q=80' },
  { id: 13, nombre: 'Peine Profesional Carbono', categoria: 'HERRAMIENTAS', precio: 7.5, descripcion: 'Peine resistente al calor.', imagen: 'https://images.unsplash.com/photo-1620331311520-246422fd82f9?w=600&auto=format&fit=crop&q=80' },
  { id: 14, nombre: 'Mascarilla Revitalizante', categoria: 'CUIDADO CAPILAR', precio: 16, descripcion: 'Tratamiento nutritivo para el cabello.', imagen: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&auto=format&fit=crop&q=80', tag: 'TOP VENTAS' }
];

export const ProductRepository = {
  async getProducts() {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('productos').select('*').eq('pro_activo', true).eq('pro_vendible', true).order('pro_nombre');
      if (!error && data?.length) return data.map(p => ({ id: p.pro_codigo, nombre: p.pro_nombre, categoria: p.pro_categoria || 'PRODUCTO', precio: Number(p.pro_precio_promocional ?? p.pro_precio), descripcion: p.pro_descripcion || '', imagen: p.pro_imagen_url || '', tag: p.pro_etiqueta || '' }));
      console.warn('Supabase no devolvió productos; se usa catálogo local.', error?.message);
    }
    return localProducts;
  }
};
