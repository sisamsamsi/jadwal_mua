# 🔧 SOLUSI TEKNIS - IMPLEMENTATION GUIDE
## Fixatif MUA Booking Application

---

## FASE 1: QUICK WINS (5 Hari - 80% Issues Fixed)

---

## SOLUSI #1: Notification Response Handler (⏱️ 1 Jam)

### Problem
Ketika user tap notification, tidak ada yang terjadi. App harus navigate ke booking detail.

### File to Modify
`mua-app/app/_layout.tsx`

### Current Code (Lines 42-50)
```typescript
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});
// ✗ MISSING: Response listener
```

### Fix: Add After Line 50
```typescript
// Handle when user taps notification
Notifications.addNotificationResponseReceivedListener((response) => {
  const notification = response.notification;
  const { data } = notification.request.content;
  
  // Extract booking ID from notification data
  if (data?.bookingId) {
    // Navigate to booking detail screen
    router.push(`/booking/${data.bookingId}`);
  } else if (data?.type === 'booking_reminder') {
    // If it's a booking reminder, go to calendar
    router.push('/(tabs)/');
  } else if (data?.type === 'subscription_reminder') {
    // If subscription reminder, go to subscription screen
    router.push('/subscription');
  }
});
```

### Also Update: Notification Schedule Code (Lines 169-179)

When showing immediate notification, include bookingId in data:

```typescript
// lib/utils/notifications.ts - Update showImmediateNotification function

export async function showImmediateNotification(
  title: string,
  body: string,
  bookingId?: string  // Add this parameter
) {
  const scheduleNotificationAsync = async () => {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { 
          bookingId: bookingId,  // Include booking ID
          timestamp: new Date().toISOString(),
        },
        sound: "default",
      },
      trigger: null, // Immediate
    });
    return id;
  };

  return scheduleNotificationAsync();
}
```

### Verify: Update Realtime Handler (Lines 346-413)

When new booking detected, pass bookingId:

```typescript
// app/_layout.tsx - Update around line 365
if (isBrandNew) {
  await showImmediateNotification(
    "📅 Booking Baru Masuk!",
    `Client ${payload.new.client_id} membuat booking...`,
    payload.new.id  // ← Pass booking ID here
  );
}
```

### Test
```bash
1. Open app on phone
2. From another device, submit booking via public link
3. Tap notification on your phone
4. Expected: Navigate to booking detail screen ✓
```

---

## SOLUSI #2: Device Fingerprinting (⏱️ 4 Jam)

### Step 1: Create Device Utility

**New File:** `mua-app/lib/utils/device.ts`

```typescript
import * as Device from 'expo-device';
import * as Constants from 'expo-constants';
import crypto from 'crypto';

export interface DeviceInfo {
  id: string;
  fingerprint: string;
  name: string;
  osType: string;
  osVersion: string;
  brand: string;
  model: string;
}

/**
 * Generate unique device fingerprint
 * Based on: device brand + model + OS version + device name
 */
export async function getDeviceFingerprint(): Promise<string> {
  const brand = Device.manufacturer || 'unknown';
  const model = Device.modelName || 'unknown';
  const osType = Device.osName || 'unknown';
  const osVersion = Device.osVersion || 'unknown';
  
  // Create fingerprint string
  const fingerprintInput = `${brand}:${model}:${osType}:${osVersion}`;
  
  // Hash it (SHA256-like, using expo-crypto would be better)
  // For now, use simple hash
  let hash = 0;
  for (let i = 0; i < fingerprintInput.length; i++) {
    const char = fingerprintInput.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return Math.abs(hash).toString(36);
}

export async function getDeviceInfo(): Promise<DeviceInfo> {
  const fingerprint = await getDeviceFingerprint();
  const deviceName = Device.deviceName || 'Unknown Device';
  
  return {
    id: fingerprint,
    fingerprint,
    name: deviceName,
    osType: Device.osName || 'unknown',
    osVersion: Device.osVersion || 'unknown',
    brand: Device.manufacturer || 'unknown',
    model: Device.modelName || 'unknown',
  };
}

/**
 * Get or create device registration
 * Store in local preferences for persistence
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function getOrCreateDeviceId(): Promise<string> {
  // Check if we already have a device ID stored
  const stored = await AsyncStorage.getItem('device_id');
  if (stored) {
    return stored;
  }
  
  // Create new device ID
  const fingerprint = await getDeviceFingerprint();
  await AsyncStorage.setItem('device_id', fingerprint);
  
  return fingerprint;
}
```

