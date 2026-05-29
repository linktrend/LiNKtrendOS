/**
 * LEXOS Litigation — Memory Promotion Rules
 *
 * Maps audit events to LiNKbrain memory object types for automatic promotion.
 * Per LiNKbrain/events/modules/lexos-litigation.md §Memory Object Promotion
 * and lexos-litigation-event-schema.yaml §memory_promotion.
 *
 * @module LiNKbrain/events/modules/lexos-litigation-memory-promotion
 */

import type { AuditAction, AuditEvent } from "@linktrend/linklogic-sdk";
import type { MemoryObjectType } from "@linktrend/linklogic-sdk";

export interface MemoryPromotionRule {
  sourceEvent: AuditAction;
  targetType: MemoryObjectType;
  retention: "persistent" | "matter_bound";
  scope: "tenant" | "matter";
}

export const LEXOS_MEMORY_PROMOTION_RULES: readonly MemoryPromotionRule[] = [
  {
    sourceEvent: "client.accepted",
    targetType: "lexos_client",
    retention: "persistent",
    scope: "tenant",
  },
  {
    sourceEvent: "intake.processed",
    targetType: "lexos_matter",
    retention: "persistent",
    scope: "tenant",
  },
  {
    sourceEvent: "story.created",
    targetType: "lexos_case_story",
    retention: "matter_bound",
    scope: "matter",
  },
  {
    sourceEvent: "assertions.extracted",
    targetType: "lexos_assertion_bundle",
    retention: "matter_bound",
    scope: "matter",
  },
  {
    sourceEvent: "strategy.developed",
    targetType: "lexos_strategy",
    retention: "matter_bound",
    scope: "matter",
  },
  {
    sourceEvent: "research.performed",
    targetType: "lexos_research",
    retention: "matter_bound",
    scope: "matter",
  },
  {
    sourceEvent: "argument.drafted",
    targetType: "lexos_argument",
    retention: "matter_bound",
    scope: "matter",
  },
  {
    sourceEvent: "output.refined",
    targetType: "lexos_output",
    retention: "persistent",
    scope: "matter",
  },
] as const;

/**
 * Given an audit event, return the memory object type it should be promoted to,
 * or null if the event does not trigger promotion.
 */
export function getPromotionTarget(
  event: Pick<AuditEvent, "action">,
): MemoryPromotionRule | null {
  return (
    LEXOS_MEMORY_PROMOTION_RULES.find(
      (rule) => rule.sourceEvent === event.action,
    ) ?? null
  );
}

/**
 * Returns all audit actions that trigger memory promotion for LEXOS.
 */
export function getPromotionTriggerActions(): readonly AuditAction[] {
  return LEXOS_MEMORY_PROMOTION_RULES.map((rule) => rule.sourceEvent);
}
