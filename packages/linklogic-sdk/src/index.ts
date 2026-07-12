export {
  closeWorkerSession,
  ensureWorkerAgent,
  openWorkerSession,
  pulseWorkerSession,
} from "./sessions.js";

export { recordTrace } from "./trace.js";

export { recordPrismSessionEnd } from "./prism-session-end.js";
export type { PrismSessionEndDetail } from "./prism-session-end.js";

export { resolveSkillByName, resolveSkillFullForExecution } from "./resolve-skill.js";

export { assertResolvedApprovedSkill } from "./enforcement.js";

export { listMissions, getMissionById, listManifestsForMission } from "./missions-catalog.js";
export { listMemoryEntries } from "./memory-catalog.js";
export type { MemoryEntryRow } from "./memory-catalog.js";
export { getSkillById, listApprovedSkillsDeclaringTool, listSkills } from "./skills-catalog.js";
export {
  getSkillExecutionPackage,
  listSkillDiscoveryLayer1,
  listSkillsSlimInCategory,
  searchSkillsSlimByEmbedding,
} from "./skills-retrieval-stages.js";
export {
  buildResolvedStepExecution,
  effectiveDeclaredToolsForStep,
  parseStepRecipeEntries,
} from "./skill-step-execution.js";
export type {
  ResolvedSkillStepExecution,
  SkillAssetRowLite,
  SkillReferenceRowLite,
  SkillScriptRowLite,
  SkillStepRecipeEntry,
} from "./skill-step-execution.js";
export { fetchSkillExecutionPackageFromLiNKaios } from "./skills-execution-client.js";
export type { FetchSkillExecutionResult } from "./skills-execution-client.js";
export type {
  SkillCategoryRow,
  SkillExecutionPackage,
  SkillSlimRow,
} from "./skills-retrieval-stages.js";
export {
  buildSkillIndexMetadata,
  mergeSkillIndexIntoMetadata,
  SKILL_INDEX_METADATA_KEY,
} from "./skill-index-metadata.js";
export type { SkillAssetSlim, SkillIndexMetadata, SkillReferenceSlim, SkillScriptSlim } from "./skill-index-metadata.js";
export { syncSkillDerivedMetadata } from "./skill-metadata-sync.js";
export { embedMissingSkillSlimIndexes } from "./skill-slim-embed-batches.js";
export type { SkillSlimEmbedBatchResult } from "./skill-slim-embed-batches.js";
export {
  getDeclaredToolsFilterFromMetadata,
  getDeclaredToolsFromSkill,
  getSkillWideDefaultDeclaredTools,
  SKILL_APPROVE_REQUIRES_DECLARED_TOOLS,
  validateEffectiveDeclaredToolsNonEmpty,
  isToolPublishedApprovedCatalog,
  normalizeDeclaredToolNames,
  validateDeclaredToolsForDraftSave,
  validateDeclaredToolsForSkillApprove,
} from "./declared-tools.js";
export { getToolById, listTools } from "./tools-catalog.js";
export type {
  ScaffoldOptions,
  ScaffoldResult,
  SkillCatalogEntry,
  SkillEngineRequirements,
  SkillFrontmatter,
  SkillManifest,
  SkillPersistence,
  SkillToolingPolicy,
  ValidationIssue,
  ValidationResult,
} from "./types/skill.js";
export type {
  KillSwitchConfig,
  KillSwitchLevel,
  KillSwitchStateV2,
  SafetyTriggerInput,
} from "./types/safety.js";

export {
  ensureRuntimeBlockedRequest,
  loadMissionlessDefaultToolNames,
  loadMissionToolNames,
  loadOrgAllowedToolNames,
  resolveToolIdByName,
} from "./tool-governance-db.js";

export { appendCentralMemoryEntry } from "./central-memory.js";

export {
  buildLinktrendGovernancePayload,
  buildOpenClawAgentIngressBody,
  toolNamesFromManifestPayload,
  wrapGovernanceForOpenClaw,
} from "./governance-payload.js";
export type { BuildGovernanceOptions } from "./governance-payload.js";
export type { BuildLinktrendGovernanceResult } from "@linktrend/shared-types";

