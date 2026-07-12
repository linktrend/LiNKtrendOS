/**
 * MVO cross-service contract types.
 *
 * Canonical source of truth: `.ai-swarm/CONTRACTS_MVO.md`.
 *
 * Field names below are PINNED. Implementation agents (LiNKaios kernel,
 * LiNKbot, LinkSkills, LiNKautowork, LiNKbrain, WebsiteFactory plugin) MUST
 * import from `@linktrend/linklogic-sdk` rather than redefining parallel
 * names.
 *
 * Section numbers in comments refer to sections of `CONTRACTS_MVO.md`.
 */

import { z } from "zod";

/* -------------------------------------------------------------------------- */
/* §1.2 Plane + failure mode primitives                                       */
/* -------------------------------------------------------------------------- */

export const PlaneSchema = z.enum([
  "linkaios",
  "linkbot",
  "linkskills",
  "linkautowork",
  "linkbrain",
]);
export type Plane = z.infer<typeof PlaneSchema>;

export const FailureModeSchema = z.enum([
  "retryable",
  "abort_run",
  "require_approval",
]);
export type FailureMode = z.infer<typeof FailureModeSchema>;

/* -------------------------------------------------------------------------- */
/* §1.0 Plugin architecture v2 — plugin kind, mode model, role attachments    */
/* -------------------------------------------------------------------------- */

export const PluginKindSchema = z.enum(["vertical", "capability"]);
export type PluginKind = z.infer<typeof PluginKindSchema>;

export const PluginModeSchema = z.enum(["development", "shadow", "live"]);
export type PluginMode = z.infer<typeof PluginModeSchema>;

export const LiNKbotRoleAttachmentSchema = z.object({
  role_id: z.string().min(1),
  purpose: z.string().min(1),
  inputs: z.array(z.string()),
  outputs: z.array(z.string()),
  allowed_capabilities: z.array(z.string()),
  allowed_skills: z.array(z.string()),
  model_policy: z.object({
    model_routing_profile: z.string().min(1),
    tools: z.array(z.string()).optional(),
  }),
  audit_events: z.array(z.string()),
  development_restrictions: z.array(z.string()).optional(),
});
export type LiNKbotRoleAttachment = z.infer<typeof LiNKbotRoleAttachmentSchema>;

export const CapabilityPluginCallerSchema = z.enum([
  "linkaios",
  "vertical_plugin",
  "linkbot",
  "linkautowork",
]);
export type CapabilityPluginCaller = z.infer<typeof CapabilityPluginCallerSchema>;

export const CapabilityPluginSurfaceSchema = z.object({
  capability_id: z.string().min(1),
  target_software: z.string().min(1),
  allowed_operations: z.array(z.string()).min(1),
  auth_requirements: z.array(z.string()),
  mode_flags: z.array(PluginModeSchema).min(1),
  lease_requirements: z.array(z.string()),
  idempotency_rules: z.string().min(1),
  audit_events: z.array(z.string()),
  allowed_callers: z.array(CapabilityPluginCallerSchema).min(1),
  failure_mapping: z.record(z.string(), z.string()),
  not_configured: z.array(z.string()).min(1),
});
export type CapabilityPluginSurface = z.infer<typeof CapabilityPluginSurfaceSchema>;

/* -------------------------------------------------------------------------- */
/* §1.2 PluginManifest                                                        */
/* -------------------------------------------------------------------------- */

export const PluginManifestStageSchema = z.object({
  stage_id: z.string().min(1),
  display_name: z.string().min(1),
  responsible_plane: PlaneSchema,
  inputs: z.array(z.string()),
  outputs: z.array(z.string()),
  failure_mode: FailureModeSchema,
});
export type PluginManifestStage = z.infer<typeof PluginManifestStageSchema>;

