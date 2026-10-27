import { z } from 'zod'
import {
  entitySchema,
  sourceSchema,
  recordSchema,
  graphSchema,
  profileSchema,
  scenarioSchema,
} from '@accessops/domain'
// This inventory describes supported operations. Detailed domain schemas are in @accessops/domain.
const operations: Record<string, string[]> = {
  '/auth/login': ['post'],
  '/auth/logout': ['post'],
  '/auth/me': ['get'],
  '/health': ['get'],
  '/ready': ['get'],
  '/v1/buildings': ['get', 'post'],
  '/v1/buildings/{id}': ['get'],
  '/v1/buildings/{id}/levels': ['get', 'post'],
  '/v1/buildings/{id}/entities': ['get'],
  '/v1/entities': ['post'],
  '/v1/sources/{id}/snapshots': ['get'],
  '/v1/sources/{id}/snapshots/{snapshotId}': ['get'],
  '/v1/sources/{id}/import-jobs': ['post'],
  '/v1/buildings/{id}/plans': ['get', 'post'],
  '/v1/buildings/{id}/grants': ['post'],
  '/v1/projects/{id}/grants': ['post'],
  '/v1/sources': ['get', 'post'],
  '/v1/sources/{id}/preview': ['post'],
  '/v1/sources/{id}/import': ['post'],
  '/v1/sources/{id}/refresh': ['post'],
  '/v1/sources/{id}/runs': ['get'],
  '/v1/sources/{id}/runs/{runId}/rejected.csv': ['get'],
  '/v1/measurements': ['get', 'post'],
  '/v1/events': ['get', 'post'],
  '/v1/sources/{id}/test': ['post'],
  '/v1/observations': ['get'],
  '/v1/observations/{id}/verify': ['post'],
  '/v1/evidence/{id}': ['get'],
  '/v1/buildings/{id}/matches': ['get'],
  '/v1/matches/{id}/confirm': ['post'],
  '/v1/conflicts/resolve': ['post'],
  '/v1/buildings/{id}/reconciliation': ['get'],
  '/v1/graphs': ['post'],
  '/v1/graphs/validate': ['post'],
  '/v1/buildings/{id}/graph': ['get'],
  '/v1/investigations': ['get', 'post'],
  '/v1/investigations/{id}': ['get'],
  '/v1/investigations/{id}/findings': ['get'],
  '/v1/investigations/{id}/evidence/{evidenceId}': ['get'],
  '/v1/investigations/{id}/report': ['get'],
  '/v1/findings/{id}': ['get'],
  '/v1/actions': ['get', 'post'],
  '/v1/actions/{id}': ['patch'],
  '/v1/scenarios': ['post'],
  '/v1/scenarios/{id}': ['get'],
  '/v1/jobs/{id}': ['get'],
  '/v1/jobs/{id}/retry': ['post'],
  '/v1/jobs/{id}/cancel': ['post'],
  '/v1/zetaris/register': ['post'],
  '/v1/users/{id}': ['patch'],
  '/v1/users': ['get', 'post'],
  '/v1/metrics': ['get'],
  '/v1/audit-events': ['get'],
  '/v1/providers': ['get'],
  '/v1/zetaris/query': ['post'],
  '/projects': ['post'],
  '/projects/{id}': ['get'],
  '/projects/{id}/plan': ['get'],
  '/projects/{id}/model': ['get', 'post'],
  '/projects/{id}/model/review': ['post'],
  '/projects/{id}/model/operations': ['post'],
  '/projects/{id}/model/versions': ['get'],
  '/projects/{id}/model/edit': ['post'],
  '/projects/{id}/model/svg': ['get'],
  '/projects/{id}/parse': ['post'],
  '/projects/{id}/tactile': ['get', 'post'],
  '/projects/{id}/export': ['post'],
  '/projects/{id}/export/{file}': ['get'],
}
const contracts = {
  Entity: entitySchema.omit({ id: true }),
  Source: sourceSchema,
  SourceRecord: recordSchema,
  Graph: graphSchema,
  Profile: profileSchema,
  Scenario: scenarioSchema,
}
const requestRefs: Record<string, string> = {
  '/v1/entities': 'Entity',
  '/v1/sources': 'Source',
  '/v1/graphs': 'Graph',
  '/v1/graphs/validate': 'Graph',
}
export const openApiDocument = {
  openapi: '3.1.0',
  info: {
    title: 'AccessOps API',
    version: '1.0.0',
    description:
      'Cookie-authenticated, tenant-scoped operations. Mutations require x-accessops-request: 1. Investigation and refresh enqueue require Idempotency-Key. Import commits require previewHash. Travel profiles are technical checks, not certification.',
  },
  components: {
    schemas: {
      ...Object.fromEntries(
        Object.entries(contracts).map(([name, schema]) => [
          name,
          z.toJSONSchema(schema),
        ]),
      ),
      Error: {
        type: 'object',
        properties: {
          code: { type: 'string' },
          error: { type: 'string' },
          requestId: { type: 'string' },
        },
      },
    },
    securitySchemes: {
      session: { type: 'apiKey', in: 'cookie', name: 'ao_session' },
    },
  },
  security: [{ session: [] }],
  paths: Object.fromEntries(
    Object.entries(operations).map(([path, verbs]) => [
      path,
      Object.fromEntries(
        verbs.map((method) => [
          method,
          {
            operationId: method + '_' + path.replace(/[^a-zA-Z0-9]/g, '_'),
            ...(['post', 'patch'].includes(method) && requestRefs[path]
              ? {
                  requestBody: {
                    required: true,
                    content: {
                      'application/json': {
                        schema: {
                          $ref: '#/components/schemas/' + requestRefs[path],
                        },
                      },
                    },
                  },
                }
              : {}),
            ...(['/health', '/ready', '/auth/login'].includes(path)
              ? { security: [] }
              : {}),
            parameters: [
              ...Array.from(path.matchAll(/\{(\w+)\}/g), (m) => ({
                in: 'path',
                name: m[1],
                required: true,
                schema: { type: 'string' },
              })),
              ...(['post', 'patch'].includes(method)
                ? [
                    {
                      in: 'header',
                      name: 'x-accessops-request',
                      required: true,
                      schema: { type: 'string', const: '1' },
                    },
                  ]
                : []),
            ],
            responses: {
              '200': { description: 'Successful operation' },
              '201': { description: 'Created' },
              '202': { description: 'Queued durable job' },
              '401': { description: 'Authentication required' },
              '403': { description: 'Permission/origin denied' },
              '404': { description: 'Not found in workspace' },
              '409': { description: 'Version, state or idempotency conflict' },
              '422': { description: 'Validation failure' },
              '503': { description: 'External dependency unavailable' },
            },
          },
        ]),
      ),
    ]),
  ),
}
