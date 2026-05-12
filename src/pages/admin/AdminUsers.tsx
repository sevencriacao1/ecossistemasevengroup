import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Layout } from '../../components/Layout';
import { fetchApi } from '../../lib/api';
import { Search, MoreVertical, Shield, Building2, UserCircle } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Skeleton } from '../../components/ui/Skeleton';

interface Profile {
  id: string;
  username: string;
  full_name: string;
  role: string;
  company: string;
  created_at: string;
}

export function AdminUsers() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function fetchUsers() {
      try {
        const data = await fetchApi<Profile[]>('/api/admin/users');
        setUsers(data);
      } catch (error) {
        console.error('Erro ao buscar usuarios:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUsers();
  }, []);

  const filteredUsers = users.filter((u) =>
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.full_name && u.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <Layout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-2xl font-semibold text-text tracking-tight">Gestão de Usuários</h1>
          <p className="text-sm text-text-muted mt-1">Gerencie acessos, empresas e permissões do ecossistema.</p>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-surface/50 backdrop-blur-sm border border-surface-border rounded-xl overflow-hidden shadow-sm"
      >
        <div className="p-4 border-b border-surface-border flex items-center gap-4 bg-surface/30">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-text-dark absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Buscar por nome ou usuario..."
              className="pl-9 bg-background/50 border-surface-border/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <span className="px-2 py-1 rounded-md bg-surface border border-surface-border">{users.length} total</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface/50 text-text-dark font-medium border-b border-surface-border">
              <tr>
                <th className="px-6 py-4">Usuário</th>
                <th className="px-6 py-4">Empresa</th>
                <th className="px-6 py-4">Nivel de Acesso</th>
                <th className="px-6 py-4">Data de Criação</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><Skeleton className="h-10 w-48" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-28 rounded-full" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-24" /></td>
                    <td className="px-6 py-4 text-right"><Skeleton className="h-8 w-8 ml-auto" /></td>
                  </tr>
                ))
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-text-muted">
                    Nenhum usuário encontrado no Banco de Dados.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, index) => (
                  <motion.tr
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    key={user.id}
                    className="hover:bg-surface/50 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-surface-active border border-surface-border flex items-center justify-center text-text-muted group-hover:border-primary/30 transition-colors">
                          <UserCircle className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-medium text-text">{user.full_name || 'Usuário'}</p>
                          <p className="text-xs text-text-dark">@{user.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-text-dark" />
                        <span className="text-text-muted">{user.company}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                        user.role === 'admin'
                          ? 'bg-primary/10 text-primary border-primary/20'
                          : 'bg-surface-active text-text-muted border-surface-border'
                      }`}>
                        {user.role === 'admin' && <Shield className="w-3 h-3" />}
                        {user.role === 'admin' ? 'Administrador' : 'Colaborador'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-text-muted">
                      {new Date(user.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-1.5 text-text-dark hover:text-text rounded-md hover:bg-surface-active transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </Layout>
  );
}
