// src/mocks/handlers/datatable.ts
import { http, HttpResponse } from 'msw';

// helper: ?sort[]=name:asc&sort[]=createdAt:desc
function parseSort(params: URLSearchParams) {
  const sorts = params.getAll('sort[]');
  return sorts.map(s => {
    const [id, dir] = s.split(':');
    return { id, desc: String(dir).toLowerCase() === 'desc' };
  });
}

export const datatableHandlers = [
  http.get('/api/v1/demo/list', ({ request }) => {
    const url = new URL(request.url);
    const sort = parseSort(url.searchParams);

    let items = [
      { id: '1', name: 'Charlie' },
      { id: '2', name: 'Alice' },
      { id: '3', name: 'Bob' },
    ];

    // jednoduchá server-side sort simulace (1. klíč stačí pro ukázku)
    if (sort.length) {
      const { id, desc } = sort[0];
      items = items.sort((a: any, b: any) => {
        const va = a[id]; const vb = b[id];
        return desc ? String(vb).localeCompare(String(va)) : String(va).localeCompare(String(vb));
      });
    }

    return HttpResponse.json({ items, total: items.length });
  }),
];
