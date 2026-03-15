'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '../../../components/AdminLayout';
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
  return d.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ResponsesPage() {
  const router = useRouter();
  const [responses, setResponses] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [personaFilter, setPersonaFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/admin/login');
      return;
    }
    fetchResponses(token, page, personaFilter);
  }, [page, personaFilter, router]);

  async function fetchResponses(token, p, filter) {
    setLoading(true);
    try {
      let url = `/api/admin/responses?page=${p}&limit=20`;
      if (filter) url += `&personaType=${filter}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      const data = await res.json();
      setResponses(data.responses || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } finally {
      setLoading(false);
    }
  }

  function handleFilterChange(e) {
    setPersonaFilter(e.target.value);
    setPage(1);
  }

  return (
    <AdminLayout title="測驗紀錄">
      <div className="filter-bar">
        <span style={{ fontSize: '13px', color: 'var(--muted)' }}>共 {total} 筆</span>
        <div className="form-group" style={{ margin: 0 }}>
          <select
            value={personaFilter}
            onChange={handleFilterChange}
            style={{ padding: '8px 12px', fontSize: '13px', border: '1.5px solid var(--border)', background: '#fff', fontFamily: 'var(--font-sans)' }}
          >
            <option value="">全部類型</option>
            {Object.entries(PERSONA_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading">載入中...</div>
      ) : responses.length === 0 ? (
        <div className="empty-state">
          <p>尚無測驗紀錄</p>
        </div>
      ) : (
        <>
          <table className="data-table">
            <thead>
              <tr>
                <th>日期</th>
                <th>姓名</th>
                <th>年級</th>
                <th>人格類型</th>
                <th>領導人%</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {responses.map((r) => (
                <tr key={r.id}>
                  <td style={{ fontSize: '13px', color: 'var(--muted)' }}>{formatDate(r.created_at)}</td>
                  <td style={{ fontWeight: '600' }}>{r.name || '—'}</td>
                  <td style={{ fontSize: '13px', color: 'var(--muted)' }}>{r.grade || '—'}</td>
                  <td>
                    <span className={`badge ${PERSONA_TYPES[r.persona_type] || 'leader'}`}>
                      {PERSONA_LABELS[r.persona_type] || r.persona_type}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontWeight: '700', color: r.leader_pct >= 50 ? 'var(--leader-color)' : 'var(--manager-color)' }}>
                      {r.leader_pct}%
                    </span>
                  </td>
                  <td>
                    <Link href={`/admin/responses/${r.id}`} className="admin-btn outline small">
                      詳情
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                ← 上一頁
              </button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let p;
                if (totalPages <= 7) {
                  p = i + 1;
                } else if (page <= 4) {
                  p = i + 1;
                } else if (page >= totalPages - 3) {
                  p = totalPages - 6 + i;
                } else {
                  p = page - 3 + i;
                }
                return (
                  <button
                    key={p}
                    className={page === p ? 'active' : ''}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                下一頁 →
              </button>
            </div>
          )}
        </>
      )}
    </AdminLayout>
  );
}
