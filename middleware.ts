import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()

    console.log('[Middleware]', {
        path: request.nextUrl.pathname,
        hasUser: !!user,
        userId: user?.id,
    });

    // Protect internal routes
    const isAuthPage = request.nextUrl.pathname.startsWith('/login')
    const isPublicRoute = ['/api/webhooks/lojou'].includes(request.nextUrl.pathname)

    if (!user && !isAuthPage && !isPublicRoute) {
        console.log('[Middleware] No user, redirecting to /login');
        return NextResponse.redirect(new URL('/login', request.url))
    }

    if (user && isAuthPage) {
        console.log('[Middleware] User logged in, redirecting from login to /');
        return NextResponse.redirect(new URL('/', request.url))
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - manifest.json (PWA manifest)
         * - sw.js (Service Worker)
         * - icons/ (PWA icons)
         */
        '/((?!_next/static|_next/image|favicon.ico|manifest\\.json|sw\\.js|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
