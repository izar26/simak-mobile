// ==========================================
// IMPLEMENTATION GUIDE FOR REMAINING SCREENS
// ==========================================

/\*\*

- This guide shows the pattern to apply to the remaining 13 screens:
- 1.  LoginScreen.tsx
- 2.  BerkasScreen.tsx
- 3.  EditProfileScreen.tsx
- 4.  HomeScreen.tsx
- 5.  ScheduleScreen.tsx
- 6.  StudentCardScreen.tsx
- 7.  AcademicScreen.tsx
- 8.  UnduhanScreen.tsx
- 9.  KeuanganScreen.tsx
- 10. PelanggaranScreen.tsx
- 11. NotificationScreen.tsx
- 12. AnnouncementsScreen.tsx
- 13. AnnouncementDetailScreen.tsx (✅ DONE)
- 14. NewsScreen.tsx (✅ DONE)
      \*/

// ==========================================
// STEP 1: IMPORTS (Template)
// ==========================================
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MAIN_APP_URL } from '@env';

// ✅ NEW: Type imports
import { UserData, NewsItem, BerkasItem } from '../../types'; // Import relevant types

// ✅ NEW: Utility imports
import { buildStorageUrl, sanitizeHtml, validateInput } from '../../utils/validation';
import { handleApiError, logError, withRetry } from '../../utils/errorHandler';
import { logger } from '../../utils/logger';

// ✅ NEW: Custom hooks
import { useFetchWithCache } from '../../hooks/useApi';

// ==========================================
// STEP 2: VALIDATE ROUTE PARAMS (Template)
// ==========================================
const MyScreen = ({ navigation, route }: any) => {
// ✅ NEW: Properly typed route params
const { item, user } = route.params as { item?: BerkasItem; user?: UserData };

// ✅ NEW: Validate on mount
if (!item || !item.id) {
logger.error('MyScreen', 'Invalid route params', route.params);
return (
<SafeAreaView className="flex-1 items-center justify-center">
<Text className="text-red-600 font-bold">Data tidak valid</Text>
</SafeAreaView>
);
}

return null; // Continue with screen content
};

// ==========================================
// STEP 3: REPLACE IMAGE URLS (Pattern)
// ==========================================

// ❌ OLD: Unsafe URL
// const imageUrl = item.image ? `${MAIN_APP_URL}/storage/${item.image}` : null;

// ✅ NEW: Safe URL with validation
const imageUrl = useMemo(() => {
if (!item.image) return null;
return buildStorageUrl(MAIN_APP_URL, item.image);
}, [item.image]);

// ==========================================
// STEP 4: SANITIZE HTML (Pattern)
// ==========================================

// ❌ OLD: Unsafe HTML rendering
// <RenderHTML source={{ html: item.content }} />

// ✅ NEW: Sanitized HTML
const safeContent = useMemo(() => {
return sanitizeHtml(item.content);
}, [item.content]);

// Then use:
// <RenderHTML source={{ html: safeContent }} />

// ==========================================
// STEP 5: FIX DATE FORMATTING (Pattern)
// ==========================================

// ❌ OLD: No error handling
// const formatted = new Date(dateString).toLocaleDateString('id-ID', {...});

// ✅ NEW: With error handling
const formatDate = useCallback((dateString: string | undefined): string => {
if (!dateString) return 'Tanggal tidak diketahui';
try {
const date = new Date(dateString);
if (isNaN(date.getTime())) {
logger.warn('MyScreen', 'Invalid date', dateString);
return 'Tanggal tidak valid';
}
return date.toLocaleDateString('id-ID', {
day: 'numeric',
month: 'long',
year: 'numeric',
});
} catch (e) {
logger.error('MyScreen', 'Date format error', e);
return 'Tanggal tidak diketahui';
}
}, []);

// ==========================================
// STEP 6: ERROR HANDLING (Pattern)
// ==========================================

// ❌ OLD: Generic try-catch
// try {
// const response = await api.get('/data');
// setData(response.data);
// } catch (error) {
// console.log('Error:', error);
// }

// ✅ NEW: Typed error handling with retry
const fetchData = useCallback(async () => {
try {
setLoading(true);
// Method 1: With retry logic
const data = await withRetry(
() => api.get('/endpoint'),
3, // max attempts
1000 // base delay
);
setData(data.data);
setError(null);
logger.info('MyScreen', 'Data loaded successfully');
} catch (err) {
const appError = handleApiError(err);
setError(appError.message);
logError('MyScreen:fetchData', appError);
} finally {
setLoading(false);
}
}, []);

// Method 2: Using custom hook
const { data, loading, error, refetch } = useFetchWithCache<any[]>(
'/endpoint',
'CACHE_KEY',
{
ttl: 15,
onError: (error) => {
logger.error('MyScreen', 'Fetch error', error);
},
}
);

// ==========================================
// STEP 7: REMOVE CONSOLE.LOGS (Pattern)
// ==========================================

// ❌ OLD: Production logs exposed
// console.log('User:', user);
// console.log('Data loaded:', data);
// console.error('Error:', error);

// ✅ NEW: Dev-only logging
logger.debug('MyScreen', 'User data', user); // Only in **DEV**
logger.info('MyScreen', 'Data loaded', data); // Only in **DEV**
logger.error('MyScreen', 'Error occurred', error); // Only in **DEV**

