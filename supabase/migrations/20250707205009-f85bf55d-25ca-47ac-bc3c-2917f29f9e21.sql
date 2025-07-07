
-- 1. Criar função para lidar com novos usuários (trigger estava faltando)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    'vendedor' -- role padrão
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Criar trigger para novos usuários
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Criar função para verificar role do usuário (evita recursão infinita)
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.user_profiles WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- 4. Remover políticas problemáticas que causam recursão
DROP POLICY IF EXISTS "Usuários podem ver perfis pela hierarquia" ON public.user_profiles;
DROP POLICY IF EXISTS "Usuários podem atualizar perfis pela hierarquia" ON public.user_profiles;

-- 5. Criar novas políticas usando a função segura
CREATE POLICY "Usuários podem ver seus próprios perfis" 
  ON public.user_profiles FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Admins e franqueados podem ver todos os perfis" 
  ON public.user_profiles FOR SELECT 
  USING (public.get_current_user_role() IN ('admin', 'franqueado'));

CREATE POLICY "Coordenadores podem ver perfis específicos" 
  ON public.user_profiles FOR SELECT 
  USING (
    public.get_current_user_role() = 'coordenador' AND 
    role IN ('coordenador', 'professor', 'supervisor_adm', 'assessora_adm')
  );

CREATE POLICY "Supervisores ADM podem ver perfis específicos" 
  ON public.user_profiles FOR SELECT 
  USING (
    public.get_current_user_role() = 'supervisor_adm' AND 
    role IN ('coordenador', 'professor', 'supervisor_adm', 'assessora_adm')
  );

CREATE POLICY "Usuários podem atualizar seus próprios perfis" 
  ON public.user_profiles FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Admins e franqueados podem atualizar todos os perfis" 
  ON public.user_profiles FOR UPDATE 
  USING (public.get_current_user_role() IN ('admin', 'franqueado'));

-- 6. Criar perfil para o usuário admin existente (se ainda não existir)
INSERT INTO public.user_profiles (user_id, name, email, role, is_active)
SELECT 
  au.id,
  'Administrador',
  'wadevenga@hotmail.com',
  'admin',
  true
FROM auth.users au
WHERE au.email = 'wadevenga@hotmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.user_profiles up 
    WHERE up.user_id = au.id
  );
