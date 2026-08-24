export type DataSourceKind = "csv" | "excel" | "sql_database" | "rest_api" | "json" | "analytics_system" | "data_warehouse";

export type DataSchemaField = { name: string; type: string; nullable: boolean; description?: string };
export type DataQueryRequest = { query: string; parameters?: Record<string, unknown>; limit?: number };
export type DataQueryResult = { columns: DataSchemaField[]; rows: Array<Record<string, unknown>>; rowCount: number; metadata?: Record<string, unknown> };

/** Connector boundary: implementations can read/probe a source but never receive implicit production-write authority. */
export interface DataConnector {
  readonly kind: DataSourceKind;
  inspectSchema(): Promise<DataSchemaField[]>;
  query(request: DataQueryRequest): Promise<DataQueryResult>;
}

export function createReadOnlyConnectorPolicy(kind: DataSourceKind) {
  return { kind, canRead: true, canQuery: true, canAnalyze: true, canWrite: false, requiresApprovalForWrite: true } as const;
}