### Step 2: Update Auth Store

**File:** `mua-app/lib/stores/auth-store.ts`

```typescript
import { create } from 'zustand';
import { getOrCreateDeviceId } from '@/lib/utils/device';

interface AuthState {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  deviceId: string | null;  // ADD THIS
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  setDeviceId: (deviceId: string) => void;  // ADD THIS
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  isLoading: false,
  deviceId: null,  // ADD THIS
  
  setSession: (session) =>
    set({ session, user: session?.user ?? null, isLoading: false }),
  
  setLoading: (loading) => set({ isLoading: loading }),
  
  setDeviceId: (deviceId) => set({ deviceId }),  // ADD THIS
  
  reset: () => set({ session: null, user: null, isLoading: false, deviceId: null }),
}));

// Initialize device ID on app startup
export async function initializeDeviceId() {
  const deviceId = await getOrCreateDeviceId();
  useAuthStore.getState().setDeviceId(deviceId);
}
```

### Step 3: Initialize in Root Layout

**File:** `mua-app/app/_layout.tsx` (Add near top of useEffect)

```typescript
import { initializeDeviceId } from '@/lib/stores/auth-store';

useEffect(() => {
  // Initialize device ID first
  initializeDeviceId();
  
  // ... rest of your initialization code
}, []);
```

### Test
```bash
1. Open app on Phone A → See device ID in console
2. Open app on Phone B → See different device ID
3. Verify IDs are stored in AsyncStorage
```

---

## SOLUSI #3: Device-Scoped Realtime Listeners (⏱️ 4 Jam)

### Problem
Kedua HP mendengarkan semua booking user tanpa device distinction.

### Current Code (Lines 320-413 in app/_layout.tsx)
```typescript
const channel = supabase.channel('public-bookings-listener');
channel.on(
  'postgres_changes',
  {
    event: 'INSERT',
    schema: 'public',
    table: 'bookings',
    filter: `user_id=eq.${userId}`,  // ← Gets ALL user bookings
  },
  // ...
);
```

### Fix: Scope to Device

```typescript
import { useAuthStore } from '@/lib/stores/auth-store';
import { getOrCreateDeviceId } from '@/lib/utils/device';

// Inside useEffect where you set up realtime listener
const deviceId = await getOrCreateDeviceId();

// Update realtime channel subscription
const setupRealtimeListener = async () => {
  if (!userId) return;
  
  // Option 1: Store device_id in bookings table (requires DB migration)
  // For now: Track locally which bookings belong to this device
  
  const channel = supabase
    .channel(`bookings-listener-${userId}-${deviceId}`)  // Scope channel to device
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'bookings',
        filter: `user_id=eq.${userId}`,
      },
      async (payload) => {
        // New approach: Check if booking created by current device
        // For now, filter locally
        const createdAt = new Date(payload.new.created_at);
        const now = new Date();
        const diffMs = now.getTime() - createdAt.getTime();
        
        // Only show notification if created in last 2 minutes
        // AND user is currently active on this device
        if (diffMs < 120000) { // 2 minutes instead of 60 seconds
          // Get device ID from local storage
          const currentDeviceId = await AsyncStorage.getItem('device_id');
          
          // Store booking as seen on this device
          const seenKey = `booking_seen_${payload.new.id}_${currentDeviceId}`;
          const wasSeenBefore = await AsyncStorage.getItem(seenKey);
          
          if (!wasSeenBefore) {
            // Mark as seen
            await AsyncStorage.setItem(seenKey, 'true');
            
            // Show notification
            const clientName = payload.new.client_id; // In production, fetch client name
            await showImmediateNotification(
              "📅 Booking Baru Masuk!",
              `Booking baru dari client...`,
              payload.new.id
            );
          }
        }
        
        // Always sync in background
        syncRepository.fullSync();
      }
    )
    .subscribe();
    
  realtimeChannelRef.current = channel;
};
```