export {
  appendBrainDailyLogLine,
  chunkTextByParagraphs,
  cosineSimilarity,
  createBrainDraft,
  createBrainDraftFromPublishedIfAny,
  enrichBrainVirtualFilesWithPublishState,
  findBrainVirtualFile,
  getBrainFileVersionById,
  getBrainVirtualFileById,
  getOrCreateBrainVirtualFile,
  getPublishedBodyForPath,
  getPublishedVersionForFile,
  getPublishedVirtualFileBody,
  listBrainDailyLogLines,
  listBrainDraftsForInbox,
  listBrainIndexCardsForFile,
  listBrainVirtualFilesByScope,
  listBrainVirtualFilesByScopeAndOrgTag,
  normaliseBrainInboxItemType,
  publishBrainVersion,
  rejectBrainDraft,
  replaceChunksForVersion,
  replaceIndexCardsForFile,
  updateBrainDraftBody,
  upsertBrainChunkEmbedding,
} from "./brain-virtual-files.js";
export type {
  BrainFileKind,
  BrainFileVersionRow,
  BrainIndexCardRow,
  BrainInboxItemType,
  BrainInboxRow,
  BrainMemoryTags,
  BrainScope,
  BrainSensitivity,
  BrainVirtualFileEnriched,
  BrainVirtualFileRow,
} from "./brain-virtual-files.js";

export { mergeDailyLogLinesIntoPublishedBody, MEMORY_DAILY_LOG_PATH_RE, parseDailyLogDateFromPath } from "./brain-daily-log.js";

export { getBrainUploadByFileId, insertBrainUploadRecord } from "./brain-uploads.js";
export type { BrainUploadObjectRow } from "./brain-uploads.js";

export {
  reconcileBrainEmbedJobAfterChunkWork,
  upsertBrainEmbedJobPending,
  upsertBrainEmbedJobState,
} from "./brain-embed-jobs.js";

export { summarizeBrainInboxTextDiff } from "./brain-inbox-diff.js";

export { embedMissingBrainChunks } from "./brain-embedding-batches.js";
export type { BrainEmbedBatchResult } from "./brain-embedding-batches.js";

export {
  createBrainOrgNode,
  DEFAULT_BRAIN_LEGAL_ENTITY_ID,
  listBrainLegalEntities,
  listBrainOrgNodes,
  listOrgTagIdsForFile,
  replaceOrgTagsForVirtualFile,
  updateBrainLegalEntity,
  updateBrainOrgNode,
} from "./brain-org.js";
export type { BrainLegalEntityRow, BrainOrgNodeRow } from "./brain-org.js";

export { embedTextGemini } from "./brain-embeddings.js";
export type { GeminiEmbedOk, GeminiEmbedResult } from "./brain-embeddings.js";

export { retrieveBrainContextForPath } from "./brain-retrieval.js";
export type {
  BrainIndexCardLite,
  BrainRetrievedChunk,
  BrainRetrieveContextResult,
  BrainRetrieveStage,
} from "./brain-retrieval.js";

export { BRAIN_ORIENTATION_MAP_PATH } from "./brain-orientation.js";

export {
  CANONICAL_AUDIT_ACTIONS,
  validateAuditEnvelope,
  writeBrainAuditEvent,
} from "./brain-audit.js";
export type { AuditEnvelopeRejection } from "./brain-audit.js";

// Memory Object schemas and writer (WP-087)
export {
  buildEpisodeSummaryPayload,
  buildLeadMemoryPayload,
  buildResearchBundlePayload,
  EpisodeStageSummarySchema,
  EpisodeSummaryPayloadSchema,
  getMemoriesByLead,
  getMemoriesByRun,
  LeadMemoryEngagementSchema,
  LeadMemoryFactsSchema,
  LeadMemoryPayloadSchema,
  MemoryObjectEnvelopeSchema,
  MemoryObjectScopeSchema,
  MemoryObjectStateSchema,
  MemoryObjectTypeSchema,
  ResearchBundlePayloadSchema,
  ResearchCitationSchema,
  ComparableBusinessSchema,
  updateMemoryObjectState,
  writeMemoryObject,
  LexosClientPayloadSchema,
  LexosMatterPayloadSchema,
  LexosCaseStoryPayloadSchema,
  LexosAssertionBundlePayloadSchema,
  LexosStrategyPayloadSchema,
  LexosResearchPayloadSchema,
  LexosArgumentPayloadSchema,
  LexosOutputPayloadSchema,
} from "./brain-memory.js";
export type {
  ComparableBusiness,
  EpisodeStageSummary,
  EpisodeSummaryPayload,
  LeadMemoryEngagement,
  LeadMemoryFacts,
  LeadMemoryPayload,
  MemoryObjectEnvelope,
  MemoryObjectScope,
  MemoryObjectState,
  MemoryObjectType,
  MemoryQueryResult,
  MemoryWriteResult,
  ResearchBundlePayload,
  ResearchCitation,
  UpdateMemoryStateOptions,
  WriteMemoryObjectOptions,
  LexosClientPayload,
  LexosMatterPayload,
  LexosCaseStoryPayload,
  LexosAssertionBundlePayload,
  LexosStrategyPayload,
  LexosResearchPayload,
  LexosArgumentPayload,
  LexosOutputPayload,
} from "./brain-memory.js";

