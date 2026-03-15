'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '../../components/AdminLayout';
import Link from 'next/link';

const PERSONA_LABELS = {
  strongLeader: '願景型領導人',
  leanLeader: '創新型領導人',
  balanced: '雙棲型人才',
  leanManager: '策略型經理人',
  strongManager: '秩序型經理人',
};

const PERSONA_TYPES = {
  strongLeader: 'leader',
  leanLeader: 'leader',
  balanced: 'leader',
  leanManager: 'manager',
  strongManager: 'manager',
};

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/admin/login');
      return;
    }
    fetchStats(token);
  }, [router]);

  async function fetchStats(token) {
    try {
      const res = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      const data = await res.json();
      setStats(data);
    } catch {
      setError('無法載入統計資料');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AdminLayout title="儀表板">
      {loading ? (
        <div className="loading">載入中...</div>
      ) : error ? (
        <div className="error-msg">{error}</div>
      ) : stats ? (
        <>
          {/* Stat cards */}
          <div className="stat-cards">
            <div className="stat-card">
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">累計測驗次數</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.today}</div>
              <div className="stat-label">今日測驗次數</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: 'var(--leader-color)' }}>
                {stats.byPersona.strongLeader + stats.byPersona.leanLeader + stats.byPersona.balanced}
              </div>
              <div className="stat-label">領導人型</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: 'var(--manager-color)' }}>
                {stats.byPersona.leanManager + stats.byPersona.strongManager}
              </div>
              <div className="stat-label">經理人型</div>
            </div>
          </div>

          {/* Persona breakdown */}
          <div className="card-section">
            <div className="card-section-title">人格類型分布</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {Object.entries(stats.byPersona).map(([key, count]) => {
                const total = stats.total || 1;
                const pct = Math.round((count / total) * 100);
                return (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ width: '120px', fontSize: '13px', color: 'var(--muted)', flexShrink: 0 }}>
                      {PERSONA_LABELS[key]}
                    </span>
                    <div style={{ flex: 1, height: '8px', background: 'var(--border)' }}>
                      <div style={{
                        height: '100%',
                        width: `${pct}%`,
                        background: PERSONA_TYPES[key] === 'leader' ? 'var(--leader-color)' : 'var(--manager-color)',
                        transition: 'width 0.5s ease',
                      }} />
                    </div>
                    <span style={{ width: '60px', fontSize: '13px', fontWeight: '700', color: 'var(--ink)', textAlign: 'right' }}>
                      {count} ({pct}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent responses */}
          <div className="card-section">
            <div className="card-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>最近測驗紀錄</span>
              <Link href="/admin/responses" className="admin-btn outline small">
                查看全部
              </Link>
            </div>
            {stats.recentResponses && stats.recentResponses.length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>日期</th>
                    <th>人格類型</th>
                    <th>領導人%</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentResponses.map((r) => (
                    <tr key={r.id}>
                      <td>{formatDate(r.created_at)}</td>
                      <td>
                        <span className={`badge ${PERSONA_TYPES[r.persona_type] || 'leader'}`}>
                          {PERSONA_LABELS[r.persona_type] || r.persona_type}
                        </span>
                      </td>
                      <td style={{ fontWeight: '700' }}>{r.leader_pct}%</td>
                      <td>
                        <Link href={`/admin/responses/${r.id}`} className="admin-btn outline small">
                          詳情
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">
                <p>尚無測驗紀錄</p>
              </div>
            )}
          </div>
        </>
      ) : null}
    </AdminLayout>
  );
}
