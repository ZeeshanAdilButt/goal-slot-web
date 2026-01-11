'use client'

import { useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query'
import { reportsApi } from '@/lib/api'
import type {
  DetailedReportResponse,
  SummaryReportResponse,
  DayByTaskReportResponse,
  DayTotalReportResponse,
  ScheduleReportResponse,
  FilterableGoal,
  FilterableTask,
  ReportFilters,
  ExportReportParams,
} from '@/features/reports/utils/types'

export const reportQueries = {
  all: ['reports'] as const,
  detailed: (filters: Omit<ReportFilters, 'viewType'>) => [...reportQueries.all, 'detailed', filters] as const,
  summary: (filters: Omit<ReportFilters, 'viewType'>) => [...reportQueries.all, 'summary', filters] as const,
  dayByTask: (filters: Omit<ReportFilters, 'viewType'>) => [...reportQueries.all, 'day-by-task', filters] as const,
  dayTotal: (filters: Omit<ReportFilters, 'viewType'>) => [...reportQueries.all, 'day-total', filters] as const,
  schedule: (filters: Omit<ReportFilters, 'viewType'>) => [...reportQueries.all, 'schedule', filters] as const,
  filterableGoals: () => [...reportQueries.all, 'filterable-goals'] as const,
  filterableTasks: (goalId?: string) => [...reportQueries.all, 'filterable-tasks', goalId] as const,
}

// Convert array filters to comma-separated strings for API
function prepareFiltersForApi(filters: ReportFilters) {
  return {
    ...filters,
    goalIds: filters.goalIds?.join(','),
    taskIds: filters.taskIds?.join(','),
  }
}

// Get query key filters (exclude viewType since it's already part of the query key structure)
function getQueryKeyFilters(filters: ReportFilters) {
  const { viewType, ...rest } = filters
  return rest
}

export function useDetailedReportQuery(
  filters: ReportFilters,
  options?: { enabled?: boolean }
): UseQueryResult<DetailedReportResponse> {
  return useQuery<DetailedReportResponse>({
    queryKey: reportQueries.detailed(getQueryKeyFilters(filters)),
    queryFn: async (): Promise<DetailedReportResponse> => {
      const res = await reportsApi.getDetailed(prepareFiltersForApi(filters))
      return res.data
    },
    enabled: options?.enabled !== false && !!filters.startDate && !!filters.endDate,
    placeholderData: (previousData) => previousData,
  })
}

export function useSummaryReportQuery(
  filters: ReportFilters,
  options?: { enabled?: boolean }
): UseQueryResult<SummaryReportResponse> {
  return useQuery<SummaryReportResponse>({
    queryKey: reportQueries.summary(getQueryKeyFilters(filters)),
    queryFn: async (): Promise<SummaryReportResponse> => {
      const res = await reportsApi.getSummary(prepareFiltersForApi(filters))
      return res.data
    },
    enabled: options?.enabled !== false && !!filters.startDate && !!filters.endDate,
    placeholderData: (previousData) => previousData,
  })
}

export function useDayByTaskReportQuery(
  filters: ReportFilters,
  options?: { enabled?: boolean }
): UseQueryResult<DayByTaskReportResponse> {
  return useQuery<DayByTaskReportResponse>({
    queryKey: reportQueries.dayByTask(getQueryKeyFilters(filters)),
    queryFn: async (): Promise<DayByTaskReportResponse> => {
      const res = await reportsApi.getDayByTask(prepareFiltersForApi(filters))
      return res.data
    },
    enabled: options?.enabled !== false && !!filters.startDate && !!filters.endDate,
    placeholderData: (previousData) => previousData,
  })
}

export function useDayTotalReportQuery(
  filters: ReportFilters,
  options?: { enabled?: boolean }
): UseQueryResult<DayTotalReportResponse> {
  return useQuery<DayTotalReportResponse>({
    queryKey: reportQueries.dayTotal(getQueryKeyFilters(filters)),
    queryFn: async (): Promise<DayTotalReportResponse> => {
      const res = await reportsApi.getDayTotal(prepareFiltersForApi(filters))
      return res.data
    },
    enabled: options?.enabled !== false && !!filters.startDate && !!filters.endDate,
    placeholderData: (previousData) => previousData,
  })
}

export function useScheduleReportQuery(
  filters: ReportFilters,
  options?: { enabled?: boolean }
): UseQueryResult<ScheduleReportResponse> {
  return useQuery<ScheduleReportResponse>({
    queryKey: reportQueries.schedule(getQueryKeyFilters(filters)),
    queryFn: async (): Promise<ScheduleReportResponse> => {
      const res = await reportsApi.getScheduleReport(prepareFiltersForApi(filters))
      return res.data
    },
    enabled: options?.enabled !== false && !!filters.startDate && !!filters.endDate,
    placeholderData: (previousData) => previousData,
  })
}

export function useFilterableGoalsQuery(): UseQueryResult<FilterableGoal[]> {
  return useQuery<FilterableGoal[]>({
    queryKey: reportQueries.filterableGoals(),
    queryFn: async (): Promise<FilterableGoal[]> => {
      const res = await reportsApi.getFilterableGoals()
      return Array.isArray(res.data) ? res.data : []
    },
  })
}

export function useFilterableTasksQuery(goalId?: string): UseQueryResult<FilterableTask[]> {
  return useQuery<FilterableTask[]>({
    queryKey: reportQueries.filterableTasks(goalId),
    queryFn: async (): Promise<FilterableTask[]> => {
      const res = await reportsApi.getFilterableTasks(goalId)
      return Array.isArray(res.data) ? res.data : []
    },
  })
}

export function useExportReportMutation() {
  return useMutation({
    mutationFn: async (params: ExportReportParams) => {
      const preparedParams = {
        ...params,
        goalIds: params.goalIds?.join(','),
        taskIds: params.taskIds?.join(','),
      }
      const res = await reportsApi.exportReport(preparedParams)
      return res.data
    },
  })
}