// LiNKbrain benchmarking and feedback schemas (WP-089)
export {
  BrainBenchmarkAggregateRowSchema,
  BrainFeedbackActorSubjectSchema,
  BrainFeedbackRecordPayloadSchema,
  BrainFeedbackVerdictSchema,
  parseBrainBenchmarkAggregateRow,
  parseBrainFeedbackRecordPayload,
  stripTenantIdentifyingFields,
} from "./brain-benchmarks.js";
export type {
  BrainBenchmarkAggregateRow,
  BrainFeedbackActorSubject,
  BrainFeedbackRecordPayload,
  BrainFeedbackVerdict,
} from "./brain-benchmarks.js";

// Cross-vertical trace dashboard schemas (WP-116)
export {
  buildDailyAggregateQuery,
  buildRecentTracesQuery,
  CrossVerticalAggregateQuerySchema,
  CrossVerticalAggregateResultSchema,
  CrossVerticalTraceAggregateSchema,
  parseCrossVerticalAggregateQuery,
  parseCrossVerticalAggregateResult,
  parseCrossVerticalTraceAggregate,
  parseTraceQueryFilter,
  parseTraceQueryResult,
  parseTraceSummary,
  StageSlugSchema,
  stripTenantFieldsFromTrace,
  TimeBucketUnitSchema,
  TraceOutcomeSchema,
  TraceQueryFilterSchema,
  TraceQueryResultSchema,
  TraceSummarySchema,
  VerticalKeySchema,
} from "./brain-traces.js";
export type {
  CrossVerticalAggregateQuery,
  CrossVerticalAggregateResult,
  CrossVerticalTraceAggregate,
  StageSlug,
  TimeBucketUnit,
  TraceOutcome,
  TraceQueryFilter,
  TraceQueryResult,
  TraceSummary,
  VerticalKey,
} from "./brain-traces.js";

// MVO cross-service contract schemas + types. Canonical source:
// `.ai-swarm/CONTRACTS_MVO.md`. Pinned by WP-005.
export {
  AUDIT_ACTIONS,
  ActorKindSchema,
  AuditActorKindSchema,
  AuditEventSchema,
  AuditEventSubjectSchema,
  AuditWriteResultSchema,
  BotReasonRequestSchema,
  BotReasonResultSchema,
  CapabilityPluginCallerSchema,
  CapabilityPluginSurfaceSchema,
  CopyBundleSchema,
  CrmUpsertArgsSchema,
  CrmUpsertResultSchema,
  FailureCodeSchema,
  FailureModeSchema,
  FailureReportSchema,
  KillSwitchStateSchema,
  LeadInputSchema,
  LeadRecordRefSchema,
  LeaseActorKindSchema,
  LeaseDecisionSchema,
  LeaseDecisionStatusSchema,
  LeaseExecuteRequestSchema,
  LeaseExecuteResultSchema,
  LeaseRequestSchema,
  LinkSitesV2CapabilityPluginIdSchema,
  LinkSitesV2DiscoveredRefsSchema,
  LinkSitesV2PreviewReadinessStatusSchema,
  LinkSitesV2PreviewReadinessSummarySchema,
  LinkSitesV2RoleIdSchema,
  LinkSitesV2SiteGenerationRefSchema,
  LinkSitesV2TemplateIdSchema,
  LinkSitesV2WorkflowHandleSchema,
  LiNKbotRoleAttachmentSchema,
  MediaPlanSchema,
  PlaneProjectCreateArgsSchema,
  PlaneProjectCreateResultSchema,
  PlaneSchema,
  PlaneTaskCreateArgsSchema,
  PlaneTaskCreateResultSchema,
  PluginKindSchema,
  PluginManifestSchema,
  PluginManifestStageSchema,
  PluginModeSchema,
  PreviewOutputSchema,
  PreviewOutputStatusSchema,
  PreviewPublishArgsSchema,
  PreviewPublishResultSchema,
  ReasoningKindSchema,
  RenderSpecSchema,
  RunSchema,
  RunStatusSchema,
  StageSchema,
  StageStatusSchema,
  ThemeOverridesSchema,
  WorkRequestSchema,
  WorkflowInvokeRequestSchema,
  WorkflowInvokeResultSchema,
  WorkflowRunStatusSchema,
} from "./contracts-mvo.js";
export type {
  ActorKind,
  AuditAction,
  AuditActorKind,
  AuditEvent,
  AuditEventSubject,
  AuditWriteResult,
  BotReasonRequest,
  BotReasonResult,
  CapabilityPluginCaller,
  CapabilityPluginSurface,
  CopyBundle,
  CrmUpsertArgs,
  CrmUpsertResult,
  FailureCode,
  FailureMode,
  FailureReport,
  KillSwitchState,
  LeadInput,
  LeadRecordRef,
  LeaseActorKind,
  LeaseDecision,
  LeaseDecisionStatus,
  LeaseExecuteRequest,
  LeaseExecuteResult,
  LeaseRequest,
  LinkSitesV2CapabilityPluginId,
  LinkSitesV2DiscoveredRefs,
  LinkSitesV2PreviewReadinessStatus,
  LinkSitesV2PreviewReadinessSummary,
  LinkSitesV2RoleId,
  LinkSitesV2SiteGenerationRef,
  LinkSitesV2TemplateId,
  LinkSitesV2WorkflowHandle,
  LiNKbotRoleAttachment,
  MediaPlan,
  Plane,
  PlaneProjectCreateArgs,
  PlaneProjectCreateResult,
  PlaneTaskCreateArgs,
  PlaneTaskCreateResult,
  PluginKind,
  PluginManifest,
  PluginManifestStage,
  PluginMode,
  PreviewOutput,
  PreviewOutputStatus,
  PreviewPublishArgs,
  PreviewPublishResult,
  ReasoningKind,
  RenderSpec,
  Run,
  RunStatus,
  Stage,
  StageStatus,
  ThemeOverrides,
  WorkRequest,
  WorkflowInvokeRequest,
  WorkflowInvokeResult,
  WorkflowRunStatus,
} from "./contracts-mvo.js";
export type {
  CapabilityAllowedCaller,
  CapabilityCatalogEntry,
  CapabilityMode,
  CapabilityOperation,
} from "./types/capability.js";

