# VSCode Agent Instructions: Refactoring Pages into Feature Directory Structure

## Overview

This document provides step-by-step instructions for refactoring a Next.js page component into a feature-based directory structure following the established patterns in this codebase.

## Prerequisites

- Understand the existing feature structure (see `features/tasks/` as reference)
- Familiarity with React Query patterns used in the codebase
- Understanding of single responsibility principle for components

## Feature Directory Structure

```
features/
└── [feature-name]/
    ├── components/          # Feature specific components (lean, single responsibility)
    ├── hooks/              # Custom React hooks (queries, mutations, business logic)
    ├── utils/              # Utilities, types, queries, constants
    │   ├── types.ts        # TypeScript types and interfaces
    │   ├── queries.ts      # React Query query keys and fetch functions
    │   └── utils.ts        # Helper functions (optional)
    └── index.ts            # Public exports
```

## Step-by-Step Refactoring Process

### Step 1: Create Feature Directory Structure

1. **Create the feature directory**:

   ```
   src/features/[feature-name]/
   ```

2. **Create subdirectories**:
   - `components/` - for UI components
   - `hooks/` - for custom hooks
   - `utils/` - for types, queries, and utilities

3. **Create `index.ts`** for public exports:
   ```typescript
   export { FeaturePage } from '@/features/[feature-name]/components/[feature-name]-page'
   export { useFeatureQuery } from '@/features/[feature-name]/hooks/use-[feature-name]-queries'
   ```

### Step 2: Extract Types to `utils/types.ts`

1. **Identify all types and interfaces** from the original page
2. **Move them to `utils/types.ts`**
3. **Export all types** for use in other files

Example structure:

```typescript
export type FeatureStatus = 'ACTIVE' | 'COMPLETED' | 'PAUSED'

export interface Feature {
  id: string
  title: string
  description?: string
  status: FeatureStatus
  // ... other fields
}

export interface CreateFeatureForm {
  title: string
  description: string
  // ... other fields
}
```

### Step 3: Create React Query Structure in `utils/queries.ts`

1. **Define query keys** following the pattern:

   ```typescript
   import { FeatureStatus } from '@/features/[feature-name]/utils/types'

   import { featureApi } from '@/lib/api'

   export const featureQueries = {
     all: ['features'] as const,
     list: (filters?: { status?: FeatureStatus }) => [...featureQueries.all, 'list', filters] as const,
     detail: (id: string) => [...featureQueries.all, 'detail', id] as const,
     stats: () => [...featureQueries.all, 'stats'] as const,
   }
   ```

2. **Create fetch functions** for each query:

   ```typescript
   export const fetchFeatures = async (filters?: { status?: FeatureStatus }) => {
     const res = await featureApi.getAll(filters)
     return res.data
   }

   export const fetchFeatureStats = async () => {
     const res = await featureApi.getStats()
     return res.data
   }
   ```

### Step 4: Create Query Hooks in `hooks/use-[feature-name]-queries.ts`

1. **Create custom hooks** using `useQuery`:

   ```typescript
   import { featureQueries, fetchFeatures } from '@/features/[feature-name]/utils/queries'
   import { FeatureStatus } from '@/features/[feature-name]/utils/types'
   import { useQuery } from '@tanstack/react-query'

   export function useFeaturesQuery(filters?: { status?: FeatureStatus }) {
     return useQuery({
       queryKey: featureQueries.list(filters),
       queryFn: () => fetchFeatures(filters),
     })
   }

   export function useFeatureStatsQuery() {
     return useQuery({
       queryKey: featureQueries.stats(),
       queryFn: fetchFeatureStats,
     })
   }
   ```

