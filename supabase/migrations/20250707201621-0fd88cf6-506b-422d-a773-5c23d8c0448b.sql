
-- Criar tabela user_profiles
CREATE TABLE public.user_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'franqueado', 'vendedor', 'professor', 'coordenador', 'assessora_adm', 'supervisor_adm')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  password_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- Habilitar RLS na tabela user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Política para inserção de perfis (apenas usuários autenticados podem criar seus próprios perfis)
CREATE POLICY "Usuários pueden crear su propio perfil" 
  ON public.user_profiles FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Política para visualização (usuários podem ver seus próprios perfis e baseado na hierarquia)
CREATE POLICY "Usuários podem ver perfis pela hierarquia" 
  ON public.user_profiles FOR SELECT 
  USING (
    -- Usuário pode ver seu próprio perfil
    auth.uid() = user_id OR
    -- Admin e Franqueado veem todos
    EXISTS (
      SELECT 1 FROM public.user_profiles up1
      WHERE up1.user_id = auth.uid() AND up1.role IN ('admin', 'franqueado')
    ) OR
    -- Coordenador vê: coordenador, professor, supervisor_adm, assessora_adm
    EXISTS (
      SELECT 1 FROM public.user_profiles up1
      WHERE up1.user_id = auth.uid() AND up1.role = 'coordenador'
      AND role IN ('coordenador', 'professor', 'supervisor_adm', 'assessora_adm')
    ) OR
    -- Supervisor ADM vê: coordenador, professor, supervisor_adm, assessora_adm
    EXISTS (
      SELECT 1 FROM public.user_profiles up1
      WHERE up1.user_id = auth.uid() AND up1.role = 'supervisor_adm'
      AND role IN ('coordenador', 'professor', 'supervisor_adm', 'assessora_adm')
    )
  );

-- Política para atualização (usuários podem atualizar seus próprios perfis, admin e franqueado podem atualizar todos)
CREATE POLICY "Usuários podem atualizar perfis pela hierarquia" 
  ON public.user_profiles FOR UPDATE 
  USING (
    -- Usuário pode atualizar seu próprio perfil
    auth.uid() = user_id OR
    -- Admin e Franqueado podem atualizar todos
    EXISTS (
      SELECT 1 FROM public.user_profiles up1
      WHERE up1.user_id = auth.uid() AND up1.role IN ('admin', 'franqueado')
    )
  );

-- Função para criar perfil automaticamente quando usuário se registra
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

-- Trigger para criar perfil automaticamente
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
