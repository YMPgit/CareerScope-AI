import axios, { AxiosError } from 'axios'

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  timeout: 90000,
})

function readCookie(name: string): string {
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : ''
}

api.interceptors.request.use((config) => {
  const method = (config.method || 'get').toLowerCase()
  if (['post', 'put', 'patch', 'delete'].includes(method)) {
    const csrf = readCookie('careerscope_csrf')
    if (csrf) {
      config.headers['X-CSRF-Token'] = csrf
    }
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const url = error.config?.url || ''
    const isCredentialEndpoint = url.includes('/auth/signin') || url.includes('/auth/signup')
    if (error.response?.status === 401 && !isCredentialEndpoint) {
      window.dispatchEvent(new Event('auth:unauthorized'))
    }
    return Promise.reject(error)
  },
)

export interface ApiError {
  message: string
  status?: number
}

export function getErrorMessage(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { detail?: string | Array<{ msg?: string }> } | undefined
    if (data) {
      if (typeof data.detail === 'string') return data.detail
      if (Array.isArray(data.detail) && data.detail.length > 0) return data.detail[0]?.msg || fallback
    }
    if (err.code === 'ECONNABORTED') return 'Request timed out. Please try again.'
    if (!err.response) return 'Cannot reach the server. Is the backend running?'
  }
  return fallback
}

export async function postForm<T>(url: string, form: FormData): Promise<T> {
  const { data } = await api.post<T>(url, form)
  return data
}