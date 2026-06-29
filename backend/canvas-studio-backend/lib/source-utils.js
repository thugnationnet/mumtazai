/**
 * SOURCE UTILS — Shared helpers for canvas-studio / canvas-build product separation.
 *
 * Both products share the same backend API but operate on isolated data.
 * Every request should carry a `source` identifier so queries only
 * return data belonging to the requesting product.
 *
 * Valid sources: 'canvas-studio' | 'canvas-build'
 * Legacy alias:  'canvas-app' → normalized to 'canvas-studio'
 */

const VALID_SOURCES = ['canvas-studio', 'canvas-build'];
const LEGACY_ALIASES = { 'canvas-app': 'canvas-studio' };

/**
 * Extract the product source from a request.
 * Checks (in priority order):
 *   1. req.query.source
 *   2. req.body.source
 *   3. req.headers['x-canvas-source']
 *
 * Returns null if no source is provided (backwards compat / admin use).
 */
export function getSource(req) {
  const raw =
    req.query?.source ||
    req.body?.source ||
    req.headers?.['x-canvas-source'] ||
    null;

  if (!raw) return null;
  const normalized = String(raw).toLowerCase().trim();
  const resolved = LEGACY_ALIASES[normalized] || normalized;
  return VALID_SOURCES.includes(resolved) ? resolved : null;
}

/**
 * Require a valid source — returns 400 if missing/invalid.
 * Use as Express middleware: router.post('/...', requireSource, ...)
 */
export function requireSource(req, res, next) {
  const source = getSource(req);
  if (!source) {
    return res.status(400).json({
      success: false,
      error: 'Missing or invalid source. Provide ?source=canvas-studio or ?source=canvas-build',
    });
  }
  req.source = source;
  next();
}

/**
 * Optional source — attaches req.source (may be null).
 */
export function optionalSource(req, _res, next) {
  req.source = getSource(req);
  next();
}

/**
 * Build a Prisma `where` filter scoped by source.
 * If source is null, returns empty object (no filter — shows all).
 */
export function sourceFilter(source) {
  return source ? { source } : {};
}

/**
 * Validate that a loaded record belongs to the expected source.
 * Returns true if:
 *   - source is null (no filtering requested — admin/internal use)
 *   - record.source matches the requested source
 * Returns false if:
 *   - record.source is null (legacy record) and a source filter IS set
 *   - record.source doesn't match the requested source
 *
 * Legacy NULL-source records are NOT shown to either product.
 * Run: UPDATE canvas_projects SET source = 'canvas-studio' WHERE source IS NULL;
 * to assign legacy records to their proper product.
 */
export function matchesSource(record, source) {
  if (!source) return true;            // no filter requested (admin/internal)
  if (!record?.source) return false;   // legacy NULL record — hidden from both products
  return record.source === source;
}

export { VALID_SOURCES };