// ==========================================
// STEP 8: MEMOIZATION (Pattern)
// ==========================================

// ❌ OLD: Recalculated every render
// const filtered = data.filter(item => item.status === 'active');
// const formatted = data.map(item => ({...}));

// ✅ NEW: Memoized derived state
const filteredData = useMemo(() => {
if (!data) return [];
return data.filter(item => item.status === 'active');
}, [data]);

const formattedData = useMemo(() => {
if (!data) return [];
return data.map(item => ({
...item,
displayDate: formatDate(item.created_at),
}));
}, [data, formatDate]);

// ==========================================
// STEP 9: NULL SAFETY (Pattern)
// ==========================================

// ❌ OLD: Can crash if data is undefined
// <Text>{item.date.toLocaleDateString()}</Text>

// ✅ NEW: Safe access with checks
<Text>{item?.date ? formatDate(item.date) : 'Tanggal tidak diketahui'}</Text>

// ==========================================
// STEP 10: ERROR STATES (Pattern)
// ==========================================

// ❌ OLD: No error UI
// {loading && <Skeleton />}
// {/_ Content rendered but might be empty _/}

// ✅ NEW: Complete state handling
{loading ? (
<Skeleton />
) : error ? (
<View className="flex-1 items-center justify-center px-6">
<Text className="text-red-600 font-bold mb-4">⚠️ {error}</Text>
<TouchableOpacity onPress={() => refetch()} className="bg-blue-600 px-8 py-3 rounded-lg">
<Text className="text-white font-bold">Coba Lagi</Text>
</TouchableOpacity>
</View>
) : data && data.length > 0 ? (
<FlatList data={data} renderItem={renderItem} />
) : (
<View className="flex-1 items-center justify-center">
<Text className="text-slate-400">Tidak ada data</Text>
</View>
)}

// ==========================================
// QUICK CHECKLIST FOR EACH SCREEN
// ==========================================

/\*\*

- □ Import types from '../../types'
- □ Import utils from '../../utils/validation'
- □ Import error handler from '../../utils/errorHandler'
- □ Import logger from '../../utils/logger'
- □ Validate route.params on mount
- □ Replace all unsafe URLs with buildStorageUrl()
- □ Sanitize all HTML with sanitizeHtml()
- □ Add error handling to all API calls
- □ Use logger instead of console.log
- □ Add useMemo for expensive calculations
- □ Add useCallback for callbacks
- □ Add proper error state UI
- □ Add null/undefined checks
- □ Replace try-catch with handleApiError()
- □ Update type annotations (remove 'any')
  \*/

// ==========================================
// EXAMPLE: Complete Refactored Screen
// ==========================================

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BerkasItem } from '../../types';
import { buildStorageUrl } from '../../utils/validation';
import { handleApiError } from '../../utils/errorHandler';
import { logger } from '../../utils/logger';
import { useFetchWithCache } from '../../hooks/useApi';
import api from '../../services/api';

interface MyScreenProps {
navigation: any;
route: any;
}

const MyScreen: React.FC<MyScreenProps> = ({ navigation, route }) => {
// ✅ Typed props
const { userId } = route.params as { userId: string };

// ✅ Use custom hook for data fetching
const {
data: items,
loading,
error,
refreshing,
refetch,
} = useFetchWithCache<BerkasItem[]>(
`/user/${userId}/items`,
`ITEMS_${userId}`,
{
ttl: 15,
onError: (error) => {
logger.error('MyScreen', 'Failed to fetch items', error);
},
}
);

// ✅ Memoized refresh handler
const onRefresh = useCallback(() => {
refetch(true);
}, [refetch]);

// ✅ Memoized render function
const renderItem = useCallback(({ item }: { item: BerkasItem }) => {
const fileUrl = buildStorageUrl(process.env.MAIN_APP_URL || '', item.file_path);

    return (
      <TouchableOpacity onPress={() => handleItemPress(item)} className="p-4 border-b border-slate-100">
        <Text className="font-bold">{item.judul}</Text>
        <Text className="text-slate-500 text-sm">{item.file_type}</Text>
      </TouchableOpacity>
    );

}, []);

// ✅ Proper error handling
const handleItemPress = useCallback((item: BerkasItem) => {
try {
// Handle item press
logger.info('MyScreen', 'Item pressed', { id: item.id });
} catch (err) {
const appError = handleApiError(err);
logger.error('MyScreen', 'Error pressing item', appError);
}
}, []);

return (
<SafeAreaView className="flex-1">
<View className="px-6 py-4 bg-white border-b border-slate-100">
<Text className="text-xl font-bold">Dokumen Saya</Text>
</View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <Text>Loading...</Text>
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-red-600 font-bold mb-4">⚠️ {error}</Text>
          <TouchableOpacity onPress={() => refetch()} className="bg-blue-600 px-8 py-3 rounded-lg">
            <Text className="text-white font-bold">Coba Lagi</Text>
          </TouchableOpacity>
        </View>
      ) : items && items.length > 0 ? (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      ) : (
        <View className="flex-1 items-center justify-center">
          <Text className="text-slate-400">Tidak ada dokumen</Text>
        </View>
      )}
    </SafeAreaView>

);
};

export default MyScreen;

// ==========================================
// That's it! Follow this pattern for all screens.
// Questions? Check the ENHANCEMENT_SUMMARY.md file
// ==========================================
