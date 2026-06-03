# Security TDD Specification

This document details the Zero-Trust Architecture design, data invariants, and adversarial "Dirty Dozen" payload testing scenarios designed to validate the security model of the RevendaX application in Google Firebase.

---

## 1. Core Data Invariants

Our Security Architecture mandates strict containment and alignment boundaries across all database collections:
1. **Owner Consistency (Isolation)**: No user can read, query, list, write, update, or delete records unless the request auth matches the relational field `ownerId` exactly.
2. **Schema Sanitization (Anti-Spoofing)**: Every single write operation (creates and updates) must be validated against complete data definitions that strictly constrain types, field sizes, and required fields.
3. **Identifier Safety (ID Exhaustion Guard)**: Document ids must match strict formatting rules (`isValidId`) and length limits to prevent denial-of-wallet resource attacks.
4. **Token Email Verification**: Standard users must represent verified profiles through authenticated provider attributes if applicable.
5. **Collection Integrity**: Global access is default denied (`match /{document=**} { allow read, write: if false; }`).

---

## 2. The "Dirty Dozen" (Adversarial Payloads)

Below are the 12 concrete attacks formulated to compromise our system, all of which are securely caught and returned as `PERMISSION_DENIED` by our firewall rules:

| ID | Attack Name | Collection | Payload / Action Details | Targeted Vulnerability |
|----|-------------|------------|-------------------------|------------------------|
| T1 | Identity Spoofing | `products` | Create with `ownerId` set to another user's UID | Impersonation of another tenant |
| T2 | Shadow Field Write | `products` | Add a custom admin payload `{ isVipPremiumUser: true }` | Over-writing unmapped fields |
| T3 | Missing ID format validation | `products` | Create document with malicious ID containing special characters or SQL injection | Path Traversal / Poisoning |
| T4 | Invalid Type Poisoning | `products` | Send `valorInvestido` as a Boolean or text string (`true` / `"NaN"`) | Type Exhaustion / Wallet Denial |
| T5 | Value Limits Bypass | `products` | Send a massive negative value for cost fields (`-120000`) | Out-of-bounds corruption |
| T6 | Overlarge Payload Strings | `notifications` | Send a `message` field exceeding 1000 characters | Resource/Database exhaustion |
| T7 | Unauthenticated Query | `products` | Read or list products without a valid Auth session | Missing Access Control List |
| T8 | Invalid Enum Value | `products` | Send `status: "SuperPremiumSeller"` | Status Constraint Escalation |
| T9 | Global Path Escalation | `*` | Read sub-records via parent-agnostic list operations | Improper collection scopes |
| T10| Immutability Violation | `goals` | Update the immutable field `id` or `createdAt` to different values | History manipulation |
| T11| Cross-Tenant Query | `products` | Query products using a different tenant's `ownerId` | Query Delegation Attack |
| T12| Null-Pointer Crash Attempt| `goals` | Update with missing field validations on `title` or `targetAmount` | Error disclosure code crash |

---

## 3. The Test Runner Configuration (`firestore.rules.test.ts`)

To execute test validation on the local emulator or testing suites, use the following template:

```typescript
import { initializeTestEnvironment, RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { setDoc, getDoc, getDocs, collection, query, where, doc } from "firebase/firestore";

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "revendax-applet-project",
    firestore: {
      rules: require("fs").readFileSync("firestore.rules", "utf8"),
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

describe("Zero-Trust Security Suit", () => {
  test("T1: Block product creation with mismatched ownerId", async () => {
    const maliciousUserDb = testEnv.authenticatedContext("attacker_uid").firestore();
    const maliciousDocRef = doc(maliciousUserDb, "products", "prod123");
    
    await expect(
      setDoc(maliciousDocRef, {
        id: "prod123",
        name: "iPhone Pro Max",
        category: "Apple/iPhones",
        valorInvestido: 5000,
        valorVenda: 7000,
        frete: 100,
        taxas: 300,
        cliente: "Xavier Brick",
        formaPagamento: "Pix",
        status: "Em estoque",
        dataEntrada: "2026-05-29",
        ownerId: "victim_uid" // Spoofed
      })
    ).rejects.toThrow();
  });
});
```