// LiNKbrain Context Assembly (WP-088)
export {
  assembleContext,
  ContextAssemblyErrorCodeSchema,
  ContextAssemblyResultSchema,
  ContextBundleSchema,
  ContextRequestSchema,
  isAuthorizedForScope,
  MemoryEpisodeSchema,
  MemoryFactSchema,
  MemoryProcedureSchema,
  ScopeLatticeSchema,
} from "./context-assembly.js";
export {
  MemoryObjectStateSchema as ContextMemoryObjectStateSchema,
  MemoryObjectTypeSchema as ContextMemoryObjectTypeSchema,
} from "./context-assembly.js";
export type {
  ContextAssemblyErrorCode,
  ContextAssemblyResult,
  ContextBundle,
  ContextRequest,
  MemoryEpisode,
  MemoryFact,
  MemoryObject,
  MemoryProcedure,
  MemoryStore,
  ScopeLattice,
} from "./context-assembly.js";
export type {
  MemoryObjectState as ContextMemoryObjectState,
  MemoryObjectType as ContextMemoryObjectType,
} from "./context-assembly.js";

// LiNKbrain Trace Intelligence (WP-202)
export {
  buildTraceSummaryText,
  getLeadTrace,
  getOperatorBrainStatus,
  getPlaneBreakdown,
  getRecentActivitySummary,
  getRunTrace,
  isMvoCompleteTrace,
} from "./brain-trace-intelligence.js";
export type {
  CrossPlaneStageSummary,
  LeadTraceResult,
  MemoryObjectReference,
  OperatorBrainStatus,
  OperatorBrainStatusResult,
  RunTraceResult,
  RunTraceSummary,
  TraceEvent,
} from "./brain-trace-intelligence.js";

// Progressive disclosure types (WP-080)
export {
  DisclosureScopeSchema,
  ExecutionModeSchema,
  DisclosureTokenPayloadSchema,
  SkillFragmentTypeSchema,
  DisclosureIssueRequestSchema,
} from "./types/disclosure.js";
export type {
  DisclosureAuditRecord,
  DisclosureErrorCode,
  DisclosureIssueRequest,
  DisclosureIssueResult,
  DisclosureManifest,
  DisclosureScope,
  DisclosureStoreEntry,
  DisclosureToken,
  DisclosureTokenPayload,
  DisclosureValidationRequest,
  DisclosureValidationResult,
  ExecutionMode,
  SkillFragment,
  SkillFragmentType,
} from "./types/disclosure.js";

