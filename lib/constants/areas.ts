/**
 * Towns, LGAs and areas for Lagos and Abuja.
 * Used to run scrapers across all areas when "Run for all areas" is enabled.
 */

export const LAGOS_AREAS = [
  'Ikeja',
  'Surulere',
  'Victoria Island',
  'Lekki',
  'Ikoyi',
  'Yaba',
  'Gbagada',
  'Maryland',
  'Ikorodu',
  'Ajah',
  'Alimosho',
  'Kosofe',
  'Oshodi',
  'Mushin',
  'Agege',
  'Ifako-Ijaiye',
  'Apapa',
  'Amuwo-Odofin',
  'Badagry',
  'Epe',
  'Lagos Island',
  'Mainland',
  'Ojo',
  'Shomolu',
]

export const ABUJA_AREAS = [
  'Wuse',
  'Maitama',
  'Asokoro',
  'Garki',
  'Gwarinpa',
  'Kubwa',
  'Karu',
  'Nyanya',
  'Lugbe',
  'Gwagwalada',
  'Kuje',
  'Abaji',
  'Bwari',
  'Central Area',
  'Jabi',
  'Utako',
  'Wuye',
  'Gudu',
  'Lokogoma',
  'Apo',
]

export type CitySlug = 'LAGOS' | 'ABUJA'

export function getAreasForCity(city: CitySlug | ''): string[] {
  if (city === 'LAGOS') return LAGOS_AREAS
  if (city === 'ABUJA') return ABUJA_AREAS
  return [...LAGOS_AREAS, ...ABUJA_AREAS]
}