// v2-aware manifest. New fields (`plugin_kind`, `modes_supported`,
// `required_linkbot_roles`, `capability`) are OPTIONAL so legacy v1
// manifests still parse; v2 cross-field rules are enforced via .superRefine.
export const PluginManifestSchema = z
  .object({
    plugin_id: z.string().min(1),
    plugin_kind: PluginKindSchema.optional(),
    plugin_name: z.string().min(1),
    version: z.string().min(1),
    purpose: z.string().min(1),

    modes_supported: z.array(PluginModeSchema).min(1).optional(),

    public_surfaces: z.object({
      work_request_types: z.array(z.string()),
      ui_panels: z.array(z.string()),
      read_views: z.array(z.string()),
    }),

    stages: z.array(PluginManifestStageSchema),

    config_surfaces: z.array(z.string()),
    required_capabilities: z.array(z.string()),
    required_workflow_hooks: z.array(z.string()),
    required_audit_events: z.array(z.string()),
    required_linkbot_roles: z.array(LiNKbotRoleAttachmentSchema).optional(),
    preview_output_shape: z.record(z.string(), z.string()),
    non_goals: z.array(z.string()),

    capability: CapabilityPluginSurfaceSchema.optional(),
  })
  .superRefine((m, ctx) => {
    // Legacy v1: when plugin_kind is omitted, treat as vertical.
    const kind = m.plugin_kind ?? "vertical";

    if (kind === "vertical" && m.stages.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["stages"],
        message: "vertical plugins must declare at least one stage",
      });
    }

    if (kind === "capability") {
      if (!m.capability) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["capability"],
          message: "capability plugins must declare a `capability` block",
        });
      }
      if (m.stages.length > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["stages"],
          message: "capability plugins must not declare stages",
        });
      }
      if (m.required_linkbot_roles && m.required_linkbot_roles.length > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["required_linkbot_roles"],
          message: "capability plugins must not declare LiNKbot role attachments",
        });
      }
    }

    // Role attachments must reference declared capabilities + audit events.
    if (m.required_linkbot_roles) {
      const caps = new Set(m.required_capabilities);
      const audits = new Set(m.required_audit_events);
      m.required_linkbot_roles.forEach((role, i) => {
        for (const c of role.allowed_capabilities) {
          if (!caps.has(c)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["required_linkbot_roles", i, "allowed_capabilities"],
              message: `role allows capability "${c}" not in required_capabilities`,
            });
          }
        }
        for (const a of role.audit_events) {
          if (!audits.has(a)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["required_linkbot_roles", i, "audit_events"],
              message: `role emits audit "${a}" not in required_audit_events`,
            });
          }
        }
      });
    }
  });
export type PluginManifest = z.infer<typeof PluginManifestSchema>;

/* -------------------------------------------------------------------------- */
/* §3 Lead intake                                                             */
/* -------------------------------------------------------------------------- */

// RFC5322-lite; full RFC enforcement is enforced server-side. This guards
// against malformed structural input at the SDK boundary.
const EmailSchema = z.string().email();
// E.164: leading +, 1..15 digits, no leading zero on country code.
const E164Schema = z
  .string()
  .regex(/^\+[1-9]\d{1,14}$/, "must be E.164");

const ExternalIdsSchema = z
  .record(z.string().regex(/^[a-z][a-z0-9_]{1,40}$/), z.string())
  .optional();

export const LeadInputSchema = z.object({
  tenant_id: z.string().min(1),
  source: z.enum(["manual", "csv_import", "stub"]),
  business_name: z
    .string()
    .min(1)
    .max(200)
    .transform((v) => v.trim())
    .refine((v) => v.length > 0, "business_name required after trim"),
  industry: z
    .string()
    .min(1)
    .max(120)
    .transform((v) => v.trim())
    .refine((v) => v.length > 0, "industry required after trim"),
  industry_taxonomy_id: z.string().min(1).optional(),
  contact: z
    .object({
      name: z.string().max(200).optional(),
      email: EmailSchema.optional(),
      phone: E164Schema.optional(),
    })
    .optional(),
  location: z
    .object({
      city: z.string().optional(),
      region: z.string().optional(),
      country: z.string().optional(),
    })
    .optional(),
  notes: z.string().max(2000).optional(),
  external_ids: ExternalIdsSchema,
  client_idempotency_key: z.string().min(1).optional(),
});
export type LeadInput = z.infer<typeof LeadInputSchema>;

/* -------------------------------------------------------------------------- */
/* §4 Work / Run lifecycle                                                    */
/* -------------------------------------------------------------------------- */

