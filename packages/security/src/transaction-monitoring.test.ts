import assert from "node:assert/strict";
import test from "node:test";

import { evaluateTransactionMonitoring } from "./transaction-monitoring.js";

test("autorise une transaction sans signal pertinent", () => {
  assert.deepEqual(
    evaluateTransactionMonitoring({
      transactionId: "txn-1",
      customerId: "customer-1",
      reviewThreshold: 60,
      blockThreshold: 90,
      signals: [
        {
          id: "signal-1",
          type: "UNUSUAL_AMOUNT",
          score: 20,
          active: true,
          sourceReference: "rule:amount",
        },
      ],
    }),
    {
      outcome: "ALLOW",
      reason: "NO_RELEVANT_SIGNAL",
      signalIds: [],
      aggregateScore: 20,
    },
  );
});

test("demande une revue lorsque plusieurs signaux faibles se cumulent", () => {
  assert.deepEqual(
    evaluateTransactionMonitoring({
      transactionId: "txn-2",
      customerId: "customer-2",
      reviewThreshold: 60,
      blockThreshold: 90,
      signals: [
        {
          id: "signal-1",
          type: "RAPID_MOVEMENT",
          score: 35,
          active: true,
          sourceReference: "rule:rapid",
        },
        {
          id: "signal-2",
          type: "MANY_BENEFICIARIES",
          score: 30,
          active: true,
          sourceReference: "rule:beneficiaries",
        },
      ],
    }),
    {
      outcome: "REVIEW",
      reason: "MANUAL_REVIEW_REQUIRED",
      signalIds: ["signal-1", "signal-2"],
      aggregateScore: 65,
    },
  );
});

test("bloque un signal obligatoire même sous le seuil global", () => {
  assert.deepEqual(
    evaluateTransactionMonitoring({
      transactionId: "txn-3",
      customerId: "customer-3",
      reviewThreshold: 60,
      blockThreshold: 90,
      mandatoryBlockSignals: ["HIGH_RISK_COUNTRY"],
      signals: [
        {
          id: "signal-country",
          type: "HIGH_RISK_COUNTRY",
          score: 40,
          active: true,
          sourceReference: "rule:country",
        },
      ],
    }),
    {
      outcome: "BLOCK",
      reason: "BLOCKING_RISK_SIGNAL",
      signalIds: ["signal-country"],
      aggregateScore: 40,
    },
  );
});

test("ignore les signaux inactifs et rejette les seuils incohérents", () => {
  assert.deepEqual(
    evaluateTransactionMonitoring({
      transactionId: "txn-4",
      customerId: "customer-4",
      reviewThreshold: 60,
      blockThreshold: 90,
      signals: [
        {
          id: "inactive",
          type: "STRUCTURING",
          score: 100,
          active: false,
          sourceReference: "rule:structuring",
        },
      ],
    }),
    {
      outcome: "ALLOW",
      reason: "NO_RELEVANT_SIGNAL",
      signalIds: [],
      aggregateScore: 0,
    },
  );

  assert.throws(
    () =>
      evaluateTransactionMonitoring({
        transactionId: "txn-5",
        customerId: "customer-5",
        reviewThreshold: 95,
        blockThreshold: 80,
        signals: [],
      }),
    RangeError,
  );
});
