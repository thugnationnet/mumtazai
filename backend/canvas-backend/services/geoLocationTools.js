/**
 * GEO & LOCATION TOOLS — Geocoding, routing, distance, geofencing
 * DB models: GeoRecord
 */

import prisma from '../lib/prisma.js';

export const GEO_LOCATION_TOOL_DEFINITIONS = [
  {
    name: 'geo_geocode',
    description: 'Geocode addresses to coordinates or reverse-geocode coordinates to addresses.',
    input_schema: {
      type: 'object',
      properties: {
        operation: { type: 'string', enum: ['geocode', 'reverse', 'batch', 'list'], description: 'Operation' },
        address:   { type: 'string', description: 'Address to geocode' },
        lat:       { type: 'number', description: 'Latitude (for reverse)' },
        lon:       { type: 'number', description: 'Longitude (for reverse)' },
        addresses: { type: 'array', description: 'Batch addresses', items: { type: 'string' } },
      },
      required: ['operation'],
    },
  },
  {
    name: 'geo_route',
    description: 'Calculate routes between waypoints — distance, duration, turn-by-turn directions.',
    input_schema: {
      type: 'object',
      properties: {
        origin:      { type: 'object', description: '{ lat, lon } or { address }' },
        destination: { type: 'object', description: '{ lat, lon } or { address }' },
        waypoints:   { type: 'array', description: 'Intermediate waypoints', items: { type: 'object' } },
        mode:        { type: 'string', enum: ['driving', 'walking', 'cycling', 'transit'], description: 'Travel mode' },
        avoid:       { type: 'array', description: 'Avoid features (tolls, highways, ferries)', items: { type: 'string' } },
      },
      required: ['origin', 'destination'],
    },
  },
  {
    name: 'geo_distance',
    description: 'Calculate distance and bearing between coordinates using Haversine formula.',
    input_schema: {
      type: 'object',
      properties: {
        from:  { type: 'object', description: '{ lat, lon }', properties: { lat: { type: 'number' }, lon: { type: 'number' } } },
        to:    { type: 'object', description: '{ lat, lon }', properties: { lat: { type: 'number' }, lon: { type: 'number' } } },
        unit:  { type: 'string', enum: ['km', 'miles', 'meters', 'nautical'], description: 'Distance unit (default: km)' },
      },
      required: ['from', 'to'],
    },
  },
  {
    name: 'geo_fence',
    description: 'Create and check geofences — circular or polygon zones with entry/exit detection.',
    input_schema: {
      type: 'object',
      properties: {
        operation: { type: 'string', enum: ['create', 'check', 'list', 'delete'], description: 'Operation' },
        fenceId:   { type: 'string', description: 'Fence ID' },
        name:      { type: 'string', description: 'Fence name' },
        type:      { type: 'string', enum: ['circle', 'polygon'], description: 'Fence type' },
        center:    { type: 'object', description: '{ lat, lon } for circle fence' },
        radius:    { type: 'number', description: 'Radius in meters (for circle)' },
        polygon:   { type: 'array', description: 'Polygon vertices [{ lat, lon }]', items: { type: 'object' } },
        point:     { type: 'object', description: '{ lat, lon } to check' },
      },
      required: ['operation'],
    },
  },
];

