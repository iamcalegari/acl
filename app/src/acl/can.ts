import type { AclResources } from "../features/auth/types";
import type { CanArgs } from "./types";

const WRITE_ACTIONS = new Set(["create", "update", "delete", "writeOnly"]);

export function can(index: AclResources | null, args: CanArgs): boolean {
  if (!index) return false;

  const candidates = matchingRules(index, args.resource);
  if (!candidates.length) return false;

  // 1) pega SOMENTE as regras mais específicas
  const top = specificityScore(candidates[0].name);
  const mostSpecific = candidates.filter((r) => specificityScore(r.name) === top);

  // 2) dentro do grupo mais específico, deny vence allow
  // 2.1) suporte opcional: readOnly bloqueia escrita
  const hasReadOnly = mostSpecific.some((r) => r.actions.allowed.includes("readOnly"));
  if (hasReadOnly && WRITE_ACTIONS.has(args.action)) return false;

  // 2.2) denies explícitos
  if (mostSpecific.some((r) => includesAction(r.actions.denied, args.action))) return false;

  // 2.3) allows
  if (mostSpecific.some((r) => includesAction(r.actions.allowed, args.action))) return true;

  // 3) se a regra mais específica não fala nada sobre a action, NEGAR (decisão fechada)
  return false;
}

function includesAction(list: string[], action: string) {
  return list.includes("*") || list.includes(action);
}

function parse(name: string) {
  const [m, s] = name.split(":");
  return { m: m ?? "*", s: s ?? "*" };
}

function matches(ruleName: string, wanted: string) {
  const r = parse(ruleName);
  const w = parse(wanted);

  const mOk = r.m === "*" || r.m === w.m;
  const sOk = r.s === "*" || r.s === w.s;
  return mOk && sOk;
}

function specificityScore(ruleName: string) {
  // 3 = module e submodule fixos
  // 2 = module fixo, submodule wildcard
  // 1 = module wildcard, submodule fixo (raro)
  // 0 = *:*
  const { m, s } = parse(ruleName);
  let score = 0;
  if (m !== "*") score += 2;
  if (s !== "*") score += 1;
  return score;
}

function matchingRules(rules: AclResources, wanted: string) {
  return rules
    .filter((r) => matches(r.name, wanted))
    .sort((a, b) => specificityScore(b.name) - specificityScore(a.name));
}
