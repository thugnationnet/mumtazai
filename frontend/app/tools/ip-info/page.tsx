'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Globe, 
  MapPin, 
  Shield, 
  Server, 
  Clock, 
  Copy, 
  Download, 
  Search,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  Eye,
  Globe2,
  Wifi,
  Navigation
} from 'lucide-react';
import DoctorNetworkChat from '@/components/DoctorNetworkChat';
import Script from 'next/script';

// Declare Google Maps JS SDK global to satisfy TypeScript when script is loaded at runtime
declare const google: any;

interface IPLocation {
  city?: string;
  region?: string;
  country?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  postal?: string;
  timezone?: string;
}

interface IPNetwork {
  isp?: string;
  organization?: string;
  asn?: string;
  asnName?: string;
  domain?: string;
  type?: string;
}

interface IPSecurity {
  isVPN: boolean;
  isProxy: boolean;
  isTor: boolean;
  isHosting: boolean;
  threat: 'low' | 'medium' | 'high';
  service?: string;
}

interface IPAbuse {
  contact: string;
  network: string;
  name: string;
}

interface IPMetadata {
  hostname?: string;
  lastUpdated: string;
  source: string;
  userAgent?: string;
}

interface IPInfoData {
  ip: string;
  location: IPLocation;
  network: IPNetwork;
  security: IPSecurity;
  abuse?: IPAbuse;
  metadata: IPMetadata;
}

interface APIResponse {
  success: boolean;
  data: IPInfoData;
  raw: any;
  error?: string;
}

const getThreatColor = (threat: string) => {
  switch (threat) {
    case 'high': return 'text-red-600 bg-red-50 border-red-200';
    case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    default: return 'text-green-600 bg-green-50 border-green-200';
  }
};

const getThreatIcon = (threat: string) => {
  switch (threat) {
    case 'high': return <XCircle className="w-4 h-4" />;
    case 'medium': return <AlertTriangle className="w-4 h-4" />;
    default: return <CheckCircle className="w-4 h-4" />;
  }
};

// Advanced security analysis function
const getSecurityAnalysis = (security: IPSecurity, network: IPNetwork) => {
  const warnings: Array<{
    level: 'low' | 'medium' | 'high';
    title: string;
    description: string;
    recommendation: string;
  }> = [];
  const recommendations: string[] = [];
  
  if (security.isTor) {
    warnings.push({
      level: 'high',
      title: 'Tor Network Detected',
      description: 'This IP is associated with the Tor anonymity network. While Tor is legal, it may indicate privacy-focused browsing or potential security concerns.',
      recommendation: 'Monitor for unusual activity if this is unexpected.'
    });
  }
  
  if (security.isProxy) {
    warnings.push({
      level: 'medium',
      title: 'Proxy Server Detected',
      description: 'This IP appears to be using a proxy server, which can hide the real origin of traffic.',
      recommendation: 'Verify if proxy usage is intentional for your use case.'
    });
  }
  
  if (security.isVPN) {
    warnings.push({
      level: 'medium',
      title: 'VPN Connection Detected',
      description: 'This IP is likely connected through a VPN service for privacy protection.',
      recommendation: 'VPNs are generally good for privacy but may affect location accuracy.'
    });
  }
  
  if (security.isHosting) {
    warnings.push({
      level: 'low',
      title: 'Hosting Provider IP',
      description: 'This IP belongs to a hosting/cloud provider rather than a residential ISP.',
      recommendation: 'Common for servers, businesses, or VPN services.'
    });
  }
  
  // Additional security checks based on network info
  if (network.type === 'hosting' || network.organization?.toLowerCase().includes('hosting')) {
    warnings.push({
      level: 'low',
      title: 'Data Center IP',
      description: 'This IP originates from a data center or hosting facility.',
      recommendation: 'Expected for cloud services, servers, or certain VPN providers.'
    });
  }
  
  return { warnings, recommendations };
};

