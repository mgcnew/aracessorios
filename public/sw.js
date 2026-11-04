// Service worker do painel: recebe os avisos push com o painel fechado (NOT-DEC-001).
// Só mostra o que o servidor mandou: título, texto curto e o endereço dentro do painel; sem dado de cliente.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let d = {};
  try {
    d = event.data ? event.data.json() : {};
  } catch {
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
        } catch {
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
          } catch {
            /* navegador não deixa navegar: a janela em foco já basta */
          }
          return;
        }
      }
      await self.clients.openWindow(url);
    })(),
  );
});