2. **Create mutation hooks** in `hooks/use-[feature-name]-mutations.ts`:

   ```typescript
   import { featureQueries } from '@/features/[feature-name]/utils/queries'
   import { useMutation, useQueryClient } from '@tanstack/react-query'
   import { toast } from 'react-hot-toast'

   import { featureApi } from '@/lib/api'

   export function useCreateFeatureMutation() {
     const queryClient = useQueryClient()

     return useMutation({
       mutationFn: async (data: CreateFeatureForm) => {
         const res = await featureApi.create(data)
         return res.data
       },
       onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: featureQueries.all })
         toast.success('Feature created')
       },
       onError: () => {
         toast.error('Failed to create feature')
       },
     })
   }

   export function useUpdateFeatureMutation() {
     const queryClient = useQueryClient()

     return useMutation({
       mutationFn: async ({ id, data }: { id: string; data: Partial<Feature> }) => {
         const res = await featureApi.update(id, data)
         return res.data
       },
       onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: featureQueries.all })
         toast.success('Feature updated')
       },
       onError: () => {
         toast.error('Failed to update feature')
       },
     })
   }

   export function useDeleteFeatureMutation() {
     const queryClient = useQueryClient()

     return useMutation({
       mutationFn: async (id: string) => {
         await featureApi.delete(id)
       },
       onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: featureQueries.all })
         toast.success('Feature deleted')
       },
       onError: () => {
         toast.error('Failed to delete feature')
       },
     })
   }
   ```

### Step 5: Extract Components (Single Responsibility Principle)

1. **Identify distinct UI sections** in the original page
2. **Create separate component files** for each section:
   - Header components
   - List/Grid components
   - Card/Item components
   - Modal/Dialog components
   - Filter/Tab components
   - Stats components
   - Empty state components

3. **Component Guidelines**:
   - Each component should have a **single responsibility**
   - Components should be **lean** (prefer smaller, focused components)
   - **State should be as close to child components as possible**
   - If state is only needed in a child component, define it there, not in the parent
   - Pass only necessary props (avoid prop drilling)

4. **Example component structure**:
   ```
   components/
   ├── [feature-name]-page.tsx          # Main page component
   ├── [feature-name]-header.tsx        # Page header with title and actions
   ├── [feature-name]-stats.tsx         # Statistics cards
   ├── [feature-name]-filters.tsx       # Filter tabs/buttons
   ├── [feature-name]-list.tsx          # List/grid container
   ├── [feature-name]-item.tsx          # Individual item card
   ├── [feature-name]-empty-state.tsx   # Empty state component
   └── [feature-name]-modal.tsx         # Create/Edit modal
   ```

### Step 6: State Management Principles

**CRITICAL**: Follow these state management rules:

1. **State Locality**:
   - State should be defined in the component that uses it
   - If state is only needed in a child, define it in the child
   - Avoid lifting state to parent unless multiple children need it

2. **Example - Good**:

   ```typescript
   // Modal component manages its own form state
   function FeatureModal({ isOpen, onClose }: Props) {
     const [title, setTitle] = useState('') // ✅ State in component that uses it
     // ...
   }
   ```

3. **Example - Bad**:

   ```typescript
   // Parent managing state for child
   function FeaturePage() {
     const [title, setTitle] = useState('') // ❌ State in parent but only used in modal
     return <FeatureModal title={title} setTitle={setTitle} />
   }
   ```

4. **Shared State**:
   - If state is needed by multiple components, lift it to the nearest common ancestor
   - Use React Query for server state (data fetching)
   - Use local state for UI state (modals, filters, etc.)

### Step 7: Refactor Main Page Component

1. **Create `components/[feature-name]-page.tsx`**:
   - Import query hooks instead of making direct API calls
   - Use extracted components
   - Keep only orchestration logic
   - Remove inline API calls (use React Query hooks)

2. **Example structure**:

   ```typescript
   'use client'

   import { useState } from 'react'
   import { FeatureHeader } from '@/features/[feature-name]/components/[feature-name]-header'
   import { FeatureStats } from '@/features/[feature-name]/components/[feature-name]-stats'
   import { FeatureFilters } from '@/features/[feature-name]/components/[feature-name]-filters'
   import { FeatureList } from '@/features/[feature-name]/components/[feature-name]-list'
   import { FeatureModal } from '@/features/[feature-name]/components/[feature-name]-modal'
   import { useFeaturesQuery, useFeatureStatsQuery } from '@/features/[feature-name]/hooks/use-[feature-name]-queries'

   export function FeaturePage() {
     const [filter, setFilter] = useState<FeatureStatus>('ACTIVE')
     const [showModal, setShowModal] = useState(false)
     const [editingFeature, setEditingFeature] = useState<Feature | null>(null)

     const featuresQuery = useFeaturesQuery({ status: filter })
     const statsQuery = useFeatureStatsQuery()

     return (
       <div className="space-y-8">
         <FeatureHeader onCreateClick={() => setShowModal(true)} />
         <FeatureStats stats={statsQuery.data} isLoading={statsQuery.isLoading} />
         <FeatureFilters filter={filter} onFilterChange={setFilter} />
         <FeatureList
           features={featuresQuery.data || []}
           isLoading={featuresQuery.isLoading}
           onEdit={setEditingFeature}
         />
         <FeatureModal
           isOpen={showModal}
           onClose={() => {
             setShowModal(false)
             setEditingFeature(null)
           }}
           feature={editingFeature}
         />
       </div>
     )
   }
   ```

