import assert from "node:assert/strict";
import test from "node:test";

import {
  DASHBOARD_ALERT_SEVERITIES,
  DASHBOARD_WIDGET_SIZES,
  DASHBOARD_WIDGET_TYPES,
  QUICK_ACTION_TYPES,
  isDashboardAlertSeverity,
  isDashboardWidgetSize,
  isDashboardWidgetType,
  isQuickActionType,
} from "../dist/dashboard.js";

test("reconnaît les types de widgets du tableau de bord", () => {
  for (const type of DASHBOARD_WIDGET_TYPES) {
    assert.equal(isDashboardWidgetType(type), true);
  }

  assert.equal(isDashboardWidgetType("UNKNOWN"), false);
});

test("reconnaît les tailles de widgets et sévérités d'alerte", () => {
  for (const size of DASHBOARD_WIDGET_SIZES) {
    assert.equal(isDashboardWidgetSize(size), true);
  }

  for (const severity of DASHBOARD_ALERT_SEVERITIES) {
    assert.equal(isDashboardAlertSeverity(severity), true);
  }

  assert.equal(isDashboardWidgetSize("FULL_SCREEN"), false);
  assert.equal(isDashboardAlertSeverity("BLOCKER"), false);
});

test("reconnaît les actions rapides", () => {
  for (const type of QUICK_ACTION_TYPES) {
    assert.equal(isQuickActionType(type), true);
  }

  assert.equal(isQuickActionType("DELETE_ACCOUNT"), false);
});

test("les catalogues du tableau de bord restent sans doublon", () => {
  assert.equal(new Set(DASHBOARD_WIDGET_TYPES).size, DASHBOARD_WIDGET_TYPES.length);
  assert.equal(new Set(DASHBOARD_WIDGET_SIZES).size, DASHBOARD_WIDGET_SIZES.length);
  assert.equal(
    new Set(DASHBOARD_ALERT_SEVERITIES).size,
    DASHBOARD_ALERT_SEVERITIES.length,
  );
  assert.equal(new Set(QUICK_ACTION_TYPES).size, QUICK_ACTION_TYPES.length);
});
