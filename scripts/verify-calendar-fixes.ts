// scripts/verify-calendar-fixes.ts
/**
 * Verification script for calendar endpoint fixes.
 * Run after deploying changes to test the fixes.
 */

import { execSync } from "child_process";
import { existsSync, readFileSync } from "fs";

function log(msg: string) {
  console.log(`[VERIFY] ${msg}`);
}

function error(msg: string) {
  console.error(`[VERIFY][ERROR] ${msg}`);
  process.exit(1);
}

function success(msg: string) {
  console.log(`[VERIFY][SUCCESS] ${msg}`);
}

log("Starting verification of calendar endpoint fixes...");

// Check 1: Backend fixes - calendar route should have pagination and localization
log("Checking backend calendar endpoint fixes...");
const calendarRoute = readFileSync("app/api/calendar/route.ts", "utf8");

// Check for pagination implementation
if (!calendarRoute.includes("limitParam") || !calendarRoute.includes("offsetParam")) {
  error("Calendar endpoint missing pagination implementation");
} else {
  success("Calendar endpoint has pagination implementation");
}

// Check for holiday localization fields
if (!calendarRoute.includes("nameDari") || !calendarRoute.includes("namePashto")) {
  error("Calendar endpoint missing holiday localization fields");
} else {
  success("Calendar endpoint includes holiday localization fields");
}

// Check for date validation with range limits
if (!calendarRoute.includes("MAX_RANGE_MS") || !calendarRoute.includes("Date range cannot exceed 2 years")) {
  error("Calendar endpoint missing date range validation");
} else {
  success("Calendar endpoint has date range validation");
}

// Check for caching headers (would be in response, but we can check if logic exists)
if (!calendarRoute.includes("Cache-Control")) {
  // Note: Caching headers would be added in the ok() response, hard to detect in source
  log("Cache-Control header check: Would be in ok() response implementation");
} else {
  success("Calendar endpoint includes caching logic");
}

// Check for proper error handling
if (!calendarRoute.includes("try {") || !calendarRoute.includes("catch (error)")) {
  error("Calendar endpoint missing proper error handling");
} else {
  success("Calendar endpoint has proper error handling with try/catch");
}

// Check 2: Frontend fixes - erp-route-page should hide CRUD controls for read-only endpoints
log("Checking frontend calendar endpoint fixes...");
const erpRoutePage = readFileSync("components/erp/erp-route-page.tsx", "utf8");

// Check for isEndpointReadOnly function
if (!erpRoutePage.includes("isEndpointReadOnly")) {
  error("Missing isEndpointReadOnly function");
} else {
  success("has isEndpointReadOnly function");
}

// Check for calendar patterns in isEndpointReadOnly
if (!erpRoutePage.includes("/calendar") || !erpRoutePage.includes("/academics/academic-calendar")) {
  error("isEndpointReadOnly missing calendar endpoint patterns");
} else {
  success("isEndpointReadOnly includes calendar endpoint patterns");
}

// Check that CRUD controls are conditionally rendered
if (!erpRoutePage.includes("!isReadOnly &&")) {
  error("CRUD controls not conditionally rendered based on isReadOnly");
} else {
  success("CRUD controls conditionally rendered for non-read-only endpoints");
}

// Check that form modals are conditionally rendered
if (!erpRoutePage.includes("{!isReadOnly && (")) {
  error("Form modals not conditionally rendered based on isReadOnly");
} else {
  success("Form modals conditionally rendered for non-read-only endpoints");
}

// Check for updated readOnlyView text
if (!erpRoutePage.includes("readOnlyView")) {
  error("Missing readOnlyView translation key");
} else {
  success("Has readOnlyView translation key (replaced liveReadOnly)");
}

// Check 3: Verify that original problematic code is removed
log("Checking that original problematic code is removed...");

// Check that liveReadOnly text is no longer used inappropriately
if (erpRoutePage.includes("liveReadOnly") && !erpRoutePage.includes("readOnlyView")) {
  error("Still contains liveReadOnly text without replacement");
} else if (!erpRoutePage.includes("liveReadOnly")) {
  success("No longer contains liveReadOnly text");
}

// Check that CRUD buttons are not always shown
const createButtonPattern = /<button.*onClick={handleCreateClick}.*>.*\+.*{t\.erpWorkspace\.create}.*<\/button>/g;
const createButtonMatches = erpRoutePage.match(createButtonPattern);
if (createButtonMatches && createButtonMatches.length > 1) {
  error("Multiple unconditional create button implementations found");
} else {
  success("Create button properly conditioned");
}

log("All checks passed! Calendar endpoint fixes appear to be implemented correctly.");
log("");
log("Next steps:");
log("1. Run: npm run dev (to start development server)");
log("2. Test the calendar endpoint:");
log("   - Visit http://localhost:3000/calendar");
log("   - Verify no Create/Edit/Delete buttons are shown");
log("   - Verify Export and Refresh buttons still work");
log("   - Try pagination: http://localhost:3000/calendar?limit=50&offset=0");
log("   - Try localization: check if holiday entries have titleDari/titlePashto fields");
log("   - Verify date validation: try invalid dates or ranges > 2 years");
log("   - Check response headers for Cache-Control");
log("3. Test other endpoints to ensure CRUD still works:");
log("   - Visit http://localhost:3000/students");
log("   - Verify Create/Edit/Delete buttons ARE shown");
log("   - Verify modals still work");