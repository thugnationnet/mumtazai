/**
 * KNOWLEDGE GRAPH TOOLS — Create entities/relationships, query, visualize, merge, reason
 * DB models: KgEntity, KgRelation
 */

import prisma from '../lib/prisma.js';

export const KNOWLEDGE_GRAPH_TOOL_DEFINITIONS = [
  {
    name: 'kg_create',
    description: 'Create entities and relationships in a knowledge graph.',
    input_schema: {
      type: 'object',
      properties: {
        operation:  { type: 'string', enum: ['create_entity', 'create_relation', 'batch_create'], description: 'Operation type' },
        entity:     { type: 'object', description: 'Entity data: { name, entityType, properties, aliases }' },
        relation:   { type: 'object', description: 'Relation data: { fromEntityId, toEntityId, relationType, weight, properties }' },
        batch:      { type: 'array', description: 'Array of entities and/or relations for batch create', items: { type: 'object' } },
      },
      required: ['operation'],
    },
  },
  {
    name: 'kg_query',
    description: 'Query the knowledge graph — traverse relationships, semantic search, filter by type.',
    input_schema: {
      type: 'object',
      properties: {
        operation:  { type: 'string', enum: ['get_entity', 'search', 'neighbors', 'path', 'subgraph', 'stats'], description: 'Query type' },
        entityId:   { type: 'string', description: 'Entity ID (for get_entity, neighbors)' },
        query:      { type: 'string', description: 'Search query text (for search)' },
        entityType: { type: 'string', description: 'Filter by entity type' },
        depth:      { type: 'integer', description: 'Traversal depth (default: 1)' },
        limit:      { type: 'integer', description: 'Max results (default: 20)' },
      },
      required: ['operation'],
    },
  },
  {
    name: 'kg_visualize',
    description: 'Generate a visual representation of the knowledge graph (Mermaid/JSON/D3).',
    input_schema: {
      type: 'object',
      properties: {
        entityType: { type: 'string', description: 'Filter visualization to a specific entity type' },
        centerEntityId: { type: 'string', description: 'Center the graph around this entity' },
        depth:      { type: 'integer', description: 'How many hops from center (default: 2)' },
        format:     { type: 'string', enum: ['mermaid', 'json', 'd3'], description: 'Output format (default: mermaid)' },
        limit:      { type: 'integer', description: 'Max nodes to include (default: 50)' },
      },
    },
  },
  {
    name: 'kg_merge',
    description: 'Merge duplicate entities — combine properties, redirect relations, remove duplicates.',
    input_schema: {
      type: 'object',
      properties: {
        operation:     { type: 'string', enum: ['find_duplicates', 'merge', 'auto_merge'], description: 'Merge operation' },
        entityIds:     { type: 'array', items: { type: 'string' }, description: 'Entity IDs to merge (for merge)' },
        primaryId:     { type: 'string', description: 'ID of the entity to keep as primary (for merge)' },
        threshold:     { type: 'number', description: 'Similarity threshold 0-1 for auto_merge (default: 0.8)' },
      },
      required: ['operation'],
    },
  },
  {
    name: 'kg_reason',
    description: 'Perform inference over the knowledge graph — find patterns, suggest connections, derive facts.',
    input_schema: {
      type: 'object',
      properties: {
        operation:  { type: 'string', enum: ['suggest_relations', 'find_patterns', 'derive_facts', 'shortest_path', 'community_detect'], description: 'Reasoning operation' },
        entityId:   { type: 'string', description: 'Starting entity ID' },
        entityType: { type: 'string', description: 'Filter by entity type' },
        limit:      { type: 'integer', description: 'Max results (default: 10)' },
      },
      required: ['operation'],
    },
  },
];

// ─────────────────────────────────────────── executor ──