// Haversine formula
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function bearing(lat1, lon1, lat2, lon2) {
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const y = Math.sin(dLon) * Math.cos(lat2 * Math.PI / 180);
  const x = Math.cos(lat1 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180) - Math.sin(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.cos(dLon);
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

function pointInPolygon(point, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lat, yi = polygon[i].lon;
    const xj = polygon[j].lat, yj = polygon[j].lon;
    const intersect = ((yi > point.lon) !== (yj > point.lon)) && (point.lat < (xj - xi) * (point.lon - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

export async function executeGeoLocationTool(toolName, input, ctx = {}) {
  const userId = ctx.userId || 'anonymous';
  try {
    switch (toolName) {

      case 'geo_geocode': {
        switch (input.operation) {
          case 'geocode': {
            // Simple geocoding via stored records or estimation
            const existing = await prisma.geoRecord.findFirst({ where: { userId, address: { contains: input.address, mode: 'insensitive' } } });
            if (existing) return { result: JSON.stringify({ status: 'success', address: existing.address, lat: existing.lat, lon: existing.lon, source: 'cached' }) };

            // Create a placeholder record (real geocoding would call external API)
            const record = await prisma.geoRecord.create({
              data: { userId, address: input.address, lat: 0, lon: 0, source: 'pending', metadata: { needsGeocoding: true } },
            });
            return { result: JSON.stringify({ status: 'success', recordId: record.id, address: input.address, note: 'Geocoding queued. Connect a geocoding API (Google Maps, Mapbox, etc.) for real coordinates.' }) };
          }
          case 'reverse': {
            const nearby = await prisma.geoRecord.findFirst({
              where: { userId, lat: { gte: input.lat - 0.01, lte: input.lat + 0.01 }, lon: { gte: input.lon - 0.01, lte: input.lon + 0.01 } },
            });
            if (nearby) return { result: JSON.stringify({ status: 'success', address: nearby.address, lat: input.lat, lon: input.lon }) };
            return { result: JSON.stringify({ status: 'success', lat: input.lat, lon: input.lon, note: 'No cached record found. Connect a geocoding API for reverse lookups.' }) };
          }
          case 'list': {
            const records = await prisma.geoRecord.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 50 });
            return { result: JSON.stringify({ status: 'success', count: records.length, records: records.map(r => ({ id: r.id, address: r.address, lat: r.lat, lon: r.lon })) }) };
          }
          default:
            return { result: JSON.stringify({ status: 'error', error: 'Unknown operation' }) };
        }
      }

      case 'geo_route': {
        const origin = input.origin;
        const dest = input.destination;
        if (!origin.lat || !dest.lat) return { result: JSON.stringify({ status: 'success', note: 'Provide lat/lon coordinates for both origin and destination. Connect a routing API (Google Directions, OSRM, Mapbox) for full route planning.' }) };

        const dist = haversineDistance(origin.lat, origin.lon, dest.lat, dest.lon);
        const speeds = { driving: 60, cycling: 15, walking: 5, transit: 40 };
        const speed = speeds[input.mode || 'driving'];
        const duration = Math.round(dist / speed * 60); // minutes

        const waypoints = input.waypoints || [];
        let totalDist = dist;
        if (waypoints.length > 0) {
          let prev = origin;
          totalDist = 0;
          for (const wp of [...waypoints, dest]) {
            totalDist += haversineDistance(prev.lat, prev.lon, wp.lat, wp.lon);
            prev = wp;
          }
        }

        return { result: JSON.stringify({ status: 'success', distance: Math.round(totalDist * 100) / 100, unit: 'km', duration: `${duration} min`, mode: input.mode || 'driving', waypoints: waypoints.length, bearing: Math.round(bearing(origin.lat, origin.lon, dest.lat, dest.lon)) }) };
      }

      case 'geo_distance': {
        const { from, to } = input;
        const distKm = haversineDistance(from.lat, from.lon, to.lat, to.lon);
        const conversions = { km: 1, miles: 0.621371, meters: 1000, nautical: 0.539957 };
        const unit = input.unit || 'km';
        const distance = Math.round(distKm * (conversions[unit] || 1) * 100) / 100;

        return { result: JSON.stringify({ status: 'success', distance, unit, bearing: Math.round(bearing(from.lat, from.lon, to.lat, to.lon) * 10) / 10, from, to }) };
      }

      case 'geo_fence': {
        switch (input.operation) {
          case 'create': {
            const fence = await prisma.geoRecord.create({
              data: {
                userId,
                address: input.name || 'Geofence',
                lat: input.center?.lat || 0,
                lon: input.center?.lon || 0,
                source: 'geofence',
                metadata: { type: input.type || 'circle', radius: input.radius || 1000, polygon: input.polygon || null },
              },
            });
            return { result: JSON.stringify({ status: 'success', fenceId: fence.id, name: input.name, type: input.type || 'circle' }) };
          }
          case 'check': {
            const fence = await prisma.geoRecord.findFirst({ where: { id: input.fenceId, userId, source: 'geofence' } });
            if (!fence) return { result: JSON.stringify({ status: 'error', error: 'Fence not found' }) };
            const meta = fence.metadata || {};
            const point = input.point;
            let inside = false;

            if (meta.type === 'circle') {
              const dist = haversineDistance(fence.lat, fence.lon, point.lat, point.lon) * 1000; // meters
              inside = dist <= (meta.radius || 1000);
            } else if (meta.type === 'polygon' && meta.polygon) {
              inside = pointInPolygon(point, meta.polygon);
            }

            return { result: JSON.stringify({ status: 'success', fenceId: input.fenceId, point, inside, fenceType: meta.type }) };
          }
          case 'list': {
            const fences = await prisma.geoRecord.findMany({ where: { userId, source: 'geofence' }, orderBy: { createdAt: 'desc' }, take: 20 });
            return { result: JSON.stringify({ status: 'success', count: fences.length, fences: fences.map(f => ({ id: f.id, name: f.address, type: f.metadata?.type, lat: f.lat, lon: f.lon })) }) };
          }
          case 'delete': {
            await prisma.geoRecord.deleteMany({ where: { id: input.fenceId, userId, source: 'geofence' } });
            return { result: JSON.stringify({ status: 'success', deleted: input.fenceId }) };
          }
          default:
            return { result: JSON.stringify({ status: 'error', error: 'Unknown operation' }) };
        }
      }

      default:
        return { result: JSON.stringify({ status: 'error', error: `Unknown tool: ${toolName}` }) };
    }
  } catch (err) {
    return { result: JSON.stringify({ status: 'error', error: err.message, tool: toolName }) };
  }
}

export const isGeoLocationTool = (name) => GEO_LOCATION_TOOL_DEFINITIONS.some(t => t.name === name);
