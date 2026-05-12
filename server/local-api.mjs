import http from 'node:http';
import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const env = Object.fromEntries(
  fs.readFileSync(new URL('../.env', import.meta.url), 'utf8')
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      const [key, ...rest] = line.split('=');
      return [key, rest.join('=').replace(/^"|"$/g, '')];
    })
);

const supabaseUrl = env.VITE_SUPABASE_URL;
const anonKey = env.VITE_SUPABASE_ANON_KEY;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !anonKey || !serviceRoleKey) {
  throw new Error('Missing Supabase environment variables.');
}

const authClient = createClient(supabaseUrl, anonKey);
const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const sendJson = (res, status, body) => {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(body));
};

const getBearerToken = (req) => {
  const header = req.headers.authorization || '';
  const [type, token] = header.split(' ');
  return type?.toLowerCase() === 'bearer' ? token : null;
};

const getSessionUser = async (req) => {
  const token = getBearerToken(req);
  if (!token) return { error: 'Missing bearer token.' };

  const { data, error } = await authClient.auth.getUser(token);
  if (error || !data.user) return { error: 'Invalid session.' };
  return { user: data.user };
};

const getProfile = async (userId) => {
  return adminClient
    .from('profiles')
    .select('id, username, full_name, role, company, created_at')
    .eq('id', userId)
    .single();
};

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', 'http://127.0.0.1:8787');

    if (req.method !== 'GET' || !url.pathname.startsWith('/api/')) {
      sendJson(res, 404, { error: 'Not found.' });
      return;
    }

    const { user, error: sessionError } = await getSessionUser(req);
    if (sessionError) {
      sendJson(res, 401, { error: sessionError });
      return;
    }

    const { data: profile, error: profileError } = await getProfile(user.id);
    if (profileError || !profile) {
      sendJson(res, 404, { error: profileError?.message || 'Profile not found.' });
      return;
    }

    if (url.pathname === '/api/profile') {
      sendJson(res, 200, profile);
      return;
    }

    if (url.pathname === '/api/modules') {
      let query = adminClient
        .from('modules')
        .select('*')
        .order('order_index', { ascending: true });

      if (profile.role !== 'admin') {
        query = query.in('company', ['Seven', profile.company]);
      }

      const { data, error } = await query;
      if (error) throw error;
      sendJson(res, 200, data || []);
      return;
    }

    if (url.pathname === '/api/progress') {
      const { data, error } = await adminClient
        .from('user_progress')
        .select('*')
        .eq('user_id', profile.id);
      if (error) throw error;
      sendJson(res, 200, data || []);
      return;
    }

    if (url.pathname === '/api/admin/users') {
      if (profile.role !== 'admin') {
        sendJson(res, 403, { error: 'Admin access required.' });
        return;
      }

      const { data, error } = await adminClient
        .from('profiles')
        .select('id, username, full_name, role, company, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      sendJson(res, 200, data || []);
      return;
    }

    sendJson(res, 404, { error: 'Not found.' });
  } catch (error) {
    sendJson(res, 500, { error: error.message || 'Internal server error.' });
  }
});

server.listen(8787, '127.0.0.1', () => {
  console.log('Local Supabase API running at http://127.0.0.1:8787');
});