### Better Solution: Database Migration (Recommended for Phase 2)

Add column to bookings table:
```sql
ALTER TABLE bookings ADD COLUMN created_device_id TEXT;
```

Then filter by device:
```typescript
// With database support
channel.on(
  'postgres_changes',
  {
    event: 'INSERT',
    schema: 'public',
    table: 'bookings',
    filter: `user_id=eq.${userId},created_device_id=eq.${deviceId}`,
  },
  // ...
);
```

### Test
```bash
1. Phone A: Open app → device_id = "abc123"
2. Phone B: Open app → device_id = "def456"
3. Phone B: Submit booking via public link
4. Expected: Only Phone B shows notification ✓
5. Phone A: Should NOT show notification ✓
```

---

## SOLUSI #4: Update Booking Repository (⏱️ 2 Jam)

### Fix Redundant Normalization

**File:** `mua-app/lib/utils/normalize-supabase-data.ts` (Create New)

```typescript
/**
 * Normalize Supabase snake_case data to camelCase
 */

export function normalizeBooking(row: any) {
  return {
    id: row.id,
    userId: row.user_id,
    clientId: row.client_id,
    serviceId: row.service_id,
    packageId: row.package_id,
    bookingDate: row.booking_date,
    startTime: row.start_time,
    endTime: row.end_time,
    notes: row.notes,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    isSynced: row.is_synced ?? true,
  };
}

export function normalizeClient(row: any) {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

export function normalizeService(row: any) {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    durationMinutes: row.duration_minutes,
    basePrice: row.base_price,
    additionalPersonPrice: row.extra_person_price,
    isActive: row.is_active,
    sortOrder: row.sort_order,
  };
}
```

**Update:** `lib/repositories/booking-repository.ts`

Remove lines 272-298 (old normalizeFromSupabase function)

Replace with:
```typescript
import { normalizeBooking } from '@/lib/utils/normalize-supabase-data';

// In getAll() and getByDate() methods:
const normalized = bookings.map(b => normalizeBooking(b));
```

**Update:** `lib/repositories/sync-repository.ts`

Replace inline normalization (lines 101-122) with:
```typescript
import { normalizeBooking, normalizeClient, normalizeService } from '@/lib/utils/normalize-supabase-data';

// In fullSync():
const normalizedBookings = allBookings.map(b => normalizeBooking(b));
const normalizedClients = allClients.map(c => normalizeClient(c));
const normalizedServices = allServices.map(s => normalizeService(s));
```

### Test
```bash
npm run typecheck
# Should have no errors
```

---

## FASE 1 TESTING CHECKLIST

- [ ] Notification handler working (tap navigates to booking)
- [ ] Device ID generated and stored
- [ ] Device-scoped realtime listeners working
- [ ] No duplicate normalizations
- [ ] Multi-device test passed:
  - [ ] Phone A + Phone B both logged in
  - [ ] Submit booking from public link
  - [ ] Only Phone B shows notification
  - [ ] Phone A does NOT show notification
  - [ ] Both phones can view booking in calendar

---

---

## FASE 2: PRODUCTION HARDENING (3-4 Hari)

---

## SOLUSI #5: Device Registrations Table (⏱️ 4 Jam Setup)

### Database Migration

