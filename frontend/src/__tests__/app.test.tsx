import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import App from "@/App"

type MockResponse = {
  status?: number
  body?: unknown
  delayMs?: number
}

function jsonResponse({
  status = 200,
  body,
  delayMs = 0,
}: MockResponse = {}) {
  return new Promise<Response>((resolve) => {
    setTimeout(() => {
      resolve({
        ok: status >= 200 && status < 300,
        status,
        json: async () => body,
      } as Response)
    }, delayMs)
  })
}

function setPath(path: string) {
  window.history.replaceState({}, "", path)
}

describe("App", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  test("redirects unauthenticated dashboard access back to the login route", async () => {
    setPath("/dashboard")

    vi.spyOn(globalThis, "fetch").mockImplementation((input) => {
      const url = String(input)
      if (url.endsWith("/api/auth/me")) {
        return jsonResponse({
          status: 401,
          body: { message: "Authentication required" },
        })
      }

      throw new Error(`Unhandled fetch for ${url}`)
    })

    render(<App />)

    expect(await screen.findByRole("heading", { name: /^sign in$/i })).toBeInTheDocument()
    await waitFor(() => {
      expect(window.location.pathname).toBe("/")
    })
  })

  test("logs in successfully and navigates into the dashboard workspace", async () => {
    setPath("/")

    let authenticated = false
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation((input, init) => {
      const url = String(input)

      if (url.endsWith("/api/auth/me")) {
        return authenticated
          ? jsonResponse({
              body: {
                user: {
                  username: "admin",
                  role: "admin",
                },
              },
            })
          : jsonResponse({
              status: 401,
              body: { message: "Authentication required" },
            })
      }

      if (url.endsWith("/api/auth/login")) {
        expect(init?.method).toBe("POST")
        authenticated = true
        return jsonResponse({
          body: {
            user: {
              username: "admin",
              role: "admin",
            },
          },
        })
      }

      if (url.includes("/api/exceptions")) {
        return jsonResponse({
          body: {
            items: [
              {
                id: "exp-1",
                date: "2017-02-09",
                productCode: "FG-011",
                plannedUnits: 104,
                actualUnits: 65,
                deficitPct: 37.5,
                severity: "high",
                status: "open",
              },
            ],
          },
        })
      }

      if (url.includes("/api/data-quality-issues")) {
        return jsonResponse({
          body: { items: [] },
        })
      }

      throw new Error(`Unhandled fetch for ${url}`)
    })

    render(<App />)

    await userEvent.type(screen.getByLabelText(/username/i), "admin")
    await userEvent.type(screen.getByLabelText(/password/i), "123456")
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }))

    expect(await screen.findByText(/open reviews/i)).toBeInTheDocument()
    expect(
      await screen.findByRole("button", { name: /view details for fg-011/i })
    ).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalled()
    expect(window.location.pathname).toBe("/dashboard")
  })

  test("shows dashboard skeletons before exception data resolves", async () => {
    setPath("/dashboard")

    vi.spyOn(globalThis, "fetch").mockImplementation((input) => {
      const url = String(input)

      if (url.endsWith("/api/auth/me")) {
        return jsonResponse({
          body: {
            user: {
              username: "admin",
              role: "admin",
            },
          },
        })
      }

      if (url.includes("/api/exceptions")) {
        return jsonResponse({
          delayMs: 50,
          body: { items: [] },
        })
      }

      if (url.includes("/api/data-quality-issues")) {
        return jsonResponse({
          delayMs: 50,
          body: { items: [] },
        })
      }

      throw new Error(`Unhandled fetch for ${url}`)
    })

    render(<App />)

    expect(await screen.findByTestId("dashboard-shell-skeleton")).toBeInTheDocument()
    expect(await screen.findByText(/no exceptions match/i)).toBeInTheDocument()
  })

  test("switches to data-quality mode, opens detail, and updates issue status without reload", async () => {
    setPath("/dashboard")

    let issue = {
      id: "dq-1",
      issueType: "blank_planned_units",
      date: "2017-01-26",
      productCode: "FG-012",
      description: "Plan row has a blank planned_units value.",
      status: "open",
      rawRows: [
        {
          plan_date: "2017-01-26",
          plant: "PLANT-1",
          sku: "FG-012",
          planned_units: "",
        },
      ],
    }

    vi.spyOn(globalThis, "fetch").mockImplementation((input, init) => {
      const url = String(input)

      if (url.endsWith("/api/auth/me")) {
        return jsonResponse({
          body: {
            user: {
              username: "admin",
              role: "admin",
            },
          },
        })
      }

      if (url.includes("/api/exceptions")) {
        return jsonResponse({
          body: { items: [] },
        })
      }

      if (url.includes("/api/data-quality-issues/dq-1") && init?.method === "PATCH") {
        const nextStatus = JSON.parse(String(init.body)).status
        const payload = JSON.parse(String(init.body))
        issue = {
          ...issue,
          ...payload,
          status: payload.status,
        }
        return jsonResponse({
          body: {
            issue,
          },
        })
      }

      if (url.includes("/api/data-quality-issues/dq-1")) {
        return jsonResponse({
          body: { issue },
        })
      }

      if (url.includes("/api/data-quality-issues")) {
        return jsonResponse({
          body: { items: [issue] },
        })
      }

      throw new Error(`Unhandled fetch for ${url}`)
    })

    render(<App />)

    await userEvent.click(await screen.findByRole("button", { name: /^Data quality$/i }))
    expect(
      await screen.findByRole("button", { name: /view details for fg-012/i })
    ).toBeInTheDocument()

    await userEvent.click(screen.getByRole("button", { name: /view details for fg-012/i }))

    const panel = await screen.findByRole("dialog", { name: /issue detail/i })
    expect(within(panel).getByText(/plan row has a blank planned_units value/i)).toBeInTheDocument()
    expect(within(panel).getByText(/evidence cards/i)).toBeInTheDocument()
    expect(within(panel).getAllByText(/planned units/i).length).toBeGreaterThan(0)

    await userEvent.click(within(panel).getByRole("button", { name: /resolve/i }))

    await waitFor(() => {
      expect(within(panel).getAllByText(/resolved/i).length).toBeGreaterThan(0)
    })

    await userEvent.click(within(panel).getByRole("button", { name: /reopen/i }))

    await waitFor(() => {
      expect(within(panel).getAllByText(/^open$/i).length).toBeGreaterThan(0)
    })
  })
})
