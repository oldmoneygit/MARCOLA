/**
 * @file nichos.ts
 * @description Constantes para tipos de negócio/nichos suportados pelo Lead Sniper
 * @module lib/lead-sniper
 */

import type { TipoNegocio } from '@/types/lead-sniper';

/**
 * Categorias para agrupar nichos no seletor
 */
export interface CategoriaInfo {
  id: string;
  nome: string;
  icone: string;
}

/**
 * Informações completas de um nicho
 */
export interface NichoInfo {
  codigo: TipoNegocio;
  nome: string;
  icone: string;
  categoria: string;
}

/**
 * Categorias de nichos disponíveis
 */
export const CATEGORIAS_NICHOS: CategoriaInfo[] = [
  { id: 'saude', nome: 'Saúde & Fitness', icone: '🏋️' },
  { id: 'alimentacao', nome: 'Alimentação', icone: '🍽️' },
  { id: 'beleza', nome: 'Beleza & Estética', icone: '💇' },
  { id: 'pets', nome: 'Pets', icone: '🐕' },
  { id: 'imoveis', nome: 'Imóveis & Construção', icone: '🏠' },
  { id: 'automotivo', nome: 'Automotivo', icone: '🚗' },
  { id: 'varejo', nome: 'Varejo', icone: '🛒' },
  { id: 'servicos', nome: 'Serviços Profissionais', icone: '💼' },
  { id: 'educacao', nome: 'Educação', icone: '🎓' },
  { id: 'eventos', nome: 'Eventos & Lazer', icone: '🎉' },
  { id: 'hospedagem', nome: 'Hospedagem', icone: '🏨' },
];

/**
 * Lista completa de nichos disponíveis para pesquisa
 * Todos os códigos são compatíveis com Google Places API
 */
