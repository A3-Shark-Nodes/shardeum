import { addSchema } from '../../utils/serialization/SchemaHelpers'
export const schemaEthGetBlockByHashReq = {
  type: 'object',
  properties: {
    query: {
      type: 'object',
      properties: {
        blockHash: { type: 'string' },
      },
      required: ['blockHash'],
    },
  },
  required: ['query'],
}

export function initEthGetBlockByHashReq(): void {
  addSchemaDependencies()
  addSchemas()
}
// Function to add schema dependencies
function addSchemaDependencies(): void {
  // No dependencies
}

// Function to register the schema
function addSchemas(): void {
  addSchema('EthGetBlockByHashReq', schemaEthGetBlockByHashReq)
}
