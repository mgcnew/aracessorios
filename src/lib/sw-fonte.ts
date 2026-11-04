// Código do service worker (servido em /sw.js por src/app/sw.js/route.ts).
// Duas funções: (1) avisos push do painel (NOT-DEC-001) e (2) PWA da loja e do painel: cache dos arquivos
// estáticos e página de "sem conexão". O cache só liga em produção: em desenvolvimento ele serviria arquivos
// velhos e atrapalharia o recarregamento a quente.
//
// O que NUNCA é guardado: páginas (HTML), dados do catálogo, /admin e /api. Preço e estoque vêm sempre da
// rede; sem rede, a navegação mostra /offline.html. Escrito sem crases nem ${} para caber neste texto.
const FONTE = String.raw`
const CACHE_ATIVO = __CACHE__;
const ESTATICO = 'estatico-v1';
const IMAGENS = 'imagens-v1';
const OFFLINE = 'offline-v1';
const ATUAIS = [ESTATICO, IMAGENS, OFFLINE];
const PRE = ['/offline.html', '/icons/loja-192.png'];

self.addEventListener('install', (event) => {
  const pre = CACHE_ATIVO ? caches.open(OFFLINE).then((c) => c.addAll(PRE)).catch(() => {}) : Promise.resolve();
  event.waitUntil(pre.then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      for (const nome of await caches.keys()) if (!ATUAIS.includes(nome)) await caches.delete(nome);
      await self.clients.claim();
    })(),
  );
});

// Mantém só os últimos "max" arquivos de um cache (o mais antigo sai primeiro).
async function limitar(nome, max) {
  const c = await caches.open(nome);
  const chaves = await c.keys();
  for (let i = 0; i < chaves.length - max; i++) await c.delete(chaves[i]);
}

// Arquivos de /_next/static têm o conteúdo no nome: nunca ficam velhos, então vale o que já está guardado.
async function cachePrimeiro(req) {
  const c = await caches.open(ESTATICO);
  const guardado = await c.match(req);
  if (guardado) return guardado;
  const r = await fetch(req);
  if (r.ok) {
    c.put(req, r.clone());
    limitar(ESTATICO, 150);
  }
  return r;
}

// Imagens: mostra a guardada na hora e atualiza em segundo plano.
async function revalidar(req) {
  const c = await caches.open(IMAGENS);
  // Procura em todos os caches: o ícone da página "sem conexão" mora no cache dela.
  const guardado = await caches.match(req);
  const rede = fetch(req)
    .then((r) => {
      if (r.ok) {
        c.put(req, r.clone());
        limitar(IMAGENS, 80);
      }
      return r;
    })
    .catch(() => guardado || Response.error());
  return guardado || rede;
}

self.addEventListener('fetch', (event) => {
  if (!CACHE_ATIVO) return;
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Páginas: sempre da rede (preço e estoque atuais). Sem rede, a página de "sem conexão".
  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).catch(async () => (await caches.match('/offline.html')) || Response.error()));
    return;
  }
  const p = url.pathname;
  if (p.startsWith('/admin') || p.startsWith('/api')) return;
  if (p.startsWith('/_next/static/')) {
    event.respondWith(cachePrimeiro(req));
    return;
  }
  if (/^\/(icons|hero|categorias|marca)\//.test(p)) event.respondWith(revalidar(req));
});

// Avisos push do painel. Só mostra o que o servidor mandou: título, texto curto e o endereço dentro do
// painel; sem dado de cliente.
self.addEventListener('push', (event) => {
  let d = {};
  try {
    d = event.data ? event.data.json() : {};
  } catch (e) {
    d = { body: event.data ? event.data.text() : '' };
  }
  event.waitUntil(
    (async () => {
      // O iOS exige mostrar uma notificação a cada push; por isso sempre mostramos.
      await self.registration.showNotification(d.title || 'AR Acessórios', {
        body: d.body || '',
        icon: '/icons/painel-192.png',
        badge: '/icons/painel-192.png',
        tag: d.tag,
        data: { url: d.url || '/admin?aba=avisos' },
      });
      // Número no ícone do aplicativo (iOS 16.4+ e computador), quando o aparelho permite.
      if (typeof d.badge === 'number' && self.navigator.setAppBadge) {
        try {
          await self.navigator.setAppBadge(d.badge);
        } catch (e) {
          /* sem permissão para o contador: segue sem ele */
        }
      }
      // Janelas abertas do painel atualizam o sino sem esperar.
      const janelas = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      janelas.forEach((j) => j.postMessage({ tipo: 'aviso' }));
    })(),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = new URL((event.notification.data && event.notification.data.url) || '/admin?aba=avisos', self.location.origin).href;
  event.waitUntil(
    (async () => {
      const janelas = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const j of janelas) {
        if (j.url.startsWith(self.location.origin + '/admin') && 'focus' in j) {
          await j.focus();
          try {
            await j.navigate(url);
          } catch (e) {
            /* o navegador não deixa navegar: a janela em foco já basta */
          }
          return;
        }
      }
      await self.clients.openWindow(url);
    })(),
  );
});
`;

export const swFonte = (cache: boolean) => FONTE.replace('__CACHE__', cache ? 'true' : 'false');
