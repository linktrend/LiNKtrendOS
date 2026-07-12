/**
 * LiNKbrain Memory Object persistence — implements memory object schemas
 * per `.ai-swarm/CONTRACTS_MVO.md` and `LINKBRAIN_COMPLETION_PLAN.md` §2.2.
 *
 * This module provides:
 * - Zod schemas for memory object types: LeadMemory, ResearchBundle, EpisodeSummary
 * - Writer functions to persist memory objects with provenance tracking
 * - Query helpers for context assembly
 */

import type { Env } from "@linktrend/shared-config";
import { createSupabaseServiceClient } from "@linktrend/db";
import { z } from "zod";

import type { FailureReport } from "./contracts-mvo.js";

/* -------------------------------------------------------------------------- */
/* Memory Object State and Type Enums                                         */
/* -------------------------------------------------------------------------- */

export const MemoryObjectStateSchema = z.enum([
  "active",
  "archived",
  "superseded",
  "expired",
  "pending_validation",
]);
export type MemoryObjectState = z.infer<typeof MemoryObjectStateSchema>;

export const MemoryObjectTypeSchema = z.enum([
  "lead_memory",
  "research_bundle",
  "episode_summary",
  "capability_lease_record",
  "workflow_run_record",
  // LEXOS Litigation memory object types (lexos-litigation.md §Memory Object Promotion)
  "lexos_client",
  "lexos_matter",
  "lexos_case_story",
  "lexos_assertion_bundle",
  "lexos_strategy",
  "lexos_research",
  "lexos_argument",
  "lexos_output",
]);
export type MemoryObjectType = z.infer<typeof MemoryObjectTypeSchema>;

/* -------------------------------------------------------------------------- */
/* LeadMemory — Summarized lead state across runs                             */
/* -------------------------------------------------------------------------- */