export const ActorKindSchema = z.enum(["user", "system", "bot"]);
export type ActorKind = z.infer<typeof ActorKindSchema>;

export const WorkRequestSchema = z.object({
  work_request_id: z.string().uuid(),
  tenant_id: z.string().min(1),
  plugin_id: z.string().min(1),
  work_request_type: z.string().min(1),
  payload: z.unknown(),
  requested_by: z.object({
    actor_kind: ActorKindSchema,
    actor_id: z.string().min(1),
  }),
  created_at: z.string().datetime(),
  idempotency_key: z.string().min(1),
});
export type WorkRequest = z.infer<typeof WorkRequestSchema>;

export const RunStatusSchema = z.enum([
  "pending",
  "running",
  "succeeded",
  "partial",
  "failed",
  "awaiting_approval",
  "cancelled",
]);
export type RunStatus = z.infer<typeof RunStatusSchema>;

export const StageStatusSchema = z.enum([
  "pending",
  "dispatched",
  "running",
  "succeeded",
  "failed",
  "awaiting_approval",
  "skipped",
]);
export type StageStatus = z.infer<typeof StageStatusSchema>;

/* -------------------------------------------------------------------------- */
/* §5 Failure taxonomy                                                        */
/* -------------------------------------------------------------------------- */

// Canonical initial set per §5.4. Agents may add codes; never rename.
export const FailureCodeSchema = z.enum([
  "LEAD_INPUT_INVALID",
  "LEAD_INPUT_TOO_LONG",
  "LEAD_TENANT_INACTIVE",
  "LEAD_DUPLICATE_WITHIN_WINDOW",
  "MANIFEST_INVALID",
  "MANIFEST_CAPABILITY_UNKNOWN",
  "MANIFEST_WORKFLOW_UNKNOWN",
  "MANIFEST_AUDIT_EVENT_UNKNOWN",
  "LEASE_REQUEST_INVALID",
  "LEASE_DENIED",
  "LEASE_EXPIRED",
  "LEASE_KILL_SWITCH",
  "LEASE_IDEMPOTENCY_CONFLICT",
  "WORKFLOW_NOT_FOUND",
  "WORKFLOW_TIMEOUT",
  "WORKFLOW_STEP_FAILED",
  "WORKFLOW_COMPENSATED",
  "MODEL_PROVIDER_ERROR",
  "MODEL_TIMEOUT",
  "MODEL_OUTPUT_INVALID",
  "MODEL_QUOTA_EXCEEDED",
  "INTEGRATION_UNAVAILABLE",
  "INTEGRATION_AUTH_FAILED",
  "INTEGRATION_TIMEOUT",
  "POLICY_REQUIRES_APPROVAL",
  "APPROVAL_REJECTED",
  "APPROVAL_TIMEOUT",
  "STAGE_SKIPPED_BY_POLICY",
  "KERNEL_DISPATCH_FAILED",
  "KERNEL_PERSISTENCE_FAILED",
]);
export type FailureCode = z.infer<typeof FailureCodeSchema>;

export const FailureReportSchema = z.object({
  // Accept canonical codes plus any future-added code string (agents MAY add).
  code: z.string().min(1),
  plane: PlaneSchema,
  message: z.string().min(1),
  retryable: z.boolean(),
  approval_required: z.boolean().optional(),
  details: z.record(z.string(), z.unknown()).optional(),
  caused_by: z
    .object({
      ref_kind: z.enum(["lease", "workflow_run", "audit_event", "model_run"]),
      ref_id: z.string().min(1),
    })
    .optional(),
  occurred_at: z.string().datetime(),
});
export type FailureReport = z.infer<typeof FailureReportSchema>;

export const StageSchema = z.object({
  stage_id: z.string().min(1),
  run_id: z.string().uuid(),
  responsible_plane: PlaneSchema,
  status: StageStatusSchema,
  attempt: z.number().int().min(1),
  inputs_snapshot: z.record(z.string(), z.unknown()),
  outputs: z.record(z.string(), z.unknown()).optional(),
  started_at: z.string().datetime().optional(),
  ended_at: z.string().datetime().optional(),
  refs: z.object({
    lease_ids: z.array(z.string()).optional(),
    workflow_run_ids: z.array(z.string()).optional(),
    audit_event_ids: z.array(z.string()).optional(),
    model_run_id: z.string().optional(),
  }),
  failure: FailureReportSchema.optional(),
});
export type Stage = z.infer<typeof StageSchema>;