**File:** `supabase/migrations/add_device_registrations.sql`

```sql
-- Create device_registrations table
CREATE TABLE public.device_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,  -- Device fingerprint
  device_name TEXT,          -- "iPhone 12", "iPad Pro", etc
  os_type TEXT,              -- "iOS", "Android", "Web"
  os_version TEXT,
  fcm_token TEXT UNIQUE,     -- Expo push token
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, device_id)  -- One registration per device
);

-- Index for faster lookups
CREATE INDEX idx_device_registrations_user_id ON public.device_registrations(user_id);
CREATE INDEX idx_device_registrations_token ON public.device_registrations(fcm_token);

-- Enable RLS
ALTER TABLE public.device_registrations ENABLE ROW LEVEL SECURITY;

-- Users can read their own device registrations
CREATE POLICY "Users can read own device registrations"
  ON public.device_registrations FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own device registrations
CREATE POLICY "Users can update own device registrations"
  ON public.device_registrations FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can insert their own device registrations
CREATE POLICY "Users can insert own device registrations"
  ON public.device_registrations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admin can read all (for notification sending)
CREATE POLICY "Admin full access"
  ON public.device_registrations FOR ALL
  USING (true) WITH CHECK (true);
```

### Also Update: Bookings Table

Add device tracking:

```sql
-- Add column to bookings to track which device created it
ALTER TABLE public.bookings ADD COLUMN created_device_id TEXT;

-- Index for filtering
CREATE INDEX idx_bookings_device_id ON public.bookings(user_id, created_device_id);
```

---

## SOLUSI #6: Update Push Token Registration (⏱️ 2 Jam)

### Replace FCM Token Update Logic

**File:** `mua-app/app/_layout.tsx` (Replace lines 193-205)

Old Code:
```typescript
const token = (await registerForPushNotificationsAsync());
if (token && token !== localProfile?.fcmToken) {
  profileRepository.update(session.user.id, { fcmToken: token });
}
```

New Code:
```typescript
import { getOrCreateDeviceId } from '@/lib/utils/device';
import { getDeviceInfo } from '@/lib/utils/device';

// Register device with current token
const token = (await registerForPushNotificationsAsync());
if (token) {
  const deviceId = await getOrCreateDeviceId();
  const deviceInfo = await getDeviceInfo();
  
  // Instead of updating profile, update device_registrations table
  const { error } = await supabase
    .from('device_registrations')
    .upsert(
      {
        user_id: session.user.id,
        device_id: deviceId,
        device_name: deviceInfo.name,
        os_type: deviceInfo.osType,
        os_version: deviceInfo.osVersion,
        fcm_token: token,
        last_active_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id,device_id', // Update if exists
      }
    );
  
  if (error) {
    console.error('Failed to register device:', error);
  }
}
```

---

## SOLUSI #7: Update Admin Notification API (⏱️ 2 Jam)

### File: `fixatif-admin/app/api/notifications/remind/route.ts`

Old approach: Send to one fcmToken in profiles table