export const LeadMemoryFactsSchema = z.object({
  business_name: z.string().min(1),
  industry: z.string().min(1),
  industry_taxonomy_id: z.string().optional(),
  location: z.object({
    city: z.string().optional(),
    region: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
  key_attributes: z.record(z.string(), z.unknown()).optional(),
});
export type LeadMemoryFacts = z.infer<typeof LeadMemoryFactsSchema>;

export const LeadMemoryEngagementSchema = z.object({
  first_seen_at: z.string().datetime(),
  last_engaged_at: z.string().datetime(),
  total_runs: z.number().int().min(0),
  total_episodes: z.number().int().min(0),
  current_status: z.enum([
    "new",
    "researching",
    "generating",
    "preview_ready",
    "ready_to_contact",
    "contacted",
    "dormant",
  ]),
});
export type LeadMemoryEngagement = z.infer<typeof LeadMemoryEngagementSchema>;

export const LeadMemoryPayloadSchema = z.object({
  lead_id: z.string().min(1),
  tenant_id: z.string().min(1),
  facts: LeadMemoryFactsSchema,
  engagement: LeadMemoryEngagementSchema,
  // References to related memory objects
  related_research_bundle_ids: z.array(z.string().uuid()).default([]),
  related_episode_ids: z.array(z.string().uuid()).default([]),
  // Summary fields for quick context assembly
  summary_text: z.string().max(2000).optional(),
  // Provenance tracking
  source_run_id: z.string().uuid().optional(),
  source_plugin_id: z.string().optional(),
});
export type LeadMemoryPayload = z.infer<typeof LeadMemoryPayloadSchema>;

/* -------------------------------------------------------------------------- */
/* ResearchBundle — Provenance-backed research findings                       */
/* -------------------------------------------------------------------------- */

export const ResearchCitationSchema = z.object({
  citation_id: z.string().min(1),
  source_type: z.enum([
    "web_search",
    "web_page",
    "knowledge_base",
    "internal_document",
    "operator_input",
    "inferred",
  ]),
  source_url: z.string().url().optional(),
  source_title: z.string().optional(),
  accessed_at: z.string().datetime(),
  relevant_quote: z.string().max(2000).optional(),
  // Confidence in this specific citation
  citation_confidence: z.number().min(0).max(1).default(1.0),
});
export type ResearchCitation = z.infer<typeof ResearchCitationSchema>;

export const ComparableBusinessSchema = z.object({
  business_name: z.string().min(1),
  industry: z.string().optional(),
  location: z.string().optional(),
  website_url: z.string().url().optional(),
  key_differentiators: z.array(z.string()).default([]),
  // How similar this comparable is to the target (0-1)
  similarity_score: z.number().min(0).max(1).optional(),
});
export type ComparableBusiness = z.infer<typeof ComparableBusinessSchema>;

export const ResearchBundlePayloadSchema = z.object({
  research_bundle_id: z.string().min(1),
  tenant_id: z.string().min(1),
  lead_id: z.string().min(1),
  // The research context
  research_query: z.string().min(1),
  research_scope: z.enum([
    "business_profile",
    "industry_analysis",
    "competitive_landscape",
    "comprehensive",
  ]),
  // Core findings
  findings_summary: z.string().max(5000),
  key_facts: z.array(z.object({
    fact_type: z.string(),
    fact_value: z.string(),
    confidence: z.number().min(0).max(1),
    source_citation_ids: z.array(z.string()),
  })).default([]),
  // Comparable businesses
  comparable_businesses: z.array(ComparableBusinessSchema).default([]),
  // Full provenance
  citations: z.array(ResearchCitationSchema).min(1),
  // Embeddings reference (for vector search)
  embedding_id: z.string().optional(),
  // Research metadata
  research_duration_ms: z.number().int().min(0).optional(),
  model_run_id: z.string().optional(),
  // Source tracking
  source_run_id: z.string().uuid(),
  source_plugin_id: z.string().optional(),
  source_role_id: z.string().optional(),
});
export type ResearchBundlePayload = z.infer<typeof ResearchBundlePayloadSchema>;

/* -------------------------------------------------------------------------- */
/* EpisodeSummary — A completed run/stage as a memorable episode              */
/* -------------------------------------------------------------------------- */

export const EpisodeStageSummarySchema = z.object({
  stage_id: z.string().min(1),
  stage_name: z.string().min(1),
  status: z.enum(["succeeded", "failed", "skipped", "awaiting_approval"]),
  plane: z.enum(["linkaios", "linkbot", "linkskills", "linkautowork", "linkbrain"]),
  started_at: z.string().datetime().optional(),
  ended_at: z.string().datetime().optional(),
  // Key outputs from this stage
  output_refs: z.record(z.string(), z.unknown()).optional(),
  // Error if stage failed
  failure_summary: z.string().optional(),
});
export type EpisodeStageSummary = z.infer<typeof EpisodeStageSummarySchema>;

export const EpisodeSummaryPayloadSchema = z.object({
  episode_id: z.string().min(1),
  tenant_id: z.string().min(1),
  run_id: z.string().uuid(),
  work_request_type: z.string().min(1),
  plugin_id: z.string().min(1),
  // Episode classification
  episode_type: z.enum([
    "full_run",
    "stage_sequence",
    "capability_execution",
    "workflow_execution",
    "research_cycle",
    "generation_cycle",
  ]),
  // Outcome
  outcome: z.enum(["success", "partial", "failure", "cancelled"]),
  // Temporal bounds
  started_at: z.string().datetime(),
  completed_at: z.string().datetime(),
  duration_ms: z.number().int().min(0),
  // Stage summaries
  stages: z.array(EpisodeStageSummarySchema),
  // Key entities involved
  lead_id: z.string().optional(),
  site_id: z.string().optional(),
  // Key refs produced
  output_refs: z.object({
    lease_ids: z.array(z.string()).default([]),
    workflow_run_ids: z.array(z.string()).default([]),
    audit_event_ids: z.array(z.string()).default([]),
    preview_url: z.string().optional(),
    crm_record_id: z.string().optional(),
    project_id: z.string().optional(),
    task_id: z.string().optional(),
  }),
  // Human-readable episode summary (for LiNKbot context)
  narrative_summary: z.string().max(3000).optional(),
  // For retrieval and clustering
  keywords: z.array(z.string()).default([]),
  // Feedback loop
  operator_feedback: z.object({
    rating: z.number().min(1).max(5).optional(),
    notes: z.string().optional(),
  }).optional(),
});
export type EpisodeSummaryPayload = z.infer<typeof EpisodeSummaryPayloadSchema>;

/* -------------------------------------------------------------------------- */
/* LEXOS Litigation — Memory Object Payloads                                    */
/* (lexos-litigation.md §Memory Object Promotion)                               */
/* -------------------------------------------------------------------------- */

export const LexosClientPayloadSchema = z.object({
  client_id: z.string().min(1),
  tenant_id: z.string().min(1),
  intake_id: z.string().min(1),
  accepted_by: z.string().min(1),
  conflict_status: z.string().min(1),
  kyc_status: z.string().optional(),
  risk_level: z.string().optional(),
  matter_ids: z.array(z.string()).default([]),
  source_run_id: z.string().uuid().optional(),
});
export type LexosClientPayload = z.infer<typeof LexosClientPayloadSchema>;

export const LexosMatterPayloadSchema = z.object({
  matter_id: z.string().min(1),
  tenant_id: z.string().min(1),
  client_id: z.string().min(1),
  matter_type: z.string().min(1),
  jurisdiction: z.string().optional(),
  current_stage: z.string().optional(),
  source_run_id: z.string().uuid().optional(),
});
export type LexosMatterPayload = z.infer<typeof LexosMatterPayloadSchema>;

export const LexosCaseStoryPayloadSchema = z.object({
  case_story_id: z.string().min(1),
  tenant_id: z.string().min(1),
  matter_id: z.string().min(1),
  story_length: z.number().int().min(0).optional(),
  assertions_count: z.number().int().min(0).optional(),
  timeline_events_count: z.number().int().min(0).optional(),
  gaps_count: z.number().int().min(0).optional(),
  content_ref: z.string().optional(),
  source_run_id: z.string().uuid().optional(),
});
export type LexosCaseStoryPayload = z.infer<typeof LexosCaseStoryPayloadSchema>;

export const LexosAssertionBundlePayloadSchema = z.object({
  case_story_id: z.string().min(1),
  tenant_id: z.string().min(1),
  matter_id: z.string().min(1),
  assertions_created: z.number().int().min(0),
  by_truth_state: z.record(z.string(), z.number()).optional(),
  source_run_id: z.string().uuid().optional(),
});
export type LexosAssertionBundlePayload = z.infer<typeof LexosAssertionBundlePayloadSchema>;

export const LexosStrategyPayloadSchema = z.object({
  strategy_memo_id: z.string().min(1),
  tenant_id: z.string().min(1),
  matter_id: z.string().min(1),
  strategy_points_count: z.number().int().min(0).optional(),
  risks_count: z.number().int().min(0).optional(),
  research_questions_count: z.number().int().min(0).optional(),
  content_ref: z.string().optional(),
  source_run_id: z.string().uuid().optional(),
});
export type LexosStrategyPayload = z.infer<typeof LexosStrategyPayloadSchema>;

export const LexosResearchPayloadSchema = z.object({
  research_memo_id: z.string().min(1),
  tenant_id: z.string().min(1),
  matter_id: z.string().min(1),
  authorities_found: z.number().int().min(0).optional(),
  citations_checked: z.number().int().min(0).optional(),
  verification_rate: z.number().min(0).max(1).optional(),
  content_ref: z.string().optional(),
  source_run_id: z.string().uuid().optional(),
});
export type LexosResearchPayload = z.infer<typeof LexosResearchPayloadSchema>;

export const LexosArgumentPayloadSchema = z.object({
  argument_draft_id: z.string().min(1),
  tenant_id: z.string().min(1),
  matter_id: z.string().min(1),
  argument_type: z.string().optional(),
  supported_claims: z.number().int().min(0).optional(),
  unsupported_claims: z.number().int().min(0).optional(),
  citations_count: z.number().int().min(0).optional(),
  content_ref: z.string().optional(),
  source_run_id: z.string().uuid().optional(),
});
export type LexosArgumentPayload = z.infer<typeof LexosArgumentPayloadSchema>;

export const LexosOutputPayloadSchema = z.object({
  output_artifact_id: z.string().min(1),
  tenant_id: z.string().min(1),
  matter_id: z.string().min(1),
  file_format: z.string().optional(),
  caveats_preserved: z.number().int().min(0).optional(),
  missing_caveats: z.number().int().min(0).optional(),
  bundle_contents: z.array(z.string()).default([]),
  artifact_uri: z.string().optional(),
  source_run_id: z.string().uuid().optional(),
});
export type LexosOutputPayload = z.infer<typeof LexosOutputPayloadSchema>;

/* -------------------------------------------------------------------------- */
/* Memory Object Envelope (matches database schema)                             */
/* -------------------------------------------------------------------------- */

export const MemoryObjectScopeSchema = z.object({
  // Scope lattice: (tenant_id, plugin_id, role_id) defines visibility
  plugin_id: z.string().optional(),
  role_id: z.string().optional(),
  // Additional scope dimensions
  project_id: z.string().optional(),
  site_id: z.string().optional(),
  matter_id: z.string().optional(),
  // Tags for cross-cutting retrieval
  tags: z.array(z.string()).default([]),
});
export type MemoryObjectScope = z.infer<typeof MemoryObjectScopeSchema>;

export const MemoryObjectEnvelopeSchema = z.object({
  id: z.string().uuid().optional(), // assigned on write
  tenant_id: z.string().min(1),
  type: MemoryObjectTypeSchema,
  scope: MemoryObjectScopeSchema,
  provenance_event_ids: z.array(z.string().uuid()),
  payload: z.union([
    LeadMemoryPayloadSchema,
    ResearchBundlePayloadSchema,
    EpisodeSummaryPayloadSchema,
    LexosClientPayloadSchema,
    LexosMatterPayloadSchema,
    LexosCaseStoryPayloadSchema,
    LexosAssertionBundlePayloadSchema,
    LexosStrategyPayloadSchema,
    LexosResearchPayloadSchema,
    LexosArgumentPayloadSchema,
    LexosOutputPayloadSchema,
  ]),
  state: MemoryObjectStateSchema.default("active"),
  confidence: z.number().min(0).max(1).default(1.0),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
  source_plane: z.enum(["linkaios", "linkbot", "linkskills", "linkautowork", "linkbrain"]),
  run_id: z.string().uuid().optional(),
  plugin_id: z.string().optional(),
  role_id: z.string().optional(),
});
export type MemoryObjectEnvelope = z.infer<typeof MemoryObjectEnvelopeSchema>;

/* -------------------------------------------------------------------------- */
/* Write Result Types                                                           */
/* -------------------------------------------------------------------------- */

export interface MemoryWriteResult {
  id: string;
  created_at: string;
  failure?: FailureReport;
}

export interface MemoryQueryResult {
  memories: MemoryObjectEnvelope[];
  failure?: FailureReport;
}

/* -------------------------------------------------------------------------- */
/* Memory Object Writer                                                         */
/* -------------------------------------------------------------------------- */

export interface WriteMemoryObjectOptions {
  tenant_id: string;
  type: MemoryObjectType;
  scope: MemoryObjectScope;
  provenance_event_ids: string[];
  payload:
    | LeadMemoryPayload
    | ResearchBundlePayload
    | EpisodeSummaryPayload
    | LexosClientPayload
    | LexosMatterPayload
    | LexosCaseStoryPayload
    | LexosAssertionBundlePayload
    | LexosStrategyPayload
    | LexosResearchPayload
    | LexosArgumentPayload
    | LexosOutputPayload;
  state?: MemoryObjectState;
  confidence?: number;
  source_plane: "linkaios" | "linkbot" | "linkskills" | "linkautowork" | "linkbrain";
  run_id?: string;
  plugin_id?: string;
  role_id?: string;
}

/**
 * Write a memory object to LiNKbrain with full provenance tracking.
 * Validates payload against type-specific schemas and PII guards.
 */
export async function writeMemoryObject(
  env: Env,
  options: WriteMemoryObjectOptions,
): Promise<MemoryWriteResult> {
  // Validate payload based on type
  const payloadValidation = validateMemoryPayload(options.type, options.payload);
  if (payloadValidation) {
    return {
      id: "",
      created_at: new Date().toISOString(),
      failure: makeFailure("linkbrain", payloadValidation.code, payloadValidation.message),
    };
  }

  const client = createSupabaseServiceClient(env);

  const { data, error } = await client
    .schema("linkbrain")
    .rpc("write_memory_object", {
      p_tenant_id: options.tenant_id,
      p_type: options.type,
      p_scope_jsonb: options.scope,
      p_provenance_event_ids: options.provenance_event_ids,
      p_payload_jsonb: options.payload,
      p_state: options.state ?? "active",
      p_confidence: options.confidence ?? 1.0,
      p_source_plane: options.source_plane,
      p_run_id: options.run_id,
      p_plugin_id: options.plugin_id,
      p_role_id: options.role_id,
    });

  if (error) {
    const code = extractErrorCode(error.message);
    return {
      id: "",
      created_at: new Date().toISOString(),
      failure: makeFailure("linkbrain", code, error.message, { pg_code: error.code }),
    };
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row || typeof row !== "object" || !("id" in row) || !("created_at" in row)) {
    return {
      id: "",
      created_at: new Date().toISOString(),
      failure: makeFailure("linkbrain", "MEMORY_WRITE_FAILED", "memory write returned no row"),
    };
  }

  return {
    id: String((row as { id: unknown }).id),
    created_at: String((row as { created_at: unknown }).created_at),
  };
}

/* -------------------------------------------------------------------------- */
/* Query Helpers                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Get memory objects associated with a specific run.
 */
export async function getMemoriesByRun(
  env: Env,
  run_id: string,
  type?: MemoryObjectType,
): Promise<MemoryQueryResult> {
  const client = createSupabaseServiceClient(env);

  const { data, error } = await client
    .schema("linkbrain")
    .rpc("get_memories_by_run", {
      p_run_id: run_id,
      p_type: type,
    });

  if (error) {
    return {
      memories: [],
      failure: makeFailure("linkbrain", "MEMORY_QUERY_FAILED", error.message, { pg_code: error.code }),
    };
  }

  if (!Array.isArray(data)) {
    return {
      memories: [],
      failure: makeFailure("linkbrain", "MEMORY_QUERY_FAILED", "query returned non-array result"),
    };
  }

  // Transform database rows to MemoryObjectEnvelope
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const memories: MemoryObjectEnvelope[] = (data as any[]).map((row) => ({
    id: String(row.id),
    tenant_id: String(row.tenant_id),
    type: String(row.type) as MemoryObjectType,
    scope: { tags: [] }, // scope_jsonb is stored but we return minimal for now
    provenance_event_ids: [], // provenance_event_ids stored but not returned in this query
    payload: row.payload_jsonb as LeadMemoryPayload | ResearchBundlePayload | EpisodeSummaryPayload,
    state: String(row.state) as MemoryObjectState,
    confidence: Number(row.confidence),
    created_at: String(row.created_at),
    updated_at: undefined,
    source_plane: "linkbrain" as const,
  }));

  return { memories };
}

/**
 * Query memories by lead_id (requires payload inspection, uses generic query).
 * Note: This queries the table directly; optimize with GIN index on payload in production.
 */
export async function getMemoriesByLead(
  env: Env,
  tenant_id: string,
  lead_id: string,
  type?: MemoryObjectType,
): Promise<MemoryQueryResult> {
  const client = createSupabaseServiceClient(env);

  let query = client
    .schema("linkbrain")
    .from("memory_objects")
    .select("*")
    .eq("tenant_id", tenant_id)
    .eq("state", "active");

  if (type) {
    query = query.eq("type", type);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) {
    return {
      memories: [],
      failure: makeFailure("linkbrain", "MEMORY_QUERY_FAILED", error.message, { pg_code: error.code }),
    };
  }

  if (!data) {
    return { memories: [] };
  }

  // Filter by lead_id in payload (client-side until we have a dedicated index)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filtered = (data as any[]).filter((row) => {
    const payload = row.payload_jsonb as Record<string, unknown>;
    return payload?.lead_id === lead_id;
  });

  const memories: MemoryObjectEnvelope[] = filtered.map((row) => ({
    id: row.id as string,
    tenant_id: row.tenant_id as string,
    type: row.type as MemoryObjectType,
    scope: row.scope_jsonb as MemoryObjectScope,
    provenance_event_ids: row.provenance_event_ids as string[],
    payload: row.payload_jsonb as LeadMemoryPayload | ResearchBundlePayload | EpisodeSummaryPayload,
    state: row.state as MemoryObjectState,
    confidence: Number(row.confidence),
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    source_plane: row.source_plane as "linkaios" | "linkbot" | "linkskills" | "linkautowork" | "linkbrain",
    run_id: row.run_id as string | undefined,
    plugin_id: row.plugin_id as string | undefined,
    role_id: row.role_id as string | undefined,
  }));

  return { memories };
}