export const NICHOS_DISPONIVEIS: NichoInfo[] = [
  // 🏋️ Saúde & Fitness
  { codigo: 'gym', nome: 'Academia / Fitness', icone: '🏋️', categoria: 'saude' },
  { codigo: 'physiotherapist', nome: 'Fisioterapia', icone: '💆', categoria: 'saude' },
  { codigo: 'spa', nome: 'Spa / Estética', icone: '🧖', categoria: 'saude' },

  // 🍽️ Alimentação
  { codigo: 'restaurant', nome: 'Restaurante', icone: '🍽️', categoria: 'alimentacao' },
  { codigo: 'cafe', nome: 'Cafeteria', icone: '☕', categoria: 'alimentacao' },
  { codigo: 'bakery', nome: 'Padaria / Confeitaria', icone: '🥐', categoria: 'alimentacao' },
  { codigo: 'bar', nome: 'Bar / Pub', icone: '🍺', categoria: 'alimentacao' },
  { codigo: 'meal_delivery', nome: 'Delivery / Dark Kitchen', icone: '🛵', categoria: 'alimentacao' },

  // 💇 Beleza & Estética
  { codigo: 'beauty_salon', nome: 'Salão de Beleza', icone: '💇', categoria: 'beleza' },
  { codigo: 'hair_care', nome: 'Cabeleireiro', icone: '✂️', categoria: 'beleza' },
  { codigo: 'nail_salon', nome: 'Manicure / Nail Designer', icone: '💅', categoria: 'beleza' },

  // 🏥 Saúde
  { codigo: 'dentist', nome: 'Dentista / Clínica Odontológica', icone: '🦷', categoria: 'saude' },
  { codigo: 'doctor', nome: 'Médico / Clínica Médica', icone: '👨‍⚕️', categoria: 'saude' },
  { codigo: 'veterinary_care', nome: 'Veterinário', icone: '🐾', categoria: 'saude' },
  { codigo: 'pharmacy', nome: 'Farmácia', icone: '💊', categoria: 'saude' },
  { codigo: 'hospital', nome: 'Hospital / Pronto Socorro', icone: '🏥', categoria: 'saude' },

  // 🐕 Pets
  { codigo: 'pet_store', nome: 'Pet Shop', icone: '🐕', categoria: 'pets' },

  // 🏠 Imóveis & Construção
  { codigo: 'real_estate_agency', nome: 'Imobiliária', icone: '🏠', categoria: 'imoveis' },
  { codigo: 'general_contractor', nome: 'Construtora / Empreiteira', icone: '🏗️', categoria: 'imoveis' },
  { codigo: 'hardware_store', nome: 'Loja de Materiais de Construção', icone: '🔧', categoria: 'imoveis' },

  // 🚗 Automotivo
  { codigo: 'car_dealer', nome: 'Concessionária / Revenda de Carros', icone: '🚗', categoria: 'automotivo' },
  { codigo: 'car_repair', nome: 'Oficina Mecânica', icone: '🔧', categoria: 'automotivo' },
  { codigo: 'car_wash', nome: 'Lava Jato / Estética Automotiva', icone: '🚿', categoria: 'automotivo' },

  // 🛒 Varejo
  { codigo: 'clothing_store', nome: 'Loja de Roupas', icone: '👕', categoria: 'varejo' },
  { codigo: 'shoe_store', nome: 'Loja de Calçados', icone: '👟', categoria: 'varejo' },
  { codigo: 'jewelry_store', nome: 'Joalheria / Ótica', icone: '💎', categoria: 'varejo' },
  { codigo: 'electronics_store', nome: 'Loja de Eletrônicos', icone: '📱', categoria: 'varejo' },
  { codigo: 'furniture_store', nome: 'Loja de Móveis', icone: '🛋️', categoria: 'varejo' },
  { codigo: 'home_goods_store', nome: 'Loja de Decoração / Casa', icone: '🏡', categoria: 'varejo' },
  { codigo: 'supermarket', nome: 'Supermercado / Mercearia', icone: '🛒', categoria: 'varejo' },

  // 💼 Serviços Profissionais
  { codigo: 'lawyer', nome: 'Advogado / Escritório de Advocacia', icone: '⚖️', categoria: 'servicos' },
  { codigo: 'accounting', nome: 'Contador / Escritório Contábil', icone: '📊', categoria: 'servicos' },
  { codigo: 'insurance_agency', nome: 'Seguradora / Corretora', icone: '🛡️', categoria: 'servicos' },

  // 🎓 Educação
  { codigo: 'school', nome: 'Escola / Colégio', icone: '🏫', categoria: 'educacao' },
  { codigo: 'university', nome: 'Faculdade / Universidade', icone: '🎓', categoria: 'educacao' },
  { codigo: 'driving_school', nome: 'Autoescola', icone: '🚗', categoria: 'educacao' },
  { codigo: 'language_school', nome: 'Escola de Idiomas', icone: '🌍', categoria: 'educacao' },

  // 🎉 Eventos & Lazer
  { codigo: 'event_venue', nome: 'Espaço de Eventos / Buffet', icone: '🎉', categoria: 'eventos' },
  { codigo: 'night_club', nome: 'Balada / Casa Noturna', icone: '🎵', categoria: 'eventos' },
  { codigo: 'movie_theater', nome: 'Cinema', icone: '🎬', categoria: 'eventos' },
  { codigo: 'bowling_alley', nome: 'Boliche / Entretenimento', icone: '🎳', categoria: 'eventos' },

  // 🏨 Hospedagem
  { codigo: 'lodging', nome: 'Hotel / Pousada', icone: '🏨', categoria: 'hospedagem' },
  { codigo: 'campground', nome: 'Camping / Chalé', icone: '⛺', categoria: 'hospedagem' },
];

/**
 * Retorna nichos agrupados por categoria
 */
export function getNichosPorCategoria(): Array<CategoriaInfo & { nichos: NichoInfo[] }> {
  return CATEGORIAS_NICHOS.map((cat) => ({
    ...cat,
    nichos: NICHOS_DISPONIVEIS.filter((n) => n.categoria === cat.id),
  }));
}

/**
 * Busca informações de um nicho pelo código
 */
export function getNichoInfo(codigo: TipoNegocio): NichoInfo | undefined {
  return NICHOS_DISPONIVEIS.find((n) => n.codigo === codigo);
}

/**
 * Retorna o nome formatado de um nicho
 */
export function getNichoNome(codigo: TipoNegocio): string {
  const nicho = getNichoInfo(codigo);
  return nicho ? nicho.nome : codigo;
}

/**
 * Retorna o ícone de um nicho
 */
export function getNichoIcone(codigo: TipoNegocio): string {
  const nicho = getNichoInfo(codigo);
  return nicho ? nicho.icone : '📍';
}