// LiNKapps App Factory ↔ LiNKbrain audit/memory payloads (WP-111)
export {
  LINKAPPS_PLUGIN_ID,
  LinkappsArtifactRefSchema,
  LinkappsBrainEventPayloadSchema,
  LinkappsCapabilityLeaseSummarySchema,
  LinkappsHandoffArtifactMemoryPayloadSchema,
  LinkappsHandoffArtifactRecordSchema,
  LinkappsRunCheckpointKindSchema,
  LinkappsRunEventPayloadSchema,
  LinkappsSquadDecisionEventPayloadSchema,
  LinkappsSquadDecisionKindSchema,
  LinkappsWorkRequestTypeSchema,
  parseLinkappsBrainEventPayload,
  parseLinkappsCapabilityLeaseSummary,
  parseLinkappsHandoffArtifactMemoryPayload,
  parseLinkappsRunEventPayload,
  parseLinkappsSquadDecisionEventPayload,
} from "./linkapps-brain-events.js";
export type {
  LinkappsArtifactRef,
  LinkappsBrainEventPayload,
  LinkappsCapabilityLeaseSummary,
  LinkappsHandoffArtifactMemoryPayload,
  LinkappsHandoffArtifactRecord,
  LinkappsRunCheckpointKind,
  LinkappsRunEventPayload,
  LinkappsSquadDecisionEventPayload,
  LinkappsSquadDecisionKind,
  LinkappsWorkRequestType,
} from "./linkapps-brain-events.js";

// LEXOS Litigation vertical plugin contracts (WP-097)
export {
  LEXOS_PLUGIN_ID,
  LEXOS_PLUGIN_NAME,
  LEXOS_PLUGIN_VERSION,
  LEXOS_WORKFLOW_STAGES,
  LEXOS_STAGE_DISPLAY_NAMES,
  LEXOS_ROLE_DISPLAY_NAMES,
  LexosWorkRequestTypeSchema,
  LexosRoleIdSchema,
  LexosCapabilityIdSchema,
  LexosWorkflowHandleSchema,
  LexosAuditEventTypeSchema,
  LexosIntakeNewRequestSchema,
  LexosIntakeNewResultSchema,
  LexosMatterCreateRequestSchema,
  LexosMatterCreateResultSchema,
  LexosStoryDevelopRequestSchema,
  LexosStoryDevelopResultSchema,
  LexosEvidenceIngestRequestSchema,
  LexosEvidenceIngestResultSchema,
  LexosAssertionsExtractRequestSchema,
  LexosAssertionsExtractResultSchema,
  LexosSupportMapRequestSchema,
  LexosSupportMapResultSchema,
  LexosStrategyDevelopRequestSchema,
  LexosStrategyDevelopResultSchema,
  LexosResearchConductRequestSchema,
  LexosResearchConductResultSchema,
  LexosArgumentDraftRequestSchema,
  LexosArgumentDraftResultSchema,
  LexosAdversarialReviewRequestSchema,
  LexosAdversarialReviewResultSchema,
  LexosOutputGenerateRequestSchema,
  LexosOutputGenerateResultSchema,
  LexosWorkRequestPayloadSchema,
  LexosWorkResultSchema,
  LexosRunOutputStatusSchema,
} from "./lexos-contracts.js";

export type {
  LexosWorkRequestType,
  LexosRoleId,
  LexosCapabilityId,
  LexosWorkflowHandle,
  LexosAuditEventType,
  LexosWorkflowStage,
  LexosIntakeNewRequest,
  LexosIntakeNewResult,
  LexosMatterCreateRequest,
  LexosMatterCreateResult,
  LexosStoryDevelopRequest,
  LexosStoryDevelopResult,
  LexosEvidenceIngestRequest,
  LexosEvidenceIngestResult,
  LexosAssertionsExtractRequest,
  LexosAssertionsExtractResult,
  LexosSupportMapRequest,
  LexosSupportMapResult,
  LexosStrategyDevelopRequest,
  LexosStrategyDevelopResult,
  LexosResearchConductRequest,
  LexosResearchConductResult,
  LexosArgumentDraftRequest,
  LexosArgumentDraftResult,
  LexosAdversarialReviewRequest,
  LexosAdversarialReviewResult,
  LexosOutputGenerateRequest,
  LexosOutputGenerateResult,
  LexosWorkRequestPayload,
  LexosWorkResult,
  LexosWorkRequest,
  LexosMatterRef,
  LexosClientRef,
  LexosIntakeRef,
  LexosRunOutputStatus,
  LexosRunOutput,
  LexosCapabilityLeaseArgs,
} from "./lexos-contracts.js";
