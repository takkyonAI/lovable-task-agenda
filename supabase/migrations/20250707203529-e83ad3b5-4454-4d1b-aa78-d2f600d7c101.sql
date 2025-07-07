
-- Verificar se o usuário admin já existe e criar se necessário
-- Como não podemos inserir diretamente na tabela auth.users, vamos atualizar o perfil de um usuário existente para admin
-- Primeiro, vamos verificar se existe algum usuário com esse email
DO $$
BEGIN
  -- Se não existir nenhum usuário admin, vamos criar um perfil padrão
  IF NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE role = 'admin') THEN
    -- Inserir um perfil admin temporário (será atualizado quando o usuário fizer signup)
    INSERT INTO public.user_profiles (user_id, name, email, role, is_active)
    VALUES (
      '00000000-0000-0000-0000-000000000000'::uuid,
      'Administrador',
      'wadevenga@hotmail.com',
      'admin',
      true
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
END $$;

-- Atualizar qualquer usuário existente com este email para ser admin
UPDATE public.user_profiles 
SET role = 'admin', name = 'Administrador', is_active = true
WHERE email = 'wadevenga@hotmail.com';