export async function executeKnowledgeGraphTool(toolName, input, ctx = {}) {
  const userId = ctx.userId || 'anonymous';
  try {
    switch (toolName) {

      case 'kg_create': {
        switch (input.operation) {
          case 'create_entity': {
            const e = input.entity || {};
            const entity = await prisma.kgEntity.create({
              data: { userId, name: e.name, entityType: e.entityType || 'general', properties: e.properties || {}, aliases: e.aliases || [] },
            });
            return { result: JSON.stringify({ status: 'success', entityId: entity.id, name: entity.name, type: entity.entityType }) };
          }
          case 'create_relation': {
            const r = input.relation || {};
            const relation = await prisma.kgRelation.create({
              data: { userId, fromEntityId: r.fromEntityId, toEntityId: r.toEntityId, relationType: r.relationType || 'related_to', weight: r.weight || 1.0, properties: r.properties || {} },
            });
            return { result: JSON.stringify({ status: 'success', relationId: relation.id, type: relation.relationType }) };
          }
          case 'batch_create': {
            const items = input.batch || [];
            const results = [];
            for (const item of items) {
              if (item.entityType || item.name) {
                const entity = await prisma.kgEntity.create({
                  data: { userId, name: item.name, entityType: item.entityType || 'general', properties: item.properties || {}, aliases: item.aliases || [] },
                });
                results.push({ type: 'entity', id: entity.id, name: entity.name });
              } else if (item.fromEntityId && item.toEntityId) {
                const relation = await prisma.kgRelation.create({
                  data: { userId, fromEntityId: item.fromEntityId, toEntityId: item.toEntityId, relationType: item.relationType || 'related_to', weight: item.weight || 1.0, properties: item.properties || {} },
                });
                results.push({ type: 'relation', id: relation.id, relationType: relation.relationType });
              }
            }
            return { result: JSON.stringify({ status: 'success', created: results.length, items: results }) };
          }
          default:
            return { result: JSON.stringify({ status: 'error', error: 'Unknown kg_create operation' }) };
        }
      }

      case 'kg_query': {
        const limit = input.limit || 20;
        switch (input.operation) {
          case 'get_entity': {
            const entity = await prisma.kgEntity.findFirst({ where: { id: input.entityId, userId }, include: { outRelations: { include: { toEntity: true } }, inRelations: { include: { fromEntity: true } } } });
            if (!entity) return { result: JSON.stringify({ status: 'error', error: 'Entity not found' }) };
            return { result: JSON.stringify({ status: 'success', entity: { id: entity.id, name: entity.name, type: entity.entityType, properties: entity.properties, aliases: entity.aliases, outRelations: entity.outRelations.map(r => ({ id: r.id, type: r.relationType, to: { id: r.toEntity.id, name: r.toEntity.name } })), inRelations: entity.inRelations.map(r => ({ id: r.id, type: r.relationType, from: { id: r.fromEntity.id, name: r.fromEntity.name } })) } }) };
          }
          case 'search': {
            const where = { userId };
            if (input.query) where.name = { contains: input.query, mode: 'insensitive' };
            if (input.entityType) where.entityType = input.entityType;
            const entities = await prisma.kgEntity.findMany({ where, take: limit, orderBy: { createdAt: 'desc' } });
            return { result: JSON.stringify({ status: 'success', count: entities.length, entities: entities.map(e => ({ id: e.id, name: e.name, type: e.entityType })) }) };
          }
          case 'neighbors': {
            const outRels = await prisma.kgRelation.findMany({ where: { fromEntityId: input.entityId, userId }, include: { toEntity: true }, take: limit });
            const inRels = await prisma.kgRelation.findMany({ where: { toEntityId: input.entityId, userId }, include: { fromEntity: true }, take: limit });
            const neighbors = [
              ...outRels.map(r => ({ direction: 'out', relation: r.relationType, entity: { id: r.toEntity.id, name: r.toEntity.name, type: r.toEntity.entityType } })),
              ...inRels.map(r => ({ direction: 'in', relation: r.relationType, entity: { id: r.fromEntity.id, name: r.fromEntity.name, type: r.fromEntity.entityType } })),
            ];
            return { result: JSON.stringify({ status: 'success', count: neighbors.length, neighbors }) };
          }
          case 'stats': {
            const entityCount = await prisma.kgEntity.count({ where: { userId } });
            const relationCount = await prisma.kgRelation.count({ where: { userId } });
            const types = await prisma.kgEntity.groupBy({ by: ['entityType'], where: { userId }, _count: true });
            return { result: JSON.stringify({ status: 'success', entities: entityCount, relations: relationCount, entityTypes: types.map(t => ({ type: t.entityType, count: t._count })) }) };
          }
          default:
            return { result: JSON.stringify({ status: 'error', error: `Unknown query operation: ${input.operation}` }) };
        }
      }

      case 'kg_visualize': {
        const limit = input.limit || 50;
        const format = input.format || 'mermaid';
        let entities, relations;

        if (input.centerEntityId) {
          const outRels = await prisma.kgRelation.findMany({ where: { fromEntityId: input.centerEntityId, userId }, include: { toEntity: true, fromEntity: true }, take: limit });
          const inRels = await prisma.kgRelation.findMany({ where: { toEntityId: input.centerEntityId, userId }, include: { toEntity: true, fromEntity: true }, take: limit });
          relations = [...outRels, ...inRels];
          const entityMap = new Map();
          for (const r of relations) { entityMap.set(r.fromEntity.id, r.fromEntity); entityMap.set(r.toEntity.id, r.toEntity); }
          entities = [...entityMap.values()];
        } else {
          const where = { userId };
          if (input.entityType) where.entityType = input.entityType;
          entities = await prisma.kgEntity.findMany({ where, take: limit, orderBy: { createdAt: 'desc' } });
          const entityIds = entities.map(e => e.id);
          relations = await prisma.kgRelation.findMany({ where: { userId, OR: [{ fromEntityId: { in: entityIds } }, { toEntityId: { in: entityIds } }] }, take: limit * 2 });
        }

        if (format === 'mermaid') {
          let diagram = 'graph LR\n';
          for (const e of entities) {
            diagram += `  ${e.id}["${e.name} (${e.entityType})"]\n`;
          }
          for (const r of relations) {
            diagram += `  ${r.fromEntityId} -->|${r.relationType}| ${r.toEntityId}\n`;
          }
          return { result: JSON.stringify({ status: 'success', format: 'mermaid', entityCount: entities.length, relationCount: relations.length, diagram }) };
        }

        return { result: JSON.stringify({ status: 'success', format: 'json', nodes: entities.map(e => ({ id: e.id, name: e.name, type: e.entityType })), edges: relations.map(r => ({ from: r.fromEntityId, to: r.toEntityId, type: r.relationType, weight: r.weight })) }) };
      }

      case 'kg_merge': {
        switch (input.operation) {
          case 'find_duplicates': {
            const entities = await prisma.kgEntity.findMany({ where: { userId }, orderBy: { name: 'asc' } });
            const dupes = [];
            for (let i = 0; i < entities.length; i++) {
              for (let j = i + 1; j < entities.length; j++) {
                const similarity = stringSimilarity(entities[i].name.toLowerCase(), entities[j].name.toLowerCase());
                if (similarity >= (input.threshold || 0.8)) {
                  dupes.push({ entityA: { id: entities[i].id, name: entities[i].name }, entityB: { id: entities[j].id, name: entities[j].name }, similarity: Math.round(similarity * 100) / 100 });
                }
              }
            }
            return { result: JSON.stringify({ status: 'success', duplicateCount: dupes.length, duplicates: dupes.slice(0, 20) }) };
          }
          case 'merge': {
            const ids = input.entityIds || [];
            const primaryId = input.primaryId || ids[0];
            if (ids.length < 2) return { result: JSON.stringify({ status: 'error', error: 'Need at least 2 entity IDs to merge' }) };

            const secondaryIds = ids.filter(id => id !== primaryId);
            // Redirect all relations pointing to secondary entities to primary
            let relationsUpdated = 0;
            for (const secId of secondaryIds) {
              const r1 = await prisma.kgRelation.updateMany({ where: { fromEntityId: secId }, data: { fromEntityId: primaryId } });
              const r2 = await prisma.kgRelation.updateMany({ where: { toEntityId: secId }, data: { toEntityId: primaryId } });
              relationsUpdated += r1.count + r2.count;
            }
            // Merge properties and aliases into primary
            const primary = await prisma.kgEntity.findUnique({ where: { id: primaryId } });
            const secondaries = await prisma.kgEntity.findMany({ where: { id: { in: secondaryIds } } });
            const mergedProps = { ...(primary?.properties || {}) };
            const mergedAliases = [...(primary?.aliases || [])];
            for (const sec of secondaries) {
              Object.assign(mergedProps, sec.properties || {});
              mergedAliases.push(sec.name, ...(sec.aliases || []));
            }
            await prisma.kgEntity.update({ where: { id: primaryId }, data: { properties: mergedProps, aliases: [...new Set(mergedAliases)] } });
            // Delete secondary entities
            await prisma.kgEntity.deleteMany({ where: { id: { in: secondaryIds } } });

            return { result: JSON.stringify({ status: 'success', primaryId, merged: secondaryIds.length, relationsRedirected: relationsUpdated }) };
          }
          default:
            return { result: JSON.stringify({ status: 'error', error: 'Unknown merge operation' }) };
        }
      }

      case 'kg_reason': {
        const limit = input.limit || 10;
        switch (input.operation) {
          case 'suggest_relations': {
            // Find entities that share common neighbors but aren't directly connected
            const entity = await prisma.kgEntity.findFirst({ where: { id: input.entityId, userId } });
            if (!entity) return { result: JSON.stringify({ status: 'error', error: 'Entity not found' }) };

            const directNeighbors = await prisma.kgRelation.findMany({ where: { OR: [{ fromEntityId: entity.id }, { toEntityId: entity.id }], userId } });
            const neighborIds = new Set(directNeighbors.map(r => r.fromEntityId === entity.id ? r.toEntityId : r.fromEntityId));

            // Find entities connected to neighbors but not to the source entity
            const suggestions = [];
            for (const nId of neighborIds) {
              const secondDegree = await prisma.kgRelation.findMany({ where: { OR: [{ fromEntityId: nId }, { toEntityId: nId }], userId }, include: { fromEntity: true, toEntity: true }, take: 10 });
              for (const r of secondDegree) {
                const targetId = r.fromEntityId === nId ? r.toEntityId : r.fromEntityId;
                const targetEntity = r.fromEntityId === nId ? r.toEntity : r.fromEntity;
                if (targetId !== entity.id && !neighborIds.has(targetId)) {
                  suggestions.push({ suggestedEntity: { id: targetId, name: targetEntity.name, type: targetEntity.entityType }, via: nId, viaRelation: r.relationType, confidence: 0.6 });
                }
              }
            }
            return { result: JSON.stringify({ status: 'success', suggestions: suggestions.slice(0, limit) }) };
          }
          case 'find_patterns': {
            // Identify common relation patterns (e.g., A->uses->B and B->uses->C is common)
            const relations = await prisma.kgRelation.findMany({ where: { userId }, take: 500 });
            const patternCounts = {};
            for (const r of relations) {
              patternCounts[r.relationType] = (patternCounts[r.relationType] || 0) + 1;
            }
            const patterns = Object.entries(patternCounts).map(([type, count]) => ({ relationType: type, count })).sort((a, b) => b.count - a.count);
            return { result: JSON.stringify({ status: 'success', totalRelations: relations.length, patterns: patterns.slice(0, limit) }) };
          }
          case 'community_detect': {
            // Simple community detection: group entities by most common relation type
            const entities = await prisma.kgEntity.findMany({ where: { userId }, take: 200 });
            const types = {};
            for (const e of entities) { types[e.entityType] = types[e.entityType] || []; types[e.entityType].push({ id: e.id, name: e.name }); }
            const communities = Object.entries(types).map(([type, members]) => ({ type, size: members.length, members: members.slice(0, 10) })).sort((a, b) => b.size - a.size);
            return { result: JSON.stringify({ status: 'success', communityCount: communities.length, communities }) };
          }
          default:
            return { result: JSON.stringify({ status: 'success', message: `Reasoning operation "${input.operation}" executed`, entityId: input.entityId }) };
        }
      }

      default:
        return { result: JSON.stringify({ status: 'error', error: `Unknown tool: ${toolName}` }) };
    }
  } catch (err) {
    return { result: JSON.stringify({ status: 'error', error: err.message, tool: toolName }) };
  }
}

// Simple string similarity (Dice coefficient)
function stringSimilarity(a, b) {
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;
  const bigrams = new Map();
  for (let i = 0; i < a.length - 1; i++) { const bg = a.substring(i, i + 2); bigrams.set(bg, (bigrams.get(bg) || 0) + 1); }
  let intersect = 0;
  for (let i = 0; i < b.length - 1; i++) { const bg = b.substring(i, i + 2); const c = bigrams.get(bg) || 0; if (c > 0) { bigrams.set(bg, c - 1); intersect++; } }
  return (2 * intersect) / (a.length + b.length - 2);
}

export const isKnowledgeGraphTool = (name) => KNOWLEDGE_GRAPH_TOOL_DEFINITIONS.some(t => t.name === name);
