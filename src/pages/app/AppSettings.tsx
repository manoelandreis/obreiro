import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAppAuth } from '@/hooks/useAppAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SectionHeader } from '@/components/app/SectionHeader';
import { UserCircle, AtSign, KeyRound, Upload, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AppSettings() {
  const { user, signOut } = useAppAuth();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  // Account
  const [fullName, setFullName] = useState('');
  const [avatarPath, setAvatarPath] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  // Email change
  const [email, setEmail] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [updatingEmail, setUpdatingEmail] = useState(false);

  // Password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const loadAvatarSignedUrl = async (path: string) => {
    const { data } = await supabase.storage.from('avatars').createSignedUrl(path, 3600);
    if (data?.signedUrl) setAvatarUrl(data.signedUrl);
  };

  useEffect(() => {
    if (!user) return;
    setEmail(user.email ?? '');
    supabase.from('app_user_settings')
      .select('full_name, avatar_url')
      .eq('user_id', user.id).maybeSingle().then(({ data }) => {
        if (data) {
          setFullName(data.full_name ?? '');
          setAvatarPath((data as any).avatar_url ?? null);
          if ((data as any).avatar_url) loadAvatarSignedUrl((data as any).avatar_url);
        }
      });
  }, [user]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) return toast.error('A imagem deve ter no máximo 5MB.');
    if (!file.type.startsWith('image/')) return toast.error('Apenas ficheiros de imagem.');

    setUploadingAvatar(true);
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (upErr) {
      setUploadingAvatar(false);
      return toast.error('Erro ao carregar imagem.');
    }
    if (avatarPath) {
      await supabase.storage.from('avatars').remove([avatarPath]);
    }
    const { error: dbErr } = await supabase.from('app_user_settings')
      .upsert({ user_id: user.id, avatar_url: path }, { onConflict: 'user_id' });
    if (dbErr) {
      setUploadingAvatar(false);
      return toast.error('Erro a guardar avatar.');
    }
    setAvatarPath(path);
    await loadAvatarSignedUrl(path);
    setUploadingAvatar(false);
    toast.success('Foto atualizada.');
  };

  const removeAvatar = async () => {
    if (!user || !avatarPath) return;
    await supabase.storage.from('avatars').remove([avatarPath]);
    await supabase.from('app_user_settings')
      .upsert({ user_id: user.id, avatar_url: null }, { onConflict: 'user_id' });
    setAvatarPath(null);
    setAvatarUrl(null);
    toast.success('Foto removida.');
  };

  const saveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    const { error } = await supabase.from('app_user_settings')
      .upsert({ user_id: user.id, full_name: fullName.trim() || null }, { onConflict: 'user_id' });
    setSavingProfile(false);
    if (error) return toast.error('Erro a guardar perfil.');
    toast.success('Perfil guardado.');
  };

  const updateEmail = async () => {
    if (!newEmail || newEmail === email) return toast.error('Indique um novo email diferente do atual.');
    setUpdatingEmail(true);
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    setUpdatingEmail(false);
    if (error) return toast.error(error.message);
    toast.success('Confirmação enviada para o novo email.');
    setNewEmail('');
  };

  const updatePassword = async () => {
    if (newPassword.length < 8) return toast.error('A password deve ter pelo menos 8 caracteres.');
    if (newPassword !== confirmPassword) return toast.error('As passwords não coincidem.');
    if (!currentPassword) return toast.error('Indique a password atual.');

    setUpdatingPassword(true);
    const { error: signErr } = await supabase.auth.signInWithPassword({ email: email, password: currentPassword });
    if (signErr) {
      setUpdatingPassword(false);
      return toast.error('Password atual incorreta.');
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setUpdatingPassword(false);
    if (error) return toast.error(error.message);
    toast.success('Password atualizada.');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const deleteAll = async () => {
    if (!confirm('Eliminar TODOS os seus dados (clientes, trabalhos, definições)? Esta ação é irreversível.')) return;
    if (!user) return;
    if (avatarPath) await supabase.storage.from('avatars').remove([avatarPath]);
    await Promise.all([
      supabase.from('app_clients').delete().eq('user_id', user.id),
      supabase.from('app_jobs').delete().eq('user_id', user.id),
      supabase.from('app_user_settings').delete().eq('user_id', user.id),
    ]);
    toast.success('Dados eliminados.');
    await signOut();
    navigate('/app/login');
  };

  const initials = (fullName || email || 'U').slice(0, 2).toUpperCase();

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-heading text-3xl font-bold">Conta</h1>
        <p className="text-muted-foreground">Gira o seu perfil e segurança.</p>
      </div>

      {/* Dados da Conta */}
      <Card>
        <CardContent className="pt-6 space-y-6">
          <SectionHeader icon={UserCircle} title="Dados da Conta" />

          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              {avatarUrl ? <AvatarImage src={avatarUrl} alt={fullName} /> : null}
              <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                {avatarUrl ? <UserCircle className="h-8 w-8" /> : initials}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploadingAvatar}>
                  <Upload className="h-4 w-4 mr-2" />
                  {uploadingAvatar ? 'A carregar...' : avatarUrl ? 'Mudar foto' : 'Carregar foto'}
                </Button>
                {avatarUrl && (
                  <Button variant="ghost" size="sm" onClick={removeAvatar} className="text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" /> Remover
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">PNG ou JPG. Máximo 5MB.</p>
            </div>
          </div>

          <div>
            <Label>Nome</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="O seu nome" />
          </div>

          <Button onClick={saveProfile} disabled={savingProfile} size="sm">
            {savingProfile ? 'A guardar...' : 'Guardar perfil'}
          </Button>
        </CardContent>
      </Card>

      {/* Email */}
      <Card>
        <CardContent className="pt-6 space-y-6">
          <SectionHeader icon={AtSign} title="Email" />

          <div className="space-y-3">
            <div className="font-semibold">Alterar email</div>
            <div>
              <Label>Email atual</Label>
              <Input value={email} disabled />
            </div>
            <div>
              <Label>Novo email</Label>
              <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="novo@exemplo.com" />
            </div>
            <Button onClick={updateEmail} disabled={updatingEmail} size="sm" variant="outline">
              {updatingEmail ? 'A enviar...' : 'Alterar email'}
            </Button>
            <p className="text-xs text-muted-foreground">Receberá um email de confirmação no novo endereço.</p>
          </div>
        </CardContent>
      </Card>

      {/* Palavra-passe */}
      <Card>
        <CardContent className="pt-6 space-y-6">
          <SectionHeader icon={KeyRound} title="Palavra-passe" />

          <div className="space-y-3">
            <div className="font-semibold">Alterar password</div>
            <div>
              <Label>Password atual</Label>
              <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Nova password</Label>
                <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              </div>
              <div>
                <Label>Confirmar nova password</Label>
                <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              </div>
            </div>
            <Button onClick={updatePassword} disabled={updatingPassword} size="sm" variant="outline">
              {updatingPassword ? 'A atualizar...' : 'Alterar password'}
            </Button>
            <p className="text-xs text-muted-foreground">Mínimo 8 caracteres.</p>
          </div>
        </CardContent>
      </Card>

      {/* Save / Danger */}
      <Card>
        <CardContent className="pt-6 space-y-3">
          <Button className="w-full bg-foreground hover:bg-foreground/90 text-background">
            Guardar Alterações
          </Button>
          <Button variant="ghost" className="w-full bg-destructive/5 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={deleteAll}>
            Eliminar Todos os Dados
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