export const RunSchema = z.object({
  run_id: z.string().uuid(),
  work_request_id: z.string().uuid(),
  tenant_id: z.string().min(1),
  plugin_id: z.string().min(1),
  status: RunStatusSchema,
  started_at: z.string().datetime(),
  ended_at: z.string().datetime().optional(),
  stages: z.array(StageSchema),
  outputs: z.record(z.string(), z.unknown()),
  failure: FailureReportSchema.optional(),
});
export type Run = z.infer<typeof RunSchema>;

/* -------------------------------------------------------------------------- */
/* §6.1 LiNKaios ↔ LiNKbot                                                    */
/* -------------------------------------------------------------------------- */

export const ReasoningKindSchema = z.enum([
  "lead_evaluation",
  "template_selection",
  "copy_generation",
  "media_placement",
  "research_enrichment",
  "website_package_generation",
]);
export type ReasoningKind = z.infer<typeof ReasoningKindSchema>;

export const BotReasonRequestSchema = z.object({
  tenant_id: z.string().min(1),
  run_id: z.string().uuid(),
  stage_id: z.string().min(1),
  reasoning_kind: ReasoningKindSchema,
  inputs: z.record(z.string(), z.unknown()),
  model_routing_profile: z.string().min(1),
  pii_policy: z.literal("strip_contact"),
});
export type BotReasonRequest = z.infer<typeof BotReasonRequestSchema>;

export const BotReasonResultSchema = z.object({
  outputs: z.record(z.string(), z.unknown()),
  model_run_id: z.string().min(1),
  tokens_in: z.number().int().min(0),
  tokens_out: z.number().int().min(0),
  failure: FailureReportSchema.optional(),
});
export type BotReasonResult = z.infer<typeof BotReasonResultSchema>;

/* -------------------------------------------------------------------------- */
/* §6.2 LiNKaios ↔ LinkSkills                                                 */
/* -------------------------------------------------------------------------- */

export const LeaseActorKindSchema = z.enum(["plugin", "bot", "user"]);
export type LeaseActorKind = z.infer<typeof LeaseActorKindSchema>;

export const LeaseRequestSchema = z.object({
  tenant_id: z.string().min(1),
  run_id: z.string().uuid(),
  stage_id: z.string().min(1),
  capability: z.string().min(1),
  arguments: z.record(z.string(), z.unknown()),
  idempotency_key: z.string().min(1),
  actor: z.object({
    actor_kind: LeaseActorKindSchema,
    actor_id: z.string().min(1),
  }),
});
export type LeaseRequest = z.infer<typeof LeaseRequestSchema>;

export const LeaseDecisionStatusSchema = z.enum([
  "granted",
  "denied",
  "requires_approval",
]);
export type LeaseDecisionStatus = z.infer<typeof LeaseDecisionStatusSchema>;

export const KillSwitchStateSchema = z.enum(["open", "tripped"]);
export type KillSwitchState = z.infer<typeof KillSwitchStateSchema>;

export const LeaseDecisionSchema = z.object({
  lease_id: z.string().min(1),
  status: LeaseDecisionStatusSchema,
  reason: z.string().optional(),
  expires_at: z.string().datetime().optional(),
  kill_switch_state: KillSwitchStateSchema,
  failure: FailureReportSchema.optional(),
});
export type LeaseDecision = z.infer<typeof LeaseDecisionSchema>;

export const LeaseExecuteRequestSchema = z.object({
  lease_id: z.string().min(1),
  idempotency_key: z.string().min(1),
});
export type LeaseExecuteRequest = z.infer<typeof LeaseExecuteRequestSchema>;

export const LeaseExecuteResultSchema = z.object({
  lease_id: z.string().min(1),
  capability: z.string().min(1),
  result: z.record(z.string(), z.unknown()),
  ledger_entry_id: z.string().min(1),
  audit_event_id: z.string().min(1),
  failure: FailureReportSchema.optional(),
});
export type LeaseExecuteResult = z.infer<typeof LeaseExecuteResultSchema>;

