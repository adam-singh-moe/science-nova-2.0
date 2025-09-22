# Database Constraint Update for Grade 0 Support

## Overview
This document explains how to update the database constraint to allow `grade_level = 0` for privileged users (ADMIN, TEACHER, DEVELOPER roles).

## Current Constraint
The `profiles_grade_level_check` constraint currently only allows grades 1-6:
```sql
CHECK (grade_level >= 1 AND grade_level <= 6)
```

## Required Change
Update the constraint to allow grades 0-6:
```sql
CHECK (grade_level >= 0 AND grade_level <= 6)
```

## Steps to Update Constraint in Supabase Dashboard

### 1. Access Database Settings
1. Log into your Supabase dashboard
2. Navigate to **Database** → **Tables**
3. Find and click on the `profiles` table

### 2. Locate the Constraint
1. Look for the **Constraints** section or tab
2. Find the constraint named `profiles_grade_level_check`

### 3. Modify the Constraint
1. Click on the constraint to edit it
2. Update the check condition from:
   ```sql
   (grade_level >= 1) AND (grade_level <= 6)
   ```
   To:
   ```sql
   (grade_level >= 0) AND (grade_level <= 6)
   ```
3. Save the changes

### 4. Alternative: SQL Command
If you have SQL access, you can run these commands:
```sql
-- Drop the existing constraint
ALTER TABLE profiles DROP CONSTRAINT profiles_grade_level_check;

-- Add the new constraint allowing 0-6
ALTER TABLE profiles ADD CONSTRAINT profiles_grade_level_check 
  CHECK (grade_level >= 0 AND grade_level <= 6);
```

## Grade Level Semantics

After the constraint update:

- **Grade 0**: Privileged users (ADMIN, TEACHER, DEVELOPER)
  - Represents "access to all grades"
  - Used internally for role-based filtering bypass
  - Never displayed in UI for these users

- **Grades 1-6**: Student users
  - Represents specific grade level access
  - Used for content filtering and recommendations
  - Displayed in UI for grade selection

## Code Changes Ready

All code has been updated to use grade 0 for privileged users:

### Updated Files:
- ✅ `/app/profile/page.tsx` - Uses grade 0 for privileged users
- ✅ `/science-nova-lite/app/profile/page.tsx` - Uses grade 0 for privileged users  
- ✅ `/app/api/profile/route.ts` - Validates grades 0-6
- ✅ `update-privileged-users-to-grade-0.js` - Migration script ready

### After Constraint Update:
1. Run the migration script: `node update-privileged-users-to-grade-0.js`
2. Test profile updates for both privileged and student users
3. Verify role-based content access still works correctly

## Benefits of Grade 0 Approach

1. **Semantic Clarity**: Grade 0 clearly represents "all grades" vs grade 6 which could be confusing
2. **Future Expansion**: Easy to add grades 7+ without affecting privileged user logic
3. **Clean Logic**: `grade_level === 0` is more readable than checking for role AND grade 6
4. **Database Integrity**: Maintains referential integrity while allowing special values

## Rollback Plan

If issues arise, you can rollback by:
1. Reverting constraint to `grade_level >= 1 AND grade_level <= 6`
2. Running: `UPDATE profiles SET grade_level = 6 WHERE role IN ('ADMIN', 'TEACHER', 'DEVELOPER');`
3. Reverting code changes to use grade 6 instead of grade 0
