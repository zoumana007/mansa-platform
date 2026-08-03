import assert from "node:assert/strict";
import test from "node:test";

import { evaluateScreening } from "./screening.js";

test("retourne CLEAR sans correspondance active pertinente", () => {
  assert.deepEqual(
    evaluateScreening({
      entityId: "customer-1",
      entityType: "PERSON",
      reviewThreshold: 70,
      blockThreshold: 90,
      matches: [
        {
          id: "inactive-sanction",
          list: "SANCTIONS",
          score: 100,
          sourceReference: "provider:inactive",
          active: false,
        },
        {
          id: "weak-media",
          list: "ADVERSE_MEDIA",
          score: 40,
          sourceReference: "provider:media",
          active: true,
        },
      ],
    }),
    {
      outcome: "CLEAR",
      reason: "NO_RELEVANT_MATCH",
      matchedIds: [],
    },
  );
});

test("demande une revue manuelle pour une correspondance intermédiaire", () => {
  assert.deepEqual(
    evaluateScreening({
      entityId: "customer-2",
      entityType: "PERSON",
      reviewThreshold: 70,
      blockThreshold: 90,
      matches: [
        {
          id: "pep-1",
          list: "PEP",
          score: 82,
          sourceReference: "provider:pep",
          active: true,
        },
      ],
    }),
    {
      outcome: "REVIEW",
      reason: "MANUAL_REVIEW_REQUIRED",
      matchedIds: ["pep-1"],
    },
  );
});

test("bloque immédiatement les sanctions et listes internes", () => {
  assert.deepEqual(
    evaluateScreening({
      entityId: "organization-1",
      entityType: "ORGANIZATION",
      reviewThreshold: 70,
      blockThreshold: 90,
      matches: [
        {
          id: "sanction-1",
          list: "SANCTIONS",
          score: 65,
          sourceReference: "provider:sanctions",
          active: true,
        },
        {
          id: "internal-1",
          list: "INTERNAL_BLOCKLIST",
          score: 30,
          sourceReference: "mansa:blocklist",
          active: true,
        },
      ],
    }),
    {
      outcome: "BLOCK",
      reason: "BLOCKING_MATCH",
      matchedIds: ["sanction-1", "internal-1"],
    },
  );
});

test("rejette les seuils incohérents", () => {
  assert.throws(
    () =>
      evaluateScreening({
        entityId: "customer-3",
        entityType: "PERSON",
        reviewThreshold: 95,
        blockThreshold: 80,
        matches: [],
      }),
    RangeError,
  );
});