/* -------------------------------------------------------------------------- */
/* Update Helpers                                                               */
/* -------------------------------------------------------------------------- */

export interface UpdateMemoryStateOptions {
  id: string;
  tenant_id: string;
  new_state: MemoryObjectState;
  new_confidence?: number;
}

/**
 * Update the state of a memory object (e.g., active -> superseded).
 */
export async function updateMemoryObjectState(
  env: Env,
  options: UpdateMemoryStateOptions,
): Promise<{ updated_at: string; failure?: FailureReport }> {
  const client = createSupabaseServiceClient(env);

  const { data, error } = await client
    .schema("linkbrain")
    .rpc("update_memory_object_state", {
      p_id: options.id,
      p_tenant_id: options.tenant_id,
      p_new_state: options.new_state,
      p_new_confidence: options.new_confidence,
    });

  if (error) {
    return {
      updated_at: new Date().toISOString(),
      failure: makeFailure("linkbrain", "MEMORY_UPDATE_FAILED", error.message, { pg_code: error.code }),
    };
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row || typeof row !== "object" || !("updated_at" in row)) {
    return {
      updated_at: new Date().toISOString(),
      failure: makeFailure("linkbrain", "MEMORY_UPDATE_FAILED", "state update returned no row"),
    };
  }

  return { updated_at: String((row as { updated_at: unknown }).updated_at) };
}

