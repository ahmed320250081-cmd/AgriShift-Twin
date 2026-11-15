# Firestore Security Specification — Owainat AgriTwin

## 1. Data Invariants
1. **Identity Integrity**: Every user document `/users/{userId}` must have `uid == userId` and `uid == request.auth.uid` on self-creation. Non-admin users cannot self-assign `role: "farm_manager"`.
2. **PII Isolation**: User email addresses in `/users/{userId}` are readable only by the document owner or a verified `farm_manager`.
3. **RBAC Plot Governance**: `field_operator` accounts may only toggle `irrigating` and adjust `flowRateM3Hr` within the existing `sustainabilityCapM3Hr` bound; only `farm_manager` accounts may change `cropType`, `targetMoisturePct`, or `sustainabilityCapM3Hr`.
4. **Immutable Audit Logs**: Field logs in `/fieldLogs/{logId}` are append-only (`allow update, delete: if false` for operators; only `farm_manager` may delete erroneous logs), and `authorUid` must match `request.auth.uid`.
5. **Temporal Integrity**: All `createdAt` and `updatedAt` timestamps must equal `request.time`.

## 2. Adversarial "Dirty Dozen" Payloads (Expected: PERMISSION_DENIED)
1. **Privilege Escalation on Signup**: `POST /users/{uid}` with `{ role: "farm_manager" }` from unverified or non-bootstrapped account -> **DENIED**.
2. **Role Self-Promotion on Update**: `PATCH /users/{uid}` changing `role` from `"field_operator"` to `"farm_manager"` -> **DENIED**.
3. **Shadow Field Injection**: `POST /fieldLogs/{id}` including extra `"isAdmin": true` ghost key -> **DENIED** by `hasOnly`.
4. **Unverified Email Spoof**: Request with `email_verified: false` matching admin email -> **DENIED**.
5. **PII Blanket Read**: Operator attempting `get(/users/{otherUid})` -> **DENIED**.
6. **Unfiltered List Scraping**: Operator attempting `list(/users)` -> **DENIED**.
7. **Operator Changing Crop Type**: Operator attempting `PATCH /plots/P-01` with `cropType: "Wheat"` -> **DENIED** by `affectedKeys().hasOnly(...)`.
8. **Operator Exceeding Aquifer Cap**: Operator setting `flowRateM3Hr: 999` above `sustainabilityCapM3Hr: 260` -> **DENIED**.
9. **Author UID Spoofing**: Operator creating `/fieldLogs/{id}` with `authorUid: "other-uid"` -> **DENIED**.
10. **Forged Timestamp**: Client writing `updatedAt: "2020-01-01T00:00:00Z"` instead of server timestamp -> **DENIED** by `== request.time`.
11. **Resource Poisoning (1MB ID)**: Creating `/fieldLogs/<200-char-invalid-id>` -> **DENIED** by `isValidId()`.
12. **Operator Modifying Estate Aquifer Cap**: Operator writing to `/farmSettings/estate` -> **DENIED** (`isManager()` required).
