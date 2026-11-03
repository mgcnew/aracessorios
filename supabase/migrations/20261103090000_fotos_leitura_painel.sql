-- Fotos: o painel precisa LER os arquivos do bucket para conseguir apagá-los.
-- O Storage localiza o arquivo com SELECT antes do DELETE; sem esta regra,
-- remove() responde sem erro e não apaga nada (arquivo órfão).
-- Só o admin logado; visitantes continuam sem listar o bucket (as fotos abrem pelo link público).
create policy "painel lê fotos" on storage.objects for select to authenticated
  using (bucket_id = 'produtos' and (select public.is_admin()));