/* -------------------------------------------------------------------------- */
/* Validation Helpers                                                           */
/* -------------------------------------------------------------------------- */

interface ValidationError {
  code: string;
  message: string;
}

function validateMemoryPayload(
  type: MemoryObjectType,
  payload: unknown,
): ValidationError | null {
  switch (type) {
    case "lead_memory": {
      const result = LeadMemoryPayloadSchema.safeParse(payload);
      if (!result.success) {
        return {
          code: "MEMORY_PAYLOAD_INVALID",
          message: `LeadMemory payload invalid: ${result.error.issues[0]?.message ?? "unknown error"}`,
        };
      }
      return null;
    }
    case "research_bundle": {
      const result = ResearchBundlePayloadSchema.safeParse(payload);
      if (!result.success) {
        return {
          code: "MEMORY_PAYLOAD_INVALID",
          message: `ResearchBundle payload invalid: ${result.error.issues[0]?.message ?? "unknown error"}`,
        };
      }
      return null;
    }
    case "episode_summary": {
      const result = EpisodeSummaryPayloadSchema.safeParse(payload);
      if (!result.success) {
        return {
          code: "MEMORY_PAYLOAD_INVALID",
          message: `EpisodeSummary payload invalid: ${result.error.issues[0]?.message ?? "unknown error"}`,
        };
      }
      return null;
    }
    case "capability_lease_record":
    case "workflow_run_record":
      return null;
    case "lexos_client": {
      const result = LexosClientPayloadSchema.safeParse(payload);
      if (!result.success) {
        return {
          code: "MEMORY_PAYLOAD_INVALID",
          message: `LexosClient payload invalid: ${result.error.issues[0]?.message ?? "unknown error"}`,
        };
      }
      return null;
    }
    case "lexos_matter": {
      const result = LexosMatterPayloadSchema.safeParse(payload);
      if (!result.success) {
        return {
          code: "MEMORY_PAYLOAD_INVALID",
          message: `LexosMatter payload invalid: ${result.error.issues[0]?.message ?? "unknown error"}`,
        };
      }
      return null;
    }
    case "lexos_case_story": {
      const result = LexosCaseStoryPayloadSchema.safeParse(payload);
      if (!result.success) {
        return {
          code: "MEMORY_PAYLOAD_INVALID",
          message: `LexosCaseStory payload invalid: ${result.error.issues[0]?.message ?? "unknown error"}`,
        };
      }
      return null;
    }
    case "lexos_assertion_bundle": {
      const result = LexosAssertionBundlePayloadSchema.safeParse(payload);
      if (!result.success) {
        return {
          code: "MEMORY_PAYLOAD_INVALID",
          message: `LexosAssertionBundle payload invalid: ${result.error.issues[0]?.message ?? "unknown error"}`,
        };
      }
      return null;
    }
    case "lexos_strategy": {
      const result = LexosStrategyPayloadSchema.safeParse(payload);
      if (!result.success) {
        return {
          code: "MEMORY_PAYLOAD_INVALID",
          message: `LexosStrategy payload invalid: ${result.error.issues[0]?.message ?? "unknown error"}`,
        };
      }
      return null;
    }
    case "lexos_research": {
      const result = LexosResearchPayloadSchema.safeParse(payload);
      if (!result.success) {
        return {
          code: "MEMORY_PAYLOAD_INVALID",
          message: `LexosResearch payload invalid: ${result.error.issues[0]?.message ?? "unknown error"}`,
        };
      }
      return null;
    }
    case "lexos_argument": {
      const result = LexosArgumentPayloadSchema.safeParse(payload);
      if (!result.success) {
        return {
          code: "MEMORY_PAYLOAD_INVALID",
          message: `LexosArgument payload invalid: ${result.error.issues[0]?.message ?? "unknown error"}`,
        };
      }
      return null;
    }
    case "lexos_output": {
      const result = LexosOutputPayloadSchema.safeParse(payload);
      if (!result.success) {
        return {
          code: "MEMORY_PAYLOAD_INVALID",
          message: `LexosOutput payload invalid: ${result.error.issues[0]?.message ?? "unknown error"}`,
        };
      }
      return null;
    }
  }
}