/* -------------------------------------------------------------------------- */
/* §6.3 All planes → LiNKbrain audit envelope                                 */
/* -------------------------------------------------------------------------- */

export const AuditActorKindSchema = z.enum([
  "kernel",
  "plugin",
  "bot",
  "user",
  "system",
]);
export type AuditActorKind = z.infer<typeof AuditActorKindSchema>;

// Canonical initial action vocabulary per §6.3.1. Agents MAY add via a
// decision row, never rename. Validated as a string at the boundary so future
// additions do not require an SDK release.
export const AUDIT_ACTIONS = [
  "run.started",
  "run.completed",
  "run.failed",
  "run.cancelled",
  "stage.started",
  "stage.completed",
  "stage.failed",
  "stage.awaiting_approval",
  "stage.skipped",
  "lease.requested",
  "lease.granted",
  "lease.denied",
  "lease.executed",
  "lease.expired",
  "lease.revoked",
  "workflow.invoked",
  "workflow.completed",
  "workflow.failed",
  "workflow.compensated",
  "role.declared",
  "role.skipped",
  "role.mock_substitution",
  "role.started",
  "role.completed",
  "role.failed",
  "research.performed",
  "provenance.recorded",
  "template.guidance.selected",
  "website.package.generated",
  "preview.readiness.checked",
  "preview.readiness.failed",
  "preview.published",
  "crm.upserted",
  "crm.lead.status.updated",
  "supabase.mirror.content.upserted",
  "supabase.mirror.asset_refs.upserted",
  "payload.content.upserted",
  "payload.preview.updated",
  "payload.sync.checked",
  "asset.generated",
  "asset.provenance.recorded",
  "plane.project.created",
  "plane.task.created",
  "plane.project.upserted",
  "plane.task.upserted",
  "plane.readiness.checked",
  "approval.requested",
  "approval.granted",
  "approval.rejected",
  "approval.timed_out",
  // ── LEXOS Litigation domain actions (lexos-litigation.md §4) ──
  // W0: Client Onboarding
  "intake.processed",
  "conflict.checked",
  "client.accepted",
  "client.rejected",
  "kyc.completed",
  // W1: Client Master Record
  "memory.updated",
  "promotion.processed",
  // W2: Case-Client Story
  "story.created",
  "assertions.extracted",
  "timeline.built",
  "gaps.identified",
  // W4: Evidence Intake
  "evidence.ingested",
  "evidence.classified",
  "extraction.queued",
  "extraction.started",
  "extraction.completed",
  "extraction.failed",
  "extraction.qa_flagged",
  "custody.logged",
  "qa.completed",
  // W5: Support Matrix
  "support.mapped",
  "contradictions.found",
  "assertion.state_changed",
  // W6: Strategy
  "strategy.developed",
  "risks.identified",
  "research.questions_defined",
  // W7: Legal Research
  "citations.verified",
  "adverse.authority_found",
  // W8: Argument Drafting
  "argument.drafted",
  "claims.linked",
  "citations.inserted",
  // W9: Adversarial Review
  "critique.completed",
  "weaknesses.found",
  "revision.checklist_created",
  // W11: Output Refinement
  "output.refined",
  "caveats.preserved",
  "bundle.prepared",
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export const AuditEventSubjectSchema = z.object({
  run_id: z.string().optional(),
  stage_id: z.string().optional(),
  lease_id: z.string().optional(),
  workflow_run_id: z.string().optional(),
  capability: z.string().optional(),
  plugin_id: z.string().optional(),
  lead_id: z.string().optional(),
  preview_url: z.string().optional(),
  preview_artifact_ref: z.string().optional(),
  crm_record_id: z.string().optional(),
  project_id: z.string().optional(),
  task_id: z.string().optional(),
  // ── LEXOS Litigation domain subject IDs ──
  matter_id: z.string().optional(),
  intake_id: z.string().optional(),
  client_id: z.string().optional(),
  case_story_id: z.string().optional(),
  assertion_id: z.string().optional(),
  evidence_id: z.string().optional(),
  extraction_id: z.string().optional(),
  support_matrix_item_id: z.string().optional(),
  strategy_memo_id: z.string().optional(),
  research_memo_id: z.string().optional(),
  argument_draft_id: z.string().optional(),
  adversarial_critique_id: z.string().optional(),
  output_artifact_id: z.string().optional(),
});
export type AuditEventSubject = z.infer<typeof AuditEventSubjectSchema>;

export const AuditEventSchema = z.object({
  event_id: z.string().uuid(),
  ts: z.string().datetime(),
  tenant_id: z.string().min(1),
  plane: PlaneSchema,
  actor: z.object({
    actor_kind: AuditActorKindSchema,
    actor_id: z.string().min(1),
  }),
  // Envelope basics: action and subject are REQUIRED (§12.6).
  action: z.string().min(1),
  subject: AuditEventSubjectSchema,
  refs: z
    .object({
      caused_by_event_id: z.string().optional(),
      parent_event_id: z.string().optional(),
    })
    .optional(),
  payload: z.record(z.string(), z.unknown()),
  schema_version: z.literal("1"),
});
export type AuditEvent = z.infer<typeof AuditEventSchema>;

export const AuditWriteResultSchema = z.object({
  event_id: z.string().uuid(),
  persisted_at: z.string().datetime(),
  failure: FailureReportSchema.optional(),
});
export type AuditWriteResult = z.infer<typeof AuditWriteResultSchema>;

/* -------------------------------------------------------------------------- */
/* §6.4 LiNKaios ↔ LiNKautowork                                               */
/* -------------------------------------------------------------------------- */

export const WorkflowInvokeRequestSchema = z.object({
  tenant_id: z.string().min(1),
  run_id: z.string().uuid(),
  stage_id: z.string().min(1),
  workflow_handle: z.string().min(1),
  inputs: z.record(z.string(), z.unknown()),
  lease_id: z.string().optional(),
  idempotency_key: z.string().min(1),
});
export type WorkflowInvokeRequest = z.infer<typeof WorkflowInvokeRequestSchema>;

export const WorkflowRunStatusSchema = z.enum([
  "succeeded",
  "failed",
  "compensated",
]);
export type WorkflowRunStatus = z.infer<typeof WorkflowRunStatusSchema>;

export const WorkflowInvokeResultSchema = z.object({
  workflow_run_id: z.string().min(1),
  status: WorkflowRunStatusSchema,
  outputs: z.record(z.string(), z.unknown()).optional(),
  audit_event_ids: z.array(z.string()),
  failure: FailureReportSchema.optional(),
});
export type WorkflowInvokeResult = z.infer<typeof WorkflowInvokeResultSchema>;

/* -------------------------------------------------------------------------- */
/* §7 LinkSkills capabilities (args + results)                                */
/* -------------------------------------------------------------------------- */

// §7.1 crm.upsert
export const CrmUpsertArgsSchema = z.object({
  tenant_id: z.string().min(1),
  lead_id: z.string().min(1),
  business_name: z.string().min(1),
  industry: z.string().min(1),
  contact_email: EmailSchema.optional(),
  contact_phone: E164Schema.optional(),
  external_ids: ExternalIdsSchema,
});
export type CrmUpsertArgs = z.infer<typeof CrmUpsertArgsSchema>;

export const CrmUpsertResultSchema = z.object({
  crm_record_id: z.string().min(1),
  created: z.boolean(),
});
export type CrmUpsertResult = z.infer<typeof CrmUpsertResultSchema>;

// §7.2 plane.project.create
export const PlaneProjectCreateArgsSchema = z.object({
  tenant_id: z.string().min(1),
  lead_id: z.string().min(1),
  project_name: z.string().min(1),
  owner_actor_id: z.string().min(1),
});
export type PlaneProjectCreateArgs = z.infer<typeof PlaneProjectCreateArgsSchema>;

export const PlaneProjectCreateResultSchema = z.object({
  project_id: z.string().min(1),
  created: z.boolean(),
});
export type PlaneProjectCreateResult = z.infer<
  typeof PlaneProjectCreateResultSchema
>;

// §7.3 plane.task.create
export const PlaneTaskCreateArgsSchema = z.object({
  tenant_id: z.string().min(1),
  project_id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  assignee_actor_id: z.string().optional(),
});
export type PlaneTaskCreateArgs = z.infer<typeof PlaneTaskCreateArgsSchema>;

export const PlaneTaskCreateResultSchema = z.object({
  task_id: z.string().min(1),
  created: z.boolean(),
});
export type PlaneTaskCreateResult = z.infer<typeof PlaneTaskCreateResultSchema>;

// §2 render_spec (needed as an argument to preview.publish)
export const CopyBundleSchema = z.object({
  blocks: z.array(
    z.object({
      block_id: z.string().min(1),
      text: z.record(z.string(), z.string()),
    }),
  ),
  locale: z.string().min(1),
});
export type CopyBundle = z.infer<typeof CopyBundleSchema>;

export const MediaPlanSchema = z.object({
  placements: z.array(
    z.object({
      block_id: z.string().min(1),
      asset_ref: z.string().min(1),
      kind: z.enum(["placeholder", "stock"]),
    }),
  ),
});
export type MediaPlan = z.infer<typeof MediaPlanSchema>;

export const ThemeOverridesSchema = z.record(z.string(), z.unknown());
export type ThemeOverrides = z.infer<typeof ThemeOverridesSchema>;

export const RenderSpecSchema = z.object({
  template_id: z.string().min(1),
  copy_bundle: CopyBundleSchema,
  media_plan: MediaPlanSchema,
  theme: ThemeOverridesSchema,
});
export type RenderSpec = z.infer<typeof RenderSpecSchema>;

// §7.4 preview.publish
export const PreviewPublishArgsSchema = z.object({
  tenant_id: z.string().min(1),
  run_id: z.string().uuid(),
  render_spec: RenderSpecSchema,
  preview_route_prefix: z.string().min(1),
});
export type PreviewPublishArgs = z.infer<typeof PreviewPublishArgsSchema>;

export const PreviewPublishResultSchema = z.object({
  preview_url: z.string().min(1),
  preview_artifact_ref: z.string().min(1),
  expires_at: z.string().datetime().optional(),
});
export type PreviewPublishResult = z.infer<typeof PreviewPublishResultSchema>;

/* -------------------------------------------------------------------------- */
/* §9 Preview output                                                          */
/* -------------------------------------------------------------------------- */

export const PreviewOutputStatusSchema = z.enum([
  "succeeded",
  "partial",
  "failed",
  "awaiting_approval",
]);
export type PreviewOutputStatus = z.infer<typeof PreviewOutputStatusSchema>;

export const PreviewOutputSchema = z.object({
  run_id: z.string().uuid(),
  tenant_id: z.string().min(1),
  plugin_id: z.literal("websitefactory"),

  preview_url: z.string().min(1),
  preview_artifact_ref: z.string().min(1),

  crm_record_id: z.string().nullable(),
  project_id: z.string().nullable(),
  task_id: z.string().nullable(),

  lease_ids: z.array(z.string()),
  workflow_run_ids: z.array(z.string()),
  audit_event_ids: z.array(z.string()),

  status: PreviewOutputStatusSchema,
  finalized_at: z.string().datetime().optional(),
});
export type PreviewOutput = z.infer<typeof PreviewOutputSchema>;

/* -------------------------------------------------------------------------- */
/* §2 data-dictionary refs (kept minimal; runtime shapes belong with owners)  */
/* -------------------------------------------------------------------------- */

export const LeadRecordRefSchema = z.object({
  lead_id: z.string().min(1),
  tenant_id: z.string().min(1),
  idempotency_key: z.string().min(1),
});
export type LeadRecordRef = z.infer<typeof LeadRecordRefSchema>;

/* -------------------------------------------------------------------------- */
/* §0.A LinkSites v2 focused SDK contracts (WP-046)                           */
/* -------------------------------------------------------------------------- */

// WP-042 discovered template registry currently resolves to marketing-smb-v1.
export const LinkSitesV2TemplateIdSchema = z.literal("marketing-smb-v1");
export type LinkSitesV2TemplateId = z.infer<typeof LinkSitesV2TemplateIdSchema>;

export const LinkSitesV2RoleIdSchema = z.enum([
  "lead_scout_bot",
  "research_enrichment_bot",
  "website_builder_bot",
  "outreach_bot",
]);
export type LinkSitesV2RoleId = z.infer<typeof LinkSitesV2RoleIdSchema>;

export const LinkSitesV2CapabilityPluginIdSchema = z.enum([
  "cap.crm.odoo_shadow",
  "cap.payload.local_sync",
  "cap.supabase.mirror_content",
  "cap.zulip.run_messaging",
  "cap.research.public_web",
  "cap.asset.generation",
  "cap.plane.execution_tracking",
]);
export type LinkSitesV2CapabilityPluginId = z.infer<
  typeof LinkSitesV2CapabilityPluginIdSchema
>;

export const LinkSitesV2WorkflowHandleSchema = z.enum([
  "autowork.linksites.artifact_write_local",
  "autowork.linksites.supabase_mirror_upsert",
  "autowork.linksites.payload_sync_local",
  "autowork.linksites.preview_readiness_check",
  "autowork.linksites.crm_ready_to_contact_mark",
]);
export type LinkSitesV2WorkflowHandle = z.infer<
  typeof LinkSitesV2WorkflowHandleSchema
>;

// Discovered source refs are pinned to prevent schema invention.
export const LinkSitesV2DiscoveredRefsSchema = z.object({
  template_registry_ref: z.literal(
    "/Users/linktrend/Projects/LiNKsites/apps/web-master/src/templates/registry.ts",
  ),
  template_module_ref: z.literal(
    "/Users/linktrend/Projects/LiNKsites/apps/web-master/src/templates/marketing-smb-v1.ts",
  ),
  payload_config_ref: z.literal(
    "/Users/linktrend/Projects/LiNKsites/apps/cms/src/payload.config.ts",
  ),
  supabase_schema_ref: z.literal(
    "/Users/linktrend/Projects/LiNKsites/supabase/schemas/lsites_core.schema.json",
  ),
  supabase_cms_mapping_ref: z.literal(
    "/Users/linktrend/Projects/LiNKsites/supabase/schemas/cms-mapping.json",
  ),
  payload_reader_ref: z.literal(
    "/Users/linktrend/Projects/LiNKsites/apps/web-master/src/lib/payload-client.ts",
  ),
});
export type LinkSitesV2DiscoveredRefs = z.infer<
  typeof LinkSitesV2DiscoveredRefsSchema
>;

export const LinkSitesV2SiteGenerationRefSchema = z.object({
  site_id: z.string().min(1),
  site_generation_run_id: z.string().min(1),
});
export type LinkSitesV2SiteGenerationRef = z.infer<
  typeof LinkSitesV2SiteGenerationRefSchema
>;

export const LinkSitesV2PreviewReadinessStatusSchema = z.enum([
  "ready_to_contact",
  "not_ready",
]);
export type LinkSitesV2PreviewReadinessStatus = z.infer<
  typeof LinkSitesV2PreviewReadinessStatusSchema
>;

export const LinkSitesV2PreviewReadinessSummarySchema = z
  .object({
    tenant_id: z.string().min(1),
    run_id: z.string().uuid(),
    lead_id: z.string().min(1),
    generation: LinkSitesV2SiteGenerationRefSchema,
    template_id: LinkSitesV2TemplateIdSchema,
    checks_passed: z.boolean(),
    failed_checks: z.array(z.string()),
    preview_readiness_status: LinkSitesV2PreviewReadinessStatusSchema,
    // v2 MVO is explicitly development-only and local side-effect scoped.
    execution_mode: z.literal("development"),
    generated_artifact_root_kind: z.literal("local"),
  })
  .superRefine((v, ctx) => {
    if (v.checks_passed && v.failed_checks.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["failed_checks"],
        message: "failed_checks must be empty when checks_passed is true",
      });
    }
    if (v.checks_passed && v.preview_readiness_status !== "ready_to_contact") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["preview_readiness_status"],
        message:
          "preview_readiness_status must be ready_to_contact when checks_passed is true",
      });
    }
    if (!v.checks_passed && v.preview_readiness_status !== "not_ready") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["preview_readiness_status"],
        message:
          "preview_readiness_status must be not_ready when checks_passed is false",
      });
    }
  });
export type LinkSitesV2PreviewReadinessSummary = z.infer<
  typeof LinkSitesV2PreviewReadinessSummarySchema
>;