### Step 8: Update Next.js Page Route

1. **Update the page route** to use the feature component:

   ```typescript
   // app/dashboard/[feature]/page.tsx
   'use client'

   import { FeaturePage } from '@/features/[feature-name]'

   export default function Page() {
     return <FeaturePage />
   }
   ```

### Step 9: Component Extraction Examples

#### Example 1: Stats Component

```typescript
// components/[feature-name]-stats.tsx
interface FeatureStatsProps {
  stats?: { active: number; completed: number; paused: number }
  isLoading: boolean
}

export function FeatureStats({ stats, isLoading }: FeatureStatsProps) {
  if (isLoading) {
    return <div>Loading stats...</div>
  }

  return (
    <div className="grid grid-cols-3 gap-6">
      {[
        { label: 'Active', value: stats?.active || 0, color: 'bg-accent-green' },
        { label: 'Completed', value: stats?.completed || 0, color: 'bg-accent-blue' },
        { label: 'Paused', value: stats?.paused || 0, color: 'bg-primary' },
      ].map((stat) => (
        <div key={stat.label} className={`${stat.color} border-3 border-secondary p-6`}>
          <div className="font-mono text-4xl font-bold">{stat.value}</div>
          <div className="font-bold uppercase">{stat.label}</div>
        </div>
      ))}
    </div>
  )
}
```

#### Example 2: Item Component (with local state)

```typescript
// components/[feature-name]-item.tsx
import { useState } from 'react'
import { Feature } from '@/features/[feature-name]/utils/types'
import { useDeleteFeatureMutation } from '@/features/[feature-name]/hooks/use-[feature-name]-mutations'

interface FeatureItemProps {
  feature: Feature
  onEdit: (feature: Feature) => void
}

export function FeatureItem({ feature, onEdit }: FeatureItemProps) {
  const [showConfirm, setShowConfirm] = useState(false) // ✅ Local state for confirmation
  const deleteMutation = useDeleteFeatureMutation()

  const handleDelete = () => {
    if (showConfirm) {
      deleteMutation.mutate(feature.id)
      setShowConfirm(false)
    } else {
      setShowConfirm(true)
    }
  }

  return (
    <div className="card-brutal">
      <h3>{feature.title}</h3>
      <button onClick={() => onEdit(feature)}>Edit</button>
      <button onClick={handleDelete}>
        {showConfirm ? 'Confirm Delete' : 'Delete'}
      </button>
    </div>
  )
}
```

#### Example 3: Modal Component (manages own form state)

```typescript
// components/[feature-name]-modal.tsx
import { useState, useEffect } from 'react'
import { Feature, CreateFeatureForm } from '@/features/[feature-name]/utils/types'
import { useCreateFeatureMutation, useUpdateFeatureMutation } from '@/features/[feature-name]/hooks/use-[feature-name]-mutations'

interface FeatureModalProps {
  isOpen: boolean
  onClose: () => void
  feature?: Feature | null
}

export function FeatureModal({ isOpen, onClose, feature }: FeatureModalProps) {
  // ✅ Form state managed locally in modal
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  const createMutation = useCreateFeatureMutation()
  const updateMutation = useUpdateFeatureMutation()

  useEffect(() => {
    if (feature) {
      setTitle(feature.title)
      setDescription(feature.description || '')
    } else {
      setTitle('')
      setDescription('')
    }
  }, [feature])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const data: CreateFeatureForm = { title, description }

    if (feature) {
      updateMutation.mutate({ id: feature.id, data })
    } else {
      createMutation.mutate(data)
    }

    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <input value={title} onChange={(e) => setTitle(e.target.value)} />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
          <button type="submit">Save</button>
        </form>
      </div>
    </div>
  )
}
```

### Step 10: Validation Checklist

Before completing the refactoring, verify:

