/**
 * ADVANCED SECURITY TOOLS — Vulnerability scanning, policy enforcement, threat modeling, incident response
 * DB models: SecurityScan, SecurityPolicy, ThreatModel, IncidentRecord
 */

import prisma from '../lib/prisma.js';

export const ADVANCED_SECURITY_TOOL_DEFINITIONS = [
  {
    name: 'scan_vulnerabilities',
    description: 'Scan code, dependencies, or infrastructure for security vulnerabilities.',
    input_schema: {
      type: 'object',
      properties: {
        operation: { type: 'string', enum: ['scan', 'list', 'get', 'rescan'], description: 'Operation' },
        scanId:    { type: 'string', description: 'Scan ID' },
        target:    { type: 'string', description: 'What to scan (e.g., "dependencies", "code", "config")' },
        code:      { type: 'string', description: 'Code snippet to scan' },
        deps:      { type: 'object', description: 'Dependencies object (package.json format)' },
      },
      required: ['operation'],
    },
  },
  {
    name: 'policy_enforce',
    description: 'Create and enforce security policies — access control, data handling, compliance rules.',
    input_schema: {
      type: 'object',
      properties: {
        operation: { type: 'string', enum: ['create', 'check', 'list', 'update', 'delete'], description: 'Operation' },
        policyId:  { type: 'string', description: 'Policy ID' },
        name:      { type: 'string', description: 'Policy name' },
        type:      { type: 'string', enum: ['access_control', 'data_handling', 'compliance', 'network', 'encryption'], description: 'Policy type' },
        rules:     { type: 'array', description: 'Policy rules [{ condition, action, severity }]', items: { type: 'object' } },
        context:   { type: 'object', description: 'Context to check against policy' },
      },
      required: ['operation'],
    },
  },
  {
    name: 'threat_model',
    description: 'Create and analyze threat models — STRIDE, attack trees, risk assessment.',
    input_schema: {
      type: 'object',
      properties: {
        operation:   { type: 'string', enum: ['create', 'analyze', 'list', 'get', 'delete'], description: 'Operation' },
        modelId:     { type: 'string', description: 'Threat model ID' },
        name:        { type: 'string', description: 'System/component name' },
        description: { type: 'string', description: 'System description' },
        components:  { type: 'array', description: 'System components [{ name, type, dataFlows }]', items: { type: 'object' } },
        framework:   { type: 'string', enum: ['stride', 'dread', 'pasta', 'attack_tree'], description: 'Threat modeling framework' },
      },
      required: ['operation'],
    },
  },
  {
    name: 'incident_response',
    description: 'Create and manage security incident records — triage, escalation, resolution tracking.',
    input_schema: {
      type: 'object',
      properties: {
        operation:   { type: 'string', enum: ['create', 'update', 'escalate', 'resolve', 'list', 'get'], description: 'Operation' },
        incidentId:  { type: 'string', description: 'Incident ID' },
        title:       { type: 'string', description: 'Incident title' },
        severity:    { type: 'string', enum: ['low', 'medium', 'high', 'critical'], description: 'Severity level' },
        description: { type: 'string', description: 'Incident description' },
        category:    { type: 'string', enum: ['data_breach', 'unauthorized_access', 'malware', 'ddos', 'phishing', 'other'], description: 'Incident category' },
        resolution:  { type: 'string', description: 'Resolution notes' },
      },
      required: ['operation'],
    },
  },
];

