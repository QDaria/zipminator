import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/auth/', '/dashboard/'],
      },
    ],
    sitemap: 'https://zipminator.zip/sitemap.xml',
  }
}
