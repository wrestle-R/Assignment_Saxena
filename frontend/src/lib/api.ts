import type {
  DataQualityIssue,
  ExceptionDetailResponse,
  ExceptionItem,
  User,
} from "@/types"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ""

class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  })

  const payload = (await response.json().catch(() => ({}))) as {
    message?: string
  } & T

  if (!response.ok) {
    throw new ApiError(payload.message || "Request failed", response.status)
  }

  return payload
}

export function getSession() {
  return request<{ user: User }>("/api/auth/me").then((payload) => payload.user)
}

export function login(credentials: { username: string; password: string }) {
  return request<{ user: User }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  }).then((payload) => payload.user)
}

export function logout() {
  return request<{ success: boolean }>("/api/auth/logout", {
    method: "POST",
  })
}

function buildQueryString(params: Record<string, string | undefined>) {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      searchParams.set(key, value)
    }
  })

  const query = searchParams.toString()
  return query ? `?${query}` : ""
}

export function getExceptions(filters: {
  productCode?: string
  severity?: string
  status?: string
}) {
  return request<{ items: ExceptionItem[] }>(
    `/api/exceptions${buildQueryString(filters)}`
  ).then((payload) => payload.items)
}

export function getExceptionDetail(id: string) {
  return request<ExceptionDetailResponse>(`/api/exceptions/${id}`)
}

export function updateExceptionStatus(
  id: string,
  status: "acknowledged" | "resolved"
) {
  return request<{ exception: ExceptionItem }>(`/api/exceptions/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  }).then((payload) => payload.exception)
}

export function getDataQualityIssues(filters: {
  productCode?: string
  issueType?: string
  status?: string
}) {
  return request<{ items: DataQualityIssue[] }>(
    `/api/data-quality-issues${buildQueryString(filters)}`
  ).then((payload) => payload.items)
}

export function getDataQualityIssueDetail(id: string) {
  return request<{ issue: DataQualityIssue }>(`/api/data-quality-issues/${id}`).then(
    (payload) => payload.issue
  )
}

export function updateDataQualityIssueStatus(
  id: string,
  status: "acknowledged" | "resolved"
) {
  return request<{ issue: DataQualityIssue }>(`/api/data-quality-issues/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  }).then((payload) => payload.issue)
}

export { ApiError }
