import { swFonte } from '../../lib/sw-fonte';

// Gerado no build: o cache dos arquivos só liga em produção (ver src/lib/sw-fonte.ts).
export const dynamic = 'force-static';

export function GET() {
  return new Response(swFonte(process.env.NODE_ENV === 'production'), {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'public, max-age=0, must-revalidate',
      'Service-Worker-Allowed': '/',
    },
  });
}
