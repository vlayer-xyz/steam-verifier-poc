import { redirect } from 'next/navigation'

interface HomeSearchParams {
  [key: string]: string | string[] | undefined
}

export default async function Home({ searchParams }: { searchParams: Promise<HomeSearchParams> }) {
  const resolvedSearchParams = await searchParams
  const params = new URLSearchParams()

  Object.entries(resolvedSearchParams).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((entry) => {
        if (entry !== undefined) {
          params.append(key, entry)
        }
      })
    } else if (value !== undefined) {
      params.append(key, value)
    }
  })

  const query = params.toString()

  redirect(query ? `/steam?${query}` : '/steam')

  return null
}