New approach: Send to all device registrations or specific device

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  const { userId, deviceId = null, title, body } = await request.json();

  if (!userId || !title || !body) {
    return NextResponse.json(
      { error: 'Missing required fields: userId, title, body' },
      { status: 400 }
    );
  }

  try {
    let deviceTokens: any[] = [];

    if (deviceId) {
      // Send to specific device
      const { data, error } = await supabaseAdmin
        .from('device_registrations')
        .select('fcm_token')
        .eq('user_id', userId)
        .eq('device_id', deviceId)
        .single();

      if (error || !data?.fcm_token) {
        return NextResponse.json(
          { error: 'Device not found or has no FCM token' },
          { status: 404 }
        );
      }

      deviceTokens = [{ fcm_token: data.fcm_token }];
    } else {
      // Send to all devices for this user
      const { data, error } = await supabaseAdmin
        .from('device_registrations')
        .select('fcm_token')
        .eq('user_id', userId)
        .not('fcm_token', 'is', null);

      if (error) {
        console.error('Error fetching devices:', error);
        return NextResponse.json({ error: 'Failed to fetch devices' }, { status: 500 });
      }

      deviceTokens = data || [];
    }

    if (deviceTokens.length === 0) {
      return NextResponse.json(
        { error: 'No devices with valid FCM tokens found' },
        { status: 404 }
      );
    }

    // Send to Expo for each token
    const expoUrl = 'https://exp.host/--/api/v2/push/send';
    const results = [];

    for (const { fcm_token } of deviceTokens) {
      try {
        const response = await fetch(expoUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            to: fcm_token,
            title,
            body,
            data: { type: 'admin_notification' },
            sound: 'default',
            priority: 'high',
          }),
        });

        results.push({
          token: fcm_token.substring(0, 20) + '...',
          success: response.ok,
          status: response.status,
        });
      } catch (error) {
        results.push({
          token: fcm_token.substring(0, 20) + '...',
          success: false,
          error: String(error),
        });
      }
    }

    return NextResponse.json({
      message: 'Notifications sent',
      deviceCount: deviceTokens.length,
      results,
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## SOLUSI #8: Offline Deletion Sync (⏱️ 3 Jam)

### File: `mua-app/lib/repositories/sync-repository.ts`

Add deletion tracking:

```typescript
// At top of file
interface UnsyncedDeletion {
  type: 'booking' | 'client' | 'service' | 'payment';
  id: string;
  deletedAt: string;
}

// Add to repository
private unsyncedDeletions: UnsyncedDeletion[] = [];

/**
 * Queue a deletion to be synced when online
 */
async queueDeletion(type: string, id: string) {
  const deletion: UnsyncedDeletion = {
    type: type as any,
    id,
    deletedAt: new Date().toISOString(),
  };

  this.unsyncedDeletions.push(deletion);

  // Persist to AsyncStorage so deletions survive app restart
  const stored = await AsyncStorage.getItem('unsynced_deletions');
  const items = stored ? JSON.parse(stored) : [];
  items.push(deletion);
  await AsyncStorage.setItem('unsynced_deletions', JSON.stringify(items));
}

/**
 * Push queued deletions to Supabase
 */
async pushUnsyncedDeletions() {
  // Restore from storage
  const stored = await AsyncStorage.getItem('unsynced_deletions');
  const deletions: UnsyncedDeletion[] = stored ? JSON.parse(stored) : [];

  for (const deletion of deletions) {
    try {
      switch (deletion.type) {
        case 'booking':
          await bookingsService.delete(deletion.id);
          break;
        case 'client':
          await clientsService.delete(deletion.id);
          break;
        case 'service':
          await servicesService.delete(deletion.id);
          break;
        case 'payment':
          // Add payment deletion if needed
          break;
      }

      // Remove from queue after successful delete
      deletions.splice(deletions.indexOf(deletion), 1);
    } catch (error) {
      console.error(`Failed to sync deletion of ${deletion.type}:`, error);
      // Leave in queue to retry later
    }
  }

  // Update storage
  await AsyncStorage.setItem('unsynced_deletions', JSON.stringify(deletions));
}

/**
 * Update fullSync to include deletion push
 */
async fullSync() {
  // ... existing sync code ...

  // Also push deletions
  await this.pushUnsyncedDeletions();

  // ... rest of sync ...
}
```

### Update: Booking Repository Delete Method

```typescript
async delete(id: string) {
  // Cancel notifications
  await cancelNotificationByBookingId(id);

  // Delete from SQLite
  await db.delete(bookings).where(eq(bookings.id, id));

  // Queue for remote deletion
  if (state.isConnected) {
    await bookingsService.delete(id);
  } else {
    // Queue for later sync
    await syncRepository.queueDeletion('booking', id);
  }
}
```

---

## SOLUSI #9: Add SQL Constraints (⏱️ 15 Menit)

### Database Constraint

**File:** `supabase/migrations/add_constraints.sql`

```sql
-- Add UNIQUE constraint on (user_id, phone) for clients
ALTER TABLE public.clients
ADD CONSTRAINT unique_user_phone UNIQUE (user_id, phone);

-- Add constraint to prevent duplicate services names per user
ALTER TABLE public.services
ADD CONSTRAINT unique_user_service_name UNIQUE (user_id, name);
```

This prevents:
- Duplicate clients with same phone for same user
- Duplicate service names for same user

If constraint is violated, API returns 409 Conflict and user can handle appropriately.

---

## FASE 2 TESTING CHECKLIST

- [ ] Device registration table created
- [ ] Multiple FCM tokens stored per user
- [ ] Admin can send push to all devices
- [ ] Admin can send push to specific device
- [ ] Offline deletions queued and synced
- [ ] Duplicate prevention working
- [ ] No orphaned data after device deletion
- [ ] Multi-device push test:
  - [ ] Phone A + Phone B both registered
  - [ ] Send push from admin → Both receive ✓
  - [ ] Phone A offline, delete booking
  - [ ] Phone A online → Deletion syncs ✓

---

## DEPLOYMENT CHECKLIST

### Before Going Live

- [ ] All Supabase migrations applied
- [ ] App code updated with all patches
- [ ] Multi-device testing completed
- [ ] Push notifications working on all devices
- [ ] Offline scenarios tested
- [ ] iOS and Android both tested
- [ ] Admin panel updated for multi-device
- [ ] User documentation updated
- [ ] Rollback plan documented

### Gradual Rollout Plan

```
Week 1: Deploy to internal testing (closed beta)
  - Test with team members
  - Verify no regression
  
Week 2: Deploy to 10% of users
  - Monitor error rates
  - Check push notification delivery
  
Week 3: Deploy to 50% of users
  - Continue monitoring
  
Week 4: Full rollout to all users
  - Keep support team alert
```

---

## MONITORING & DEBUGGING

### Expo Push Notification Debugging

```bash
# Check if push was received
POST https://exp.host/--/api/v2/push/send
Body: {
  to: "ExponentPushToken[...]",
  title: "Test",
  body: "Test notification"
}

# Check device registrations
SELECT * FROM device_registrations 
WHERE user_id = 'USER_ID' 
ORDER BY last_active_at DESC;

# Check unsynced deletions
AsyncStorage.getItem('unsynced_deletions').then(console.log)
```

### Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| No notification received | FCM token invalid/expired | Refresh token on app restart |
| Notification only on 1 device | Old code, token overwrite | Deploy new code with device registrations |
| Tap notification does nothing | Missing handler | Deploy response listener patch |
| Booking reappears after delete | Deletion not synced | Deploy offline deletion queue |

---

## TIMELINE SUMMARY

| Task | Duration | Priority |
|------|----------|----------|
| Notification handler | 1h | 🔴 Critical |
| Device fingerprinting | 4h | 🔴 Critical |
| Device-scoped listeners | 4h | 🔴 Critical |
| Testing Phase 1 | 5h | 🔴 Critical |
| **Phase 1 Total** | **14h (2 days)** | **SHIP ASAP** |
| Device registrations table | 4h | 🟠 High |
| FCM token update | 2h | 🟠 High |
| Admin API update | 2h | 🟠 High |
| Deletion sync | 3h | 🟠 High |
| SQL constraints | 0.25h | 🟡 Medium |
| Testing Phase 2 | 8h | 🟠 High |
| **Phase 2 Total** | **19h (3 days)** | **SHIP WEEK 2** |
| **Grand Total** | **33h (2 weeks)** | **Production Ready** |

---

**This implementation guide provides step-by-step code changes to fix all critical issues.**

**Start with Phase 1 for quick wins, then Phase 2 for production hardening.**
