import { MetadataRoute } from 'next';

// 🛑 必须加这一行，否则静态导出模式会报错
export const dynamic = 'force-static';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '天算AI·生命哨兵',
    short_name: '天算守护',
    description: '全天候老年人跌倒检测与智能监护系统',
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#000000',
    orientation: 'portrait',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