function extractErrorCode(message: string): string {
  if (message.includes("MEMORY_OBJECT_PII_FORBIDDEN")) return "MEMORY_PAYLOAD_PII_FORBIDDEN";
  if (message.includes("MEMORY_OBJECT_INVALID")) return "MEMORY_PAYLOAD_INVALID";
  if (message.includes("MEMORY_OBJECT_NOT_FOUND")) return "MEMORY_NOT_FOUND";
  return "MEMORY_WRITE_FAILED";
}

function makeFailure(
  plane: "linkbrain" | "linkaios" | "linkbot" | "linkskills" | "linkautowork",
  code: string,
  message: string,
  details?: Record<string, unknown>,
): FailureReport {
  return {
    code,
    plane,
    message,
    retryable: false,
    occurred_at: new Date().toISOString(),
    ...(details ? { details } : {}),
  };
}

/* -------------------------------------------------------------------------- */
/* Convenience Builders                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Build a LeadMemory payload with sensible defaults.
 */
export function buildLeadMemoryPayload(
  lead_id: string,
  tenant_id: string,
  facts: LeadMemoryFacts,
  source_run_id?: string,
): LeadMemoryPayload {
  const now = new Date().toISOString();
  return {
    lead_id,
    tenant_id,
    facts,
    engagement: {
      first_seen_at: now,
      last_engaged_at: now,
      total_runs: 1,
      total_episodes: 1,
      current_status: "new",
    },
    related_research_bundle_ids: [],
    related_episode_ids: [],
    source_run_id,
  };
}