- [ ] All types are in `utils/types.ts`
- [ ] Query keys and fetch functions are in `utils/queries.ts`
- [ ] Query hooks are in `hooks/use-[feature-name]-queries.ts`
- [ ] Mutation hooks are in `hooks/use-[feature-name]-mutations.ts`
- [ ] All components are in `components/` directory
- [ ] Each component follows single responsibility principle
- [ ] State is defined as close to usage as possible
- [ ] No direct API calls in components (all through React Query)
- [ ] Main page component only orchestrates, doesn't contain business logic
- [ ] Next.js page route imports from feature index
- [ ] Feature exports are in `index.ts`
- [ ] All imports use feature path aliases (`@/features/[feature-name]/...`)

### Step 11: Reference Implementation

See `features/tasks/` for a complete reference implementation:

- `utils/types.ts` - Type definitions
- `utils/queries.ts` - Query keys and fetch functions
- `hooks/use-tasks-queries.ts` - Query hooks
- `hooks/use-tasks-mutations.ts` - Mutation hooks
- `components/` - All UI components
- `components/tasks-page.tsx` - Main page component

## Common Patterns

### Pattern 1: Filter State

```typescript
// ✅ Good: Filter state in page component (needed by multiple children)
function FeaturePage() {
  const [filter, setFilter] = useState<FeatureStatus>('ACTIVE')
  const featuresQuery = useFeaturesQuery({ status: filter })

  return (
    <>
      <FeatureFilters filter={filter} onFilterChange={setFilter} />
      <FeatureList features={featuresQuery.data} />
    </>
  )
}
```

### Pattern 2: Modal State

```typescript
// ✅ Good: Modal open/close in parent, form state in modal
function FeaturePage() {
  const [showModal, setShowModal] = useState(false) // Only open/close state
  const [editingFeature, setEditingFeature] = useState<Feature | null>(null)

  return (
    <FeatureModal
      isOpen={showModal}
      onClose={() => {
        setShowModal(false)
        setEditingFeature(null)
      }}
      feature={editingFeature}
    />
  )
}

// Modal manages its own form state
function FeatureModal({ isOpen, onClose, feature }: Props) {
  const [title, setTitle] = useState('') // ✅ Form state in modal
  // ...
}
```

### Pattern 3: Item Actions

```typescript
// ✅ Good: Action state in item component
function FeatureItem({ feature, onEdit }: Props) {
  const [isDeleting, setIsDeleting] = useState(false) // ✅ Local to item
  const deleteMutation = useDeleteFeatureMutation()

  return (
    <div>
      <button onClick={() => onEdit(feature)}>Edit</button>
      <button onClick={() => setIsDeleting(true)}>Delete</button>
      {isDeleting && <ConfirmDialog onConfirm={() => deleteMutation.mutate(feature.id)} />}
    </div>
  )
}
```

## Anti-Patterns to Avoid

1. **❌ Don't**: Lift all state to parent

   ```typescript
   // Bad: All state in parent
   function FeaturePage() {
     const [title, setTitle] = useState('') // Only used in modal
     const [description, setDescription] = useState('') // Only used in modal
     return <FeatureModal title={title} setTitle={setTitle} ... />
   }
   ```

2. **❌ Don't**: Make direct API calls in components

   ```typescript
   // Bad: Direct API call
   function FeatureList() {
     useEffect(() => {
       goalsApi.getAll().then(setFeatures) // ❌ Use React Query instead
     }, [])
   }
   ```

3. **❌ Don't**: Create monolithic components

   ```typescript
   // Bad: One large component doing everything
   function FeaturePage() {
     // 500+ lines of code mixing concerns
   }
   ```

4. **❌ Don't**: Define types inline
   ```typescript
   // Bad: Types defined in component
   function FeaturePage() {
     interface Goal {
       // ❌ Should be in utils/types.ts
       id: string
     }
   }
   ```

## Summary

The key principles for refactoring are:

1. **Feature-based organization**: Group related code by feature
2. **Single responsibility**: Each component does one thing well
3. **State locality**: State lives where it's used
4. **React Query for data**: All API calls go through React Query
5. **Lean components**: Small, focused, reusable components
6. **Type safety**: Centralized types in `utils/types.ts`
7. **Query organization**: Query keys and fetchers in `utils/queries.ts`

Follow the `features/tasks/` implementation as a reference for the complete pattern.
