/**
 * Koordinat yardımcı fonksiyonları
 * Not: Harita artık Leaflet ile render ediliyor (gerçek OSM tile'lar)
 * Bu dosya sadece haversine mesafe hesabı için kullanılmaktadır.
 */

export function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 +
    Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

export const CAMPUS_BOUNDS = {
  south: 36.3235, north: 36.3365,
  west:  36.1895, east:  36.2015,
  center: { lat: 36.3303718, lng: 36.1963282 },
};