export default function IPInfoPage() {
  const [ipData, setIpData] = useState<IPInfoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [manualIP, setManualIP] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [showRawData, setShowRawData] = useState(false);
  const [rawData, setRawData] = useState<any>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [map, setMap] = useState<any>(null);
  const [marker, setMarker] = useState<any>(null);
  const [markerType, setMarkerType] = useState<'advanced' | 'legacy'>('legacy');
  const [infoWindow, setInfoWindow] = useState<any>(null);
  const [formattedAddress, setFormattedAddress] = useState<string | null>(null);
  const [showQuickInfo, setShowQuickInfo] = useState(true);
  const [toast, setToast] = useState<null | { message: string; type?: 'success' | 'info' | 'error' }>(null);
  const mapsApiKey = useMemo(() => (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '').trim(), []);
  const [mapsAvailable, setMapsAvailable] = useState<boolean>(!!mapsApiKey);

  // Fallback address from IP fields when reverse geocoding is unavailable
  // IMPORTANT: Defined before useEffects that depend on it
  const getFallbackAddress = useCallback(() => {
    if (!ipData) return null;
    const parts = [ipData.location.city, ipData.location.region, ipData.location.country]
      .filter(Boolean)
      .join(', ');
    return parts || null;
  }, [ipData]);

  // Build info window HTML for Google Maps marker
  // IMPORTANT: Defined before useEffects that depend on it
  const buildInfoWindowHtml = useCallback((
    data: IPInfoData,
    lat: number,
    lng: number,
    address?: string | null
  ) => `
    <div style="padding: 12px; max-width: 300px; font-family: system-ui, -apple-system, sans-serif;">
      <h3 style="font-weight: 700; margin-bottom: 10px; color: #1a1a1a; font-size: 16px;">${data.ip}</h3>
      ${address ? `<div style="margin: 6px 0; font-size: 14px; color: #2c3e50; line-height: 1.4;"><strong style="color: #1a1a1a;">Address:</strong> ${address}</div>` : ''}
      <div style="margin: 6px 0; font-size: 14px; color: #2c3e50;"><strong style="color: #1a1a1a;">City:</strong> ${data.location.city || 'Unknown'}</div>
      <div style="margin: 6px 0; font-size: 14px; color: #2c3e50;"><strong style="color: #1a1a1a;">Region:</strong> ${data.location.region || 'N/A'}</div>
      <div style="margin: 6px 0; font-size: 14px; color: #2c3e50;"><strong style="color: #1a1a1a;">Country:</strong> ${data.location.country || 'Unknown'}</div>
      ${data.network.organization ? `<div style="margin: 6px 0; font-size: 14px; color: #2c3e50;"><strong style="color: #1a1a1a;">Organization:</strong> ${data.network.organization}</div>` : ''}
      <div style="margin: 8px 0 4px 0; padding-top: 8px; border-top: 1px solid #e0e0e0; font-size: 13px; color: #34495e;"><strong style="color: #1a1a1a;">Coordinates:</strong> ${lat.toFixed(6)}, ${lng.toFixed(6)}</div>
    </div>
  `, []);

  // Set up Google Maps callback
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).initGoogleMaps = () => {
        console.log('Google Maps API fully loaded');
        setMapLoaded(true);
      };
    }
  }, []);

  // Auto-detect user's IP on page load
  useEffect(() => {
    fetchIPInfo();
  }, []);

  const fetchIPInfo = async (targetIP?: string) => {
    try {
      if (targetIP) {
        setSearchLoading(true);
      } else {
        setLoading(true);
      }
      
      setError(null);
      
      const response = await fetch('/api/tools/ip-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip: targetIP || '' }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to fetch IP information';
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          errorMessage = errorText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }
      
      const result: APIResponse = await response.json();
      
      setIpData(result.data);
      setRawData(result.raw);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setIpData(null);
      setRawData(null);
    } finally {
      setLoading(false);
      setSearchLoading(false);
    }
  };

  // Initialize or update Google Map when coordinates are available
  useEffect(() => {
    if (!mapsAvailable || !mapLoaded || !ipData?.location?.coordinates) return;

    // Wait for google.maps to be fully loaded
    if (typeof window === 'undefined' || !window.google || !window.google.maps || !window.google.maps.Map) {
      console.warn('Google Maps API not fully loaded yet');
      return;
    }

    const { lat, lng } = ipData.location.coordinates;
    const center = { lat, lng };

    // Create map if not created yet
    if (!map) {
      const mapElement = document.getElementById('google-map');
      if (!mapElement) return;

      try {
        const newMap = new google.maps.Map(mapElement, {
          center,
          zoom: 12,
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true,
          mapId: 'DEMO_MAP_ID', // Required for AdvancedMarkerElement
        });

        // Use AdvancedMarkerElement if available (new API), fallback to Marker
        let newMarker: any;
        try {
          if (google.maps.marker && google.maps.marker.AdvancedMarkerElement) {
            newMarker = new google.maps.marker.AdvancedMarkerElement({
              position: center,
              map: newMap,
              title: `${ipData.location.city || 'Unknown'}, ${ipData.location.country || 'Unknown'}`,
            });
            setMarkerType('advanced');
          } else {
            throw new Error('AdvancedMarkerElement not available');
          }
        } catch (e) {
          // Fallback to deprecated Marker
          newMarker = new google.maps.Marker({
            position: center,
            map: newMap,
            title: `${ipData.location.city || 'Unknown'}, ${ipData.location.country || 'Unknown'}`,
            animation: google.maps.Animation.DROP,
          });
          setMarkerType('legacy');
        }

        const newInfoWindow = new google.maps.InfoWindow({
          content: buildInfoWindowHtml(ipData, lat, lng, formattedAddress || getFallbackAddress()),
        });

        newMarker.addListener('click', () => newInfoWindow.open(newMap, newMarker));

        setMap(newMap);
        setMarker(newMarker);
        setInfoWindow(newInfoWindow);
        newInfoWindow.open(newMap, newMarker);
      } catch (e) {
        // Likely due to missing/invalid API key or Maps not available
        console.warn('Google Maps initialization failed, disabling map preview.', e);
        setMapsAvailable(false);
      }
      return;
    }

    // Update map center and marker if map already exists (e.g., manual IP lookup)
    map.setCenter(center);
    
    // Update marker position based on marker type
    if (marker) {
      if (markerType === 'advanced') {
        // AdvancedMarkerElement uses property assignment
        marker.position = center;
      } else {
        // Legacy Marker uses setPosition method
        marker.setPosition(center);
      }
    }

    if (infoWindow) {
      infoWindow.setContent(buildInfoWindowHtml(ipData, lat, lng, formattedAddress || getFallbackAddress()));
    }
  }, [mapsAvailable, mapLoaded, ipData, map, marker, markerType, infoWindow, formattedAddress, getFallbackAddress]);

  // Reverse geocode to get a human-readable address for the coordinates
  useEffect(() => {
  if (!mapsAvailable || !mapLoaded || !ipData?.location?.coordinates) return;
    try {
      const geocoder = new google.maps.Geocoder();
      const { lat, lng } = ipData.location.coordinates;
      geocoder.geocode({ location: { lat, lng } }, (results: any, status: string) => {
        if (status === 'OK' && results && results[0]) {
          setFormattedAddress(results[0].formatted_address);
        } else {
          setFormattedAddress(getFallbackAddress());
        }
      });
    } catch (e) {
      setFormattedAddress(getFallbackAddress());
    }
  }, [mapsAvailable, mapLoaded, ipData?.location?.coordinates, getFallbackAddress]);

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualIP.trim()) {
      fetchIPInfo(manualIP.trim());
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
      setToast({ message: `${field === 'rawData' ? 'Raw data' : field} copied to clipboard`, type: 'success' });
    } catch (err) {
      console.error('Failed to copy:', err);
      setToast({ message: 'Failed to copy', type: 'error' });
    }
  };

  const downloadReport = () => {
    if (!ipData) return;
    
    const report = {
      ip: ipData.ip,
      location: ipData.location,
      network: ipData.network,
      security: ipData.security,
      abuse: ipData.abuse,
      metadata: ipData.metadata,
      generatedAt: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ip-report-${ipData.ip}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const openInGoogleMapsUrl = (lat?: number, lng?: number) => {
    if (typeof lat !== 'number' || typeof lng !== 'number') return '#';
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  };

  const getDirectionsUrl = (lat?: number, lng?: number) => {
    if (typeof lat !== 'number' || typeof lng !== 'number') return '#';
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  };

  const shareLocation = (lat?: number, lng?: number, address?: string, ip?: string) => {
    if (typeof lat !== 'number' || typeof lng !== 'number') return;
    const url = openInGoogleMapsUrl(lat, lng);
    const text = address || getFallbackAddress() || `${lat}, ${lng}`;
    const title = ip ? `IP ${ip} location` : 'Location';
    try {
      if (navigator.share) {
        navigator
          .share({ title, text, url })
          .then(() => setToast({ message: 'Share dialog opened', type: 'info' }))
          .catch(() => {
            copyToClipboard(url, 'shareUrl');
            setToast({ message: 'Link copied to clipboard', type: 'success' });
          });
      } else {
        copyToClipboard(url, 'shareUrl');
        setToast({ message: 'Link copied to clipboard', type: 'success' });
      }
    } catch {
      copyToClipboard(url, 'shareUrl');
      setToast({ message: 'Link copied to clipboard', type: 'success' });
    }
  };

  // Simple toast auto-dismiss
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2000);
    return () => clearTimeout(id);
  }, [toast]);

  // Detect Google Maps error overlay (e.g., InvalidKeyMapError) and gracefully fallback
  useEffect(() => {
    if (!mapLoaded || !mapsAvailable) return;
    const id = setTimeout(() => {
      const el = document.getElementById('google-map');
      if (!el) return;
      const hasErrorOverlay = !!el.querySelector('.gm-err-container');
      if (hasErrorOverlay) {
        setMapsAvailable(false);
      }
    }, 1200);
    return () => clearTimeout(id);
  }, [mapLoaded, mapsAvailable]);

  const InfoCard = ({ title, children, icon }: { title: string; children: React.ReactNode; icon: React.ReactNode }) => (
    <div className="card card-padding">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h3 className="text-lg font-semibold text-contrast-high">{title}</h3>
      </div>
      {children}
    </div>
  );

  const InfoRow = ({ label, value, copyable = false }: { label: string; value?: string; copyable?: boolean }) => {
    if (!value) return null;
    
    return (
      <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
        <span className="text-sm font-medium text-gray-600">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-900">{value}</span>
          {copyable && (
            <button
              onClick={() => copyToClipboard(value, label)}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              title="Copy to clipboard"
            >
              {copiedField === label ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-12">
              <Loader2 className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Detecting Your IP Address</h2>
              <p className="text-gray-600">Please wait while we gather your network information...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Google Maps Script (only if key provided); add modern params to satisfy console warnings */}
      {mapsApiKey && (
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${mapsApiKey}&v=weekly&libraries=places,marker&loading=async&callback=initGoogleMaps`}
          strategy="afterInteractive"
          onError={() => setMapsAvailable(false)}
        />
      )}
      
      <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Globe2 className="w-8 h-8 text-contrast-high" />
              <h1 className="text-3xl font-bold">IP Address Lookup Tool</h1>
            </div>
            <p className="text-lg text-contrast-medium max-w-2xl mx-auto">
              Get detailed information about any IP address including location, ISP details, 
              security flags, and network information.
            </p>
          </div>

          {/* Manual Search */}
          <div className="card card-padding mb-8">
            <form onSubmit={handleManualSearch} className="flex gap-3">
              <div className="flex-1">
                <input
                  type="text"
                  value={manualIP}
                  onChange={(e) => setManualIP(e.target.value)}
                  placeholder="Enter IP address to lookup (e.g., 8.8.8.8)"
                  className="form-input"
                />
              </div>
              <button
                type="submit"
                disabled={searchLoading || !manualIP.trim()}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {searchLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Search className="w-5 h-5" />
                )}
                Lookup
              </button>
            </form>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-600" />
                <p className="text-red-800 font-medium">Error</p>
              </div>
              <p className="text-red-700 mt-1">{error}</p>
            </div>
          )}

          {/* IP Information Display */}
          {ipData && (
            <>
              {/* IP Address Header */}
              <div className="rounded-lg p-6 mb-8 text-white btn-primary !w-full !justify-between">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">IP Address: {ipData.ip}</h2>
                    <div className="flex items-center gap-4 opacity-90">
                      {ipData.location.city && ipData.location.country && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>{ipData.location.city}, {ipData.location.country}</span>
                        </div>
                      )}
                      {ipData.network.isp && (
                        <div className="flex items-center gap-1">
                          <Wifi className="w-4 h-4" />
                          <span>{ipData.network.isp}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => copyToClipboard(ipData.ip, 'ip')}
                      className="p-2 bg-black/20 hover:bg-black/30 rounded-lg transition-colors"
                      title="Copy IP address"
                    >
                      {copiedField === 'ip' ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <Copy className="w-5 h-5" />
                      )}
                    </button>
                    <button
                      onClick={downloadReport}
                      className="p-2 bg-black/20 hover:bg-black/30 rounded-lg transition-colors"
                      title="Download report"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Security Alerts */}
              {(() => {
                const securityAnalysis = getSecurityAnalysis(ipData.security, ipData.network);
                return securityAnalysis.warnings.length > 0 && (
                  <div className="mb-8">
                    {securityAnalysis.warnings.map((warning, idx) => (
                      <div key={idx} className={`rounded-lg border p-4 mb-4 ${
                        warning.level === 'high' ? 'bg-red-50 border-red-200' :
                        warning.level === 'medium' ? 'bg-yellow-50 border-yellow-200' :
                        'bg-blue-50 border-blue-200'
                      }`}>
                        <div className="flex items-start gap-3">
                          <div className={`mt-0.5 ${
                            warning.level === 'high' ? 'text-red-600' :
                            warning.level === 'medium' ? 'text-yellow-600' :
                            'text-blue-600'
                          }`}>
                            {warning.level === 'high' ? <XCircle className="w-5 h-5" /> :
                             warning.level === 'medium' ? <AlertTriangle className="w-5 h-5" /> :
                             <CheckCircle className="w-5 h-5" />}
                          </div>
                          <div className="flex-1">
                            <h3 className={`font-semibold mb-1 ${
                              warning.level === 'high' ? 'text-red-800' :
                              warning.level === 'medium' ? 'text-yellow-800' :
                              'text-blue-800'
                            }`}>
                              {warning.title}
                            </h3>
                            <p className={`text-sm mb-2 ${
                              warning.level === 'high' ? 'text-red-700' :
                              warning.level === 'medium' ? 'text-yellow-700' :
                              'text-blue-700'
                            }`}>
                              {warning.description}
                            </p>
                            <p className={`text-xs font-medium ${
                              warning.level === 'high' ? 'text-red-600' :
                              warning.level === 'medium' ? 'text-yellow-600' :
                              'text-blue-600'
                            }`}>
                              💡 {warning.recommendation}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* Google Maps Location Visualization */}
              {ipData.location.coordinates && (
                <div className="mb-8 card overflow-hidden">
                  <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Navigation className="w-5 h-5 text-contrast-high" />
                        <h3 className="text-lg font-semibold text-contrast-high">Geographic Location</h3>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>{formattedAddress || `${ipData.location.city || 'Unknown'}, ${ipData.location.country || 'Unknown'}`}</span>
                      </div>
                    </div>
                  </div>
                  {mapsAvailable && mapsApiKey ? (
                    <div 
                      id="google-map" 
                      className="w-full h-[400px]"
                      style={{ minHeight: '400px' }}
                    />
                  ) : (
                    <div className="w-full h-[400px] flex items-center justify-center text-center p-6">
                      <div>
                        <p className="text-contrast-medium mb-2">Map preview is unavailable.</p>
                        <p className="text-caption">Missing or invalid Google Maps API key. You can still open the location below.</p>
                      </div>
                    </div>
                  )}
                  <div className="p-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-600 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    <span>
                      Location is approximate based on IP address geolocation. 
                      Actual location may vary by several kilometers.
                    </span>
                  </div>
                  {/* Quick actions and summary cards */}
                  <div className="p-4 bg-white border-t border-gray-200">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div className="flex flex-wrap gap-3">
                        <a
                          href={openInGoogleMapsUrl(ipData.location.coordinates.lat, ipData.location.coordinates.lng)}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-primary"
                        >
                          Open in Google Maps
                        </a>
                        <a
                          href={getDirectionsUrl(ipData.location.coordinates.lat, ipData.location.coordinates.lng)}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-secondary"
                        >
                          Get Directions
                        </a>
                        <button
                          onClick={() => shareLocation(
                            ipData.location.coordinates!.lat,
                            ipData.location.coordinates!.lng,
                            formattedAddress || getFallbackAddress() || undefined,
                            ipData.ip
                          )}
                          className="btn-primary"
                        >
                          Share Location
                        </button>
                        <button
                          onClick={() => {
                            const addr = formattedAddress || getFallbackAddress();
                            if (addr) copyToClipboard(addr, 'address');
                          }}
                          className="btn-secondary"
                        >
                          Copy Address
                        </button>
                        <button
                          onClick={() => setShowQuickInfo(v => !v)}
                          className="btn-secondary"
                        >
                          {showQuickInfo ? 'Hide Info' : 'Show Info'}
                        </button>
                      </div>
                    </div>

                    {showQuickInfo && (
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="rounded-lg bg-neutral-900 text-white p-4">
                          <div className="text-sm opacity-80 mb-1">Coordinates</div>
                          <div className="font-semibold text-lg">
                            {ipData.location.coordinates.lat.toFixed(6)}, {ipData.location.coordinates.lng.toFixed(6)}
                          </div>
                        </div>
                        <div className="rounded-lg bg-neutral-900 text-white p-4">
                          <div className="text-sm opacity-80 mb-1">Location</div>
                          <div className="font-semibold text-lg">
                            {formattedAddress || getFallbackAddress() || 'Unknown'}
                          </div>
                        </div>
                        <div className="rounded-lg bg-neutral-900 text-white p-4">
                          <div className="text-sm opacity-80 mb-1">Network</div>
                          <div className="font-semibold text-lg">
                            {ipData.network.organization || ipData.network.isp || 'Unknown'}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Information Cards Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Location Information */}
                <InfoCard title="Location Information" icon={<MapPin className="w-5 h-5 text-contrast-high" />}>
                  <div className="space-y-0">
                    <InfoRow label="Address" value={formattedAddress || getFallbackAddress() || undefined} copyable />
                    <InfoRow label="City" value={ipData.location.city} />
                    <InfoRow label="Region" value={ipData.location.region} />
                    <InfoRow label="Country" value={ipData.location.country} />
                    <InfoRow label="Postal Code" value={ipData.location.postal} />
                    <InfoRow label="Timezone" value={ipData.location.timezone} />
                    {ipData.location.coordinates && (
                      <InfoRow 
                        label="Coordinates" 
                        value={`${ipData.location.coordinates.lat}, ${ipData.location.coordinates.lng}`}
                        copyable 
                      />
                    )}
                  </div>
                </InfoCard>

                {/* Network Information */}
                <InfoCard title="Network Information" icon={<Server className="w-5 h-5 text-contrast-high" />}>
                  <div className="space-y-0">
                    <InfoRow label="ISP" value={ipData.network.isp} copyable />
                    <InfoRow label="Organization" value={ipData.network.organization} />
                    <InfoRow label="ASN" value={ipData.network.asn} copyable />
                    <InfoRow label="ASN Name" value={ipData.network.asnName} />
                    <InfoRow label="Domain" value={ipData.network.domain} copyable />
                    <InfoRow label="Type" value={ipData.network.type} />
                  </div>
                </InfoCard>

                {/* Security Information */}
                <InfoCard title="Security Analysis" icon={<Shield className="w-5 h-5 text-contrast-high" />}>
                  <div className="space-y-3">
                    <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border ${getThreatColor(ipData.security.threat)}`}>
                      {getThreatIcon(ipData.security.threat)}
                      <span className="font-medium">Threat Level: {ipData.security.threat.toUpperCase()}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${ipData.security.isVPN ? 'bg-red-500' : 'bg-green-500'}`}></div>
                        <span className="text-sm">VPN: {ipData.security.isVPN ? 'Yes' : 'No'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${ipData.security.isProxy ? 'bg-red-500' : 'bg-green-500'}`}></div>
                        <span className="text-sm">Proxy: {ipData.security.isProxy ? 'Yes' : 'No'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${ipData.security.isTor ? 'bg-red-500' : 'bg-green-500'}`}></div>
                        <span className="text-sm">Tor: {ipData.security.isTor ? 'Yes' : 'No'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${ipData.security.isHosting ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                        <span className="text-sm">Hosting: {ipData.security.isHosting ? 'Yes' : 'No'}</span>
                      </div>
                    </div>
                    
                    {ipData.security.service && (
                      <InfoRow label="Service" value={ipData.security.service} />
                    )}
                  </div>
                </InfoCard>

                {/* Metadata Information */}
                <InfoCard title="Additional Information" icon={<Clock className="w-5 h-5 text-contrast-high" />}>
                  <div className="space-y-0">
                    <InfoRow label="Hostname" value={ipData.metadata.hostname} copyable />
                    <InfoRow label="Data Source" value={ipData.metadata.source} />
                    <InfoRow 
                      label="Last Updated" 
                      value={new Date(ipData.metadata.lastUpdated).toLocaleString()} 
                    />
                    {ipData.metadata.userAgent && (
                      <div className="py-2">
                        <span className="text-sm font-medium text-gray-600 block mb-1">User Agent</span>
                        <span className="text-xs text-gray-900 bg-gray-50 p-2 rounded block break-all">
                          {ipData.metadata.userAgent}
                        </span>
                      </div>
                    )}
                  </div>
                </InfoCard>
              </div>

              {/* Abuse Contact (if available) */}
              {ipData.abuse && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
                  <h3 className="text-lg font-semibold text-yellow-800 mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Abuse Contact Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-yellow-700">Contact:</span>
                      <p className="text-yellow-900">{ipData.abuse.contact}</p>
                    </div>
                    <div>
                      <span className="font-medium text-yellow-700">Network:</span>
                      <p className="text-yellow-900">{ipData.abuse.network}</p>
                    </div>
                    <div>
                      <span className="font-medium text-yellow-700">Name:</span>
                      <p className="text-yellow-900">{ipData.abuse.name}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Raw Data Toggle */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <button
                  onClick={() => setShowRawData(!showRawData)}
                  className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
                >
                  <Eye className="w-5 h-5" />
                  <span className="font-medium">
                    {showRawData ? 'Hide' : 'Show'} Raw API Data
                  </span>
                </button>
                
                {showRawData && rawData && (
                  <div className="mt-4">
                    <div className="bg-gray-900 rounded-lg p-4 overflow-auto">
                      <pre className="text-green-400 text-sm">
                        {JSON.stringify(rawData, null, 2)}
                      </pre>
                    </div>
                    <button
                      onClick={() => copyToClipboard(JSON.stringify(rawData, null, 2), 'rawData')}
                      className="mt-2 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors flex items-center gap-2"
                    >
                      {copiedField === 'rawData' ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                      Copy Raw Data
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Doctor Network Chat Widget */}
      <DoctorNetworkChat 
        ipContext={ipData ? {
          ip: ipData.ip,
          location: ipData.location,
          network: ipData.network,
          security: ipData.security
        } : undefined}
      />
    </div>
    </>
  );
}