/**
 * Build a ResearchBundle payload with sensible defaults.
 */
export function buildResearchBundlePayload(
  tenant_id: string,
  lead_id: string,
  research_query: string,
  findings_summary: string,
  citations: ResearchCitation[],
  run_id: string,
  options?: {
    research_scope?: "business_profile" | "industry_analysis" | "competitive_landscape" | "comprehensive";
    comparable_businesses?: ComparableBusiness[];
    key_facts?: LeadMemoryFacts;
  },
): ResearchBundlePayload {
  return {
    research_bundle_id: `rb_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    tenant_id,
    lead_id,
    research_query,
    research_scope: options?.research_scope ?? "comprehensive",
    findings_summary,
    key_facts: [],
    comparable_businesses: options?.comparable_businesses ?? [],
    citations,
    source_run_id: run_id,
  };
}

/**
 * Build an EpisodeSummary payload with sensible defaults.
 */
export function buildEpisodeSummaryPayload(
  tenant_id: string,
  run_id: string,
  work_request_type: string,
  plugin_id: string,
  stages: EpisodeStageSummary[],
  outcome: "success" | "partial" | "failure" | "cancelled",
  started_at: string,
  completed_at: string,
  options?: {
    lead_id?: string;
    site_id?: string;
    output_refs?: {
      lease_ids?: string[];
      workflow_run_ids?: string[];
      audit_event_ids?: string[];
      preview_url?: string;
    };
    narrative_summary?: string;
  },
): EpisodeSummaryPayload {
  const duration_ms = new Date(completed_at).getTime() - new Date(started_at).getTime();

  return {
    episode_id: `ep_${run_id}`,
    tenant_id,
    run_id,
    work_request_type,
    plugin_id,
    episode_type: "full_run",
    outcome,
    started_at,
    completed_at,
    duration_ms: Math.max(0, duration_ms),
    stages,
    lead_id: options?.lead_id,
    site_id: options?.site_id,
    output_refs: {
      lease_ids: options?.output_refs?.lease_ids ?? [],
      workflow_run_ids: options?.output_refs?.workflow_run_ids ?? [],
      audit_event_ids: options?.output_refs?.audit_event_ids ?? [],
      preview_url: options?.output_refs?.preview_url,
    },
    narrative_summary: options?.narrative_summary,
    keywords: [],
  };
}