export async function executeAdvancedSecurityTool(toolName, input, ctx = {}) {
  const userId = ctx.userId || 'anonymous';
  try {
    switch (toolName) {

      case 'scan_vulnerabilities': {
        switch (input.operation) {
          case 'scan': {
            const findings = [];
            const target = input.target || 'code';

            if (target === 'code' && input.code) {
              const code = input.code;
              // Static analysis patterns
              const patterns = [
                { pattern: /eval\s*\(/g, name: 'Unsafe eval()', severity: 'high', cwe: 'CWE-95' },
                { pattern: /innerHTML\s*=/g, name: 'innerHTML assignment (XSS risk)', severity: 'medium', cwe: 'CWE-79' },
                { pattern: /document\.write/g, name: 'document.write (XSS risk)', severity: 'medium', cwe: 'CWE-79' },
                { pattern: /exec\s*\(/g, name: 'Command injection risk', severity: 'high', cwe: 'CWE-78' },
                { pattern: /password\s*=\s*['"][^'"]+['"]/gi, name: 'Hardcoded password', severity: 'critical', cwe: 'CWE-798' },
                { pattern: /api[_-]?key\s*=\s*['"][^'"]+['"]/gi, name: 'Hardcoded API key', severity: 'critical', cwe: 'CWE-798' },
                { pattern: /SELECT\s+.*\+/gi, name: 'Potential SQL injection', severity: 'high', cwe: 'CWE-89' },
                { pattern: /Math\.random\(\)/g, name: 'Weak random (use crypto.randomBytes)', severity: 'low', cwe: 'CWE-330' },
                { pattern: /http:\/\//g, name: 'Insecure HTTP URL', severity: 'low', cwe: 'CWE-319' },
              ];
              patterns.forEach(p => {
                const matches = code.match(p.pattern);
                if (matches) findings.push({ name: p.name, severity: p.severity, cwe: p.cwe, count: matches.length });
              });
            }

            if (target === 'dependencies' && input.deps) {
              const deps = { ...input.deps.dependencies, ...input.deps.devDependencies };
              // Check for known vulnerable version patterns
              Object.entries(deps).forEach(([pkg, ver]) => {
                if (typeof ver === 'string' && ver === '*') findings.push({ name: `Wildcard version for ${pkg}`, severity: 'medium', recommendation: 'Pin to specific version' });
              });
            }

            const scan = await prisma.securityScan.create({
              data: { userId, target, findingsCount: findings.length, findings, severity: findings.some(f => f.severity === 'critical') ? 'critical' : findings.some(f => f.severity === 'high') ? 'high' : findings.length > 0 ? 'medium' : 'clean' },
            });
            return { result: JSON.stringify({ status: 'success', scanId: scan.id, target, findingsCount: findings.length, overallSeverity: scan.severity, findings }) };
          }
          case 'list': {
            const scans = await prisma.securityScan.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 20 });
            return { result: JSON.stringify({ status: 'success', count: scans.length, scans: scans.map(s => ({ id: s.id, target: s.target, findings: s.findingsCount, severity: s.severity, date: s.createdAt })) }) };
          }
          case 'get': {
            const scan = await prisma.securityScan.findFirst({ where: { id: input.scanId, userId } });
            if (!scan) return { result: JSON.stringify({ status: 'error', error: 'Scan not found' }) };
            return { result: JSON.stringify({ status: 'success', scan }) };
          }
          default:
            return { result: JSON.stringify({ status: 'error', error: 'Unknown operation' }) };
        }
      }

      case 'policy_enforce': {
        switch (input.operation) {
          case 'create': {
            const policy = await prisma.securityPolicy.create({
              data: { userId, name: input.name || 'Security Policy', type: input.type || 'access_control', rules: input.rules || [], status: 'active' },
            });
            return { result: JSON.stringify({ status: 'success', policyId: policy.id, name: policy.name, type: policy.type }) };
          }
          case 'check': {
            const policies = await prisma.securityPolicy.findMany({ where: { userId, status: 'active' } });
            const violations = [];
            const context = input.context || {};

            policies.forEach(policy => {
              (policy.rules || []).forEach(rule => {
                // Simple rule evaluation
                if (rule.condition && context[rule.condition]) {
                  violations.push({ policy: policy.name, rule: rule.condition, action: rule.action || 'block', severity: rule.severity || 'medium' });
                }
              });
            });

            return { result: JSON.stringify({ status: 'success', policiesChecked: policies.length, violations: violations.length, passed: violations.length === 0, details: violations }) };
          }
          case 'list': {
            const policies = await prisma.securityPolicy.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 20 });
            return { result: JSON.stringify({ status: 'success', count: policies.length, policies: policies.map(p => ({ id: p.id, name: p.name, type: p.type, status: p.status, ruleCount: (p.rules || []).length })) }) };
          }
          case 'delete': {
            await prisma.securityPolicy.deleteMany({ where: { id: input.policyId, userId } });
            return { result: JSON.stringify({ status: 'success', deleted: input.policyId }) };
          }
          default:
            return { result: JSON.stringify({ status: 'error', error: 'Unknown operation' }) };
        }
      }

      case 'threat_model': {
        switch (input.operation) {
          case 'create': {
            const model = await prisma.threatModel.create({
              data: { userId, name: input.name || 'System', description: input.description || null, components: input.components || [], framework: input.framework || 'stride' },
            });
            return { result: JSON.stringify({ status: 'success', modelId: model.id, name: model.name, framework: model.framework }) };
          }
          case 'analyze': {
            const model = await prisma.threatModel.findFirst({ where: { id: input.modelId, userId } });
            if (!model) return { result: JSON.stringify({ status: 'error', error: 'Model not found' }) };

            const components = model.components || [];
            const threats = [];

            // STRIDE analysis
            if (model.framework === 'stride') {
              const strideCategories = [
                { category: 'Spoofing', description: 'Can an attacker impersonate a user or component?' },
                { category: 'Tampering', description: 'Can data be modified in transit or at rest?' },
                { category: 'Repudiation', description: 'Can actions be denied without proof?' },
                { category: 'Information Disclosure', description: 'Can sensitive data be exposed?' },
                { category: 'Denial of Service', description: 'Can the system be made unavailable?' },
                { category: 'Elevation of Privilege', description: 'Can an attacker gain higher access?' },
              ];
              components.forEach(comp => {
                strideCategories.forEach(s => {
                  threats.push({ component: comp.name, category: s.category, description: `${s.description} (${comp.name})`, likelihood: 'medium', impact: 'high' });
                });
              });
            }

            await prisma.threatModel.update({ where: { id: model.id }, data: { threats, analyzedAt: new Date() } });
            return { result: JSON.stringify({ status: 'success', modelId: model.id, framework: model.framework, componentCount: components.length, threatCount: threats.length, threats: threats.slice(0, 10) }) };
          }
          case 'list': {
            const models = await prisma.threatModel.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 20 });
            return { result: JSON.stringify({ status: 'success', count: models.length, models: models.map(m => ({ id: m.id, name: m.name, framework: m.framework, components: (m.components || []).length })) }) };
          }
          case 'get': {
            const model = await prisma.threatModel.findFirst({ where: { id: input.modelId, userId } });
            if (!model) return { result: JSON.stringify({ status: 'error', error: 'Model not found' }) };
            return { result: JSON.stringify({ status: 'success', model }) };
          }
          default:
            return { result: JSON.stringify({ status: 'error', error: 'Unknown operation' }) };
        }
      }

      case 'incident_response': {
        switch (input.operation) {
          case 'create': {
            const incident = await prisma.incidentRecord.create({
              data: { userId, title: input.title || 'Security Incident', severity: input.severity || 'medium', description: input.description || null, category: input.category || 'other', status: 'open' },
            });
            return { result: JSON.stringify({ status: 'success', incidentId: incident.id, title: incident.title, severity: incident.severity, incidentStatus: 'open' }) };
          }
          case 'update': {
            const updateData = {};
            if (input.severity) updateData.severity = input.severity;
            if (input.description) updateData.description = input.description;
            if (input.category) updateData.category = input.category;
            await prisma.incidentRecord.update({ where: { id: input.incidentId }, data: updateData });
            return { result: JSON.stringify({ status: 'success', incidentId: input.incidentId, updated: Object.keys(updateData) }) };
          }
          case 'escalate': {
            await prisma.incidentRecord.update({ where: { id: input.incidentId }, data: { severity: 'critical', status: 'escalated', escalatedAt: new Date() } });
            return { result: JSON.stringify({ status: 'success', incidentId: input.incidentId, severity: 'critical', incidentStatus: 'escalated' }) };
          }
          case 'resolve': {
            await prisma.incidentRecord.update({ where: { id: input.incidentId }, data: { status: 'resolved', resolution: input.resolution || null, resolvedAt: new Date() } });
            return { result: JSON.stringify({ status: 'success', incidentId: input.incidentId, incidentStatus: 'resolved' }) };
          }
          case 'list': {
            const incidents = await prisma.incidentRecord.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 30 });
            return { result: JSON.stringify({ status: 'success', count: incidents.length, incidents: incidents.map(i => ({ id: i.id, title: i.title, severity: i.severity, status: i.status, category: i.category })) }) };
          }
          case 'get': {
            const incident = await prisma.incidentRecord.findFirst({ where: { id: input.incidentId, userId } });
            if (!incident) return { result: JSON.stringify({ status: 'error', error: 'Incident not found' }) };
            return { result: JSON.stringify({ status: 'success', incident }) };
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

export const isAdvancedSecurityTool = (name) => ADVANCED_SECURITY_TOOL_DEFINITIONS.some(t => t.name === name);